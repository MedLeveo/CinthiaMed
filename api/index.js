// Vercel Serverless Function Handler
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import OpenAI from 'openai';
import rateLimit from 'express-rate-limit';

const { Pool } = pg;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY?.replace(/\s+/g, '') || ''
});

const app = express();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// CORS com configurações mais seguras
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://cinthiamed.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Rate Limiting para login - 5 tentativas por 15 minutos
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Não contar tentativas bem-sucedidas
});

// Rate Limiting para registro - 3 contas por hora por IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  message: { error: 'Muitas tentativas de registro. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate Limiting geral para API
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // 100 requisições por minuto
  message: { error: 'Muitas requisições. Tente novamente em breve.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware de autenticação
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'fallback-secret');
    req.user = decoded; // Adiciona informações do usuário à requisição
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

// Aplicar rate limiting geral
app.use('/api', apiLimiter);

// Cache de conversas em memória (temporário até migrar DB para Vercel)
const conversationCache = new Map();

/**
 * Detecta se a mensagem é uma pergunta médica que se beneficiaria de evidências científicas
 * @param {string} message - Mensagem do usuário
 * @returns {boolean} True se deve buscar evidências
 */
function detectMedicalQuestion(message) {
  const lowerMessage = message.toLowerCase();

  // Palavras-chave que indicam necessidade de busca científica
  const medicalKeywords = [
    'tratamento', 'terapia', 'medicamento', 'droga', 'fármaco',
    'diagnóstico', 'sintoma', 'doença', 'condição', 'patologia',
    'estudo', 'pesquisa', 'evidência', 'artigo', 'publicação',
    'protocolo', 'diretriz', 'guideline', 'recomendação',
    'eficácia', 'efetivo', 'funciona', 'resultado',
    'complicação', 'efeito colateral', 'reação adversa',
    'prevenção', 'rastreio', 'screening',
    'prognóstico', 'evolução', 'sobrevida',
    'incidência', 'prevalência', 'epidemiologia'
  ];

  // Perguntas que indicam busca de conhecimento médico
  const questionPatterns = [
    'qual', 'quais', 'como', 'quando', 'onde', 'por que', 'porque',
    'existe', 'há', 'tem', 'pode', 'deve', 'é recomendado',
    'o que é', 'como tratar', 'como diagnosticar'
  ];

  // Verificar se contém palavra-chave médica
  const hasMedicalKeyword = medicalKeywords.some(keyword => lowerMessage.includes(keyword));

  // Verificar se é uma pergunta
  const isQuestion = questionPatterns.some(pattern => lowerMessage.includes(pattern)) ||
                     lowerMessage.includes('?');

  // Buscar evidências se for uma pergunta médica ou mencionar termos médicos
  return hasMedicalKeyword || (isQuestion && lowerMessage.length > 15);
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register
app.post('/api/auth/register', registerLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validar inputs
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres' });
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash password com 12 rounds (mais seguro)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Gerar token de verificação de email (válido por 24 horas)
    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Insert user com email_verified = FALSE
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, email_verified, verification_token, verification_token_expires)
       VALUES ($1, $2, $3, FALSE, $4, $5)
       RETURNING id, name, email`,
      [name, email, hashedPassword, verificationToken, verificationExpires]
    );

    const user = result.rows[0];

    // 📧 Enviar email de VERIFICAÇÃO (não de boas-vindas)
    const { sendVerificationEmail } = require('./services/emailService');
    sendVerificationEmail(user.email, user.name, verificationToken).catch(error => {
      console.error('⚠️ Falha ao enviar email de verificação (não bloqueante):', error.message);
    });

    // NÃO gerar token JWT ainda - usuário precisa verificar o email primeiro
    res.json({
      message: 'Conta criada com sucesso! Verifique seu email para ativar sua conta.',
      email: user.email,
      requiresVerification: true
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erro ao criar conta' });
  }
});

// Login
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar inputs
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const user = result.rows[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    // 🔒 VERIFICAR SE O EMAIL FOI VERIFICADO
    if (!user.email_verified) {
      return res.status(403).json({
        error: 'Email não verificado',
        message: 'Por favor, verifique seu email antes de fazer login. Cheque sua caixa de entrada.',
        requiresVerification: true
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.SESSION_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.json({
      user: { name: user.name, email: user.email },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Verify token
app.get('/api/auth/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'fallback-secret');

    res.json({ valid: true, userId: decoded.userId });

  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

// Verificar email (validar token de verificação)
app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token de verificação não fornecido' });
    }

    // Buscar usuário pelo token de verificação
    const result = await pool.query(
      'SELECT id, name, email, verification_token_expires FROM users WHERE verification_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Token de verificação inválido' });
    }

    const user = result.rows[0];

    // Verificar se o token expirou
    if (new Date() > new Date(user.verification_token_expires)) {
      return res.status(400).json({ error: 'Token de verificação expirado. Solicite um novo email de verificação.' });
    }

    // Marcar usuário como verificado e limpar token
    await pool.query(
      `UPDATE users
       SET email_verified = TRUE,
           verification_token = NULL,
           verification_token_expires = NULL
       WHERE id = $1`,
      [user.id]
    );

    // 📧 Enviar email de boas-vindas AGORA (após verificação)
    const { sendWelcomeEmail } = require('./services/emailService');
    sendWelcomeEmail(user.email, user.name).catch(error => {
      console.error('⚠️ Falha ao enviar email de boas-vindas (não bloqueante):', error.message);
    });

    // Gerar token JWT para login automático
    const authToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.SESSION_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Email verificado com sucesso! Você já pode fazer login.',
      user: { name: user.name, email: user.email },
      token: authToken
    });

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Erro ao verificar email' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logout realizado' });
});

// Google OAuth - Redirect to Google
app.get('/api/auth/google', (req, res) => {
  const googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL,
    response_type: 'code',
    scope: 'email profile',
    access_type: 'offline',
    prompt: 'consent'
  });

  res.redirect(`${googleAuthUrl}?${params.toString()}`);
});

// Chat endpoint - COM AUTENTICAÇÃO (cache em memória)
app.post('/api/chat', authMiddleware, async (req, res) => {
  try {
    const { message, assistantType = 'geral', conversationId, systemMessage } = req.body;
    const userId = req.user.userId;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Mensagem não pode estar vazia'
      });
    }

    // Recuperar histórico do cache (chave: userId_conversationId)
    let conversationHistory = [];
    const newConversationId = conversationId || `conv_${userId}_${Date.now()}`;
    const cacheKey = `${userId}_${newConversationId}`;

    if (conversationId && conversationCache.has(cacheKey)) {
      conversationHistory = conversationCache.get(cacheKey);
    }

    // System message dinâmico baseado no contexto do frontend
    const defaultSystemMessage = 'Você é a CinthiaMed, uma assistente médica virtual altamente especializada e confiável. Base suas respostas em evidências científicas.';
    let activeSystemMessage = systemMessage || defaultSystemMessage;

    // 🔬 BUSCA CIENTÍFICA AUTOMÁTICA
    // Detectar se é uma pergunta médica que se beneficiaria de evidências
    const shouldSearchEvidence = detectMedicalQuestion(message);
    let evidenciasContext = '';

    if (shouldSearchEvidence) {
      try {
        console.log(`🔬 Detectada pergunta médica. Buscando evidências para: "${message}"`);

        // Importar serviço de busca científica
        const { buscarEvidencias, formatarParaPrompt } = require('./services/scientificSearch');

        // Buscar evidências (3 resultados por fonte para não sobrecarregar)
        const resultados = await buscarEvidencias(message, 3);

        // Se encontrou resultados, formatar para incluir no contexto
        if (resultados.resumo.totalResultados > 0) {
          evidenciasContext = formatarParaPrompt(resultados, 2); // Máximo 2 artigos por fonte

          // Adicionar instruções ao system message
          activeSystemMessage += `\n\n# EVIDÊNCIAS CIENTÍFICAS ATUALIZADAS\n\n${evidenciasContext}\n\n**INSTRUÇÕES IMPORTANTES:**\n- Use as evidências científicas fornecidas acima para fundamentar sua resposta\n- Cite os artigos quando apropriado (ex: "Segundo estudo publicado em [ano]...")\n- Se as evidências contradizerem seu conhecimento base, priorize as evidências\n- Sempre inclua links para os artigos ao final da resposta quando relevante\n- Mantenha tom profissional e baseado em evidências`;

          console.log(`✅ ${resultados.resumo.totalResultados} evidências encontradas e adicionadas ao contexto`);
        } else {
          console.log(`⚠️ Nenhuma evidência encontrada, prosseguindo com conhecimento base`);
        }
      } catch (error) {
        // Se busca falhar, continuar sem evidências (fail gracefully)
        console.error('❌ Erro ao buscar evidências científicas:', error.message);
        console.log('⚠️ Continuando sem evidências externas');
      }
    }

    // Gerar resposta com GPT
    const messages = [
      { role: 'system', content: activeSystemMessage },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      temperature: 0.7,
      max_tokens: 3000
    });

    const response = completion.choices[0].message.content;

    // Atualizar cache com novo histórico
    conversationHistory.push(
      { role: 'user', content: message },
      { role: 'assistant', content: response }
    );
    conversationCache.set(cacheKey, conversationHistory);

    // Limpar cache antigo (manter apenas últimas 100 conversas)
    if (conversationCache.size > 100) {
      const firstKey = conversationCache.keys().next().value;
      conversationCache.delete(firstKey);
    }

    res.json({
      success: true,
      conversationId: newConversationId,
      response: response,
      metadata: {
        model: 'gpt-4o',
        context: assistantType,
        timestamp: new Date().toISOString(),
        evidenceUsed: shouldSearchEvidence && evidenciasContext.length > 0,
        evidenceSources: shouldSearchEvidence && evidenciasContext.length > 0
          ? ['Semantic Scholar', 'Europe PMC', 'ClinicalTrials.gov']
          : []
      }
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao processar mensagem',
      message: error.message
    });
  }
});

// Medical record analysis endpoint - COM AUTENTICAÇÃO
app.post('/api/medical-record', authMiddleware, async (req, res) => {
  try {
    const { transcript, patientName, patientAge, patientGender, observations } = req.body;

    if (!transcript || transcript.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Transcrição não pode estar vazia'
      });
    }

    const prompt = `Analise a seguinte consulta médica e gere um prontuário estruturado:

Paciente: ${patientName || 'Não informado'}
Idade: ${patientAge || 'Não informada'}
Sexo: ${patientGender || 'Não informado'}
Observações: ${observations || 'Nenhuma'}

Transcrição da consulta:
${transcript}

Gere um prontuário médico completo e estruturado em formato Markdown com as seguintes seções:
## Identificação do Paciente
## Anamnese
## Exame Físico
## Hipóteses Diagnósticas
## Conduta / Plano Terapêutico
## Observações`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Você é um médico especialista em elaborar prontuários médicos detalhados e bem estruturados.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 3000
    });

    const report = completion.choices[0].message.content;

    res.json({
      success: true,
      report: report,
      metadata: {
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Medical record error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar prontuário',
      message: error.message
    });
  }
});

// Process consultation endpoint (with audio transcription support) - COM AUTENTICAÇÃO
app.post('/api/medical-record/process-consultation', authMiddleware, async (req, res) => {
  try {
    const { audioData, patientData } = req.body;

    if (!audioData) {
      return res.status(400).json({
        success: false,
        error: 'Áudio não fornecido'
      });
    }

    // Convert base64 to buffer and create a File-like object for Whisper
    const base64Audio = audioData.includes(',') ? audioData.split(',')[1] : audioData;
    const audioBuffer = Buffer.from(base64Audio, 'base64');

    // Create a File object from buffer (required by OpenAI Whisper API)
    const file = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' });

    // Transcribe audio using Whisper
    const transcriptionResponse = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'pt'
    });

    const transcript = transcriptionResponse.text;

    if (!transcript || transcript.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Não foi possível transcrever o áudio'
      });
    }

    // Generate medical report
    const prompt = `Analise a seguinte consulta médica e gere um prontuário estruturado:

Paciente: ${patientData?.name || 'Não informado'}
Idade: ${patientData?.age || 'Não informada'}
Sexo: ${patientData?.gender || 'Não informado'}
Observações: ${patientData?.observations || 'Nenhuma'}

Transcrição da consulta:
${transcript}

Gere um prontuário médico completo e estruturado em formato Markdown com as seguintes seções:
## Identificação do Paciente
## Anamnese
## Exame Físico
## Hipóteses Diagnósticas
## Conduta / Plano Terapêutico
## Observações`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Você é um médico especialista em elaborar prontuários médicos detalhados e bem estruturados.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 3000
    });

    const report = completion.choices[0].message.content;

    res.json({
      success: true,
      report: report,
      transcript: transcript,
      metadata: {
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Process consultation error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao processar consulta',
      message: error.message
    });
  }
});

// Google OAuth Callback
app.get('/api/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}?error=no_code`);
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      return res.redirect(`${process.env.FRONTEND_URL}?error=token_error`);
    }

    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    const googleUser = await userResponse.json();

    // Check if user exists
    let result = await pool.query('SELECT * FROM users WHERE email = $1', [googleUser.email]);

    let user;
    if (result.rows.length === 0) {
      // Create new user - Google OAuth users são sempre verificados
      result = await pool.query(
        'INSERT INTO users (name, email, google_id, avatar_url, email_verified) VALUES ($1, $2, $3, $4, TRUE) RETURNING id, name, email',
        [googleUser.name, googleUser.email, googleUser.id, googleUser.picture]
      );
      user = result.rows[0];
    } else {
      // Update existing user - marcar como verificado se veio do Google
      result = await pool.query(
        'UPDATE users SET google_id = $1, avatar_url = $2, email_verified = TRUE, last_login = NOW() WHERE email = $3 RETURNING id, name, email',
        [googleUser.id, googleUser.picture, googleUser.email]
      );
      user = result.rows[0];
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.SESSION_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    // Renderizar HTML com auto-submit form (evita token na URL)
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Autenticando...</title>
          <style>
            body {
              background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              font-family: 'Outfit', sans-serif;
              color: #e2e8f0;
            }
            .loader {
              text-align: center;
            }
            .spinner {
              border: 3px solid rgba(139, 92, 246, 0.3);
              border-top-color: #8b5cf6;
              border-radius: 50%;
              width: 50px;
              height: 50px;
              animation: spin 1s linear infinite;
              margin: 0 auto 20px;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="loader">
            <div class="spinner"></div>
            <p>Autenticando com Google...</p>
          </div>
          <form id="authForm" action="${process.env.FRONTEND_URL}/oauth-callback" method="POST" style="display:none;">
            <input type="hidden" name="token" value="${token}" />
            <input type="hidden" name="name" value="${user.name}" />
            <input type="hidden" name="email" value="${user.email}" />
          </form>
          <script>
            // Auto-submit via localStorage (mais seguro que query params)
            localStorage.setItem('authToken', '${token}');
            localStorage.setItem('userName', '${user.name}');
            localStorage.setItem('userEmail', '${user.email}');
            window.location.href = '${process.env.FRONTEND_URL}';
          </script>
        </body>
      </html>
    `;
    res.send(html);

  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}?error=oauth_failed`);
  }
});

// Export handler para Vercel
export default function handler(req, res) {
  return app(req, res);
}
