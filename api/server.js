// Vercel Serverless Function Handler
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import OpenAI from 'openai';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } from '../lib/services/emailService.js';
import { buscarEvidencias, formatarParaPrompt } from '../lib/services/scientificSearch.js';
import { createMedicalAgentWorkflow, runWorkflowWithStreaming } from '../lib/graph/workflow.js';
import { createInitialState } from '../lib/graph/state.js';
import { suggestTools } from '../lib/utils/toolSuggestions.js';

const { Pool } = pg;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY?.replace(/\s+/g, '') || ''
});

const app = express();

// Trust proxy - necessário para Vercel/proxies reversos
app.set('trust proxy', 1);

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

    // TEMPORÁRIO: Verificação de email desabilitada devido a problemas de conexão Vercel->Brevo
    // TODO: Migrar para Resend.com ou SendGrid que funcionam melhor com Vercel

    // Insert user com email_verified = TRUE (temporariamente)
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, email_verified)
       VALUES ($1, $2, $3, TRUE)
       RETURNING id, name, email`,
      [name, email, hashedPassword]
    );

    const user = result.rows[0];

    // Tentar enviar email de boas-vindas (não bloqueante, pode falhar)
    sendWelcomeEmail(user.email, user.name).catch(error => {
      console.error('⚠️ Falha ao enviar email de boas-vindas:', error.message);
    });

    // Gerar token JWT para login imediato
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.SESSION_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Conta criada com sucesso!',
      user: { name: user.name, email: user.email },
      token
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

    // TEMPORÁRIO: Verificação de email desabilitada
    // TODO: Reativar quando migrar para serviço de email compatível com Vercel

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

// Solicitar recuperação de senha
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    // Verificar se usuário existe
    const result = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email]);

    // Por segurança, sempre retornar sucesso (não revelar se email existe)
    if (result.rows.length === 0) {
      return res.json({ message: 'Se o email existir, você receberá instruções para recuperar sua senha.' });
    }

    const user = result.rows[0];

    // Gerar token de recuperação (válido por 1 hora)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Salvar token no banco
    await pool.query(
      `UPDATE users
       SET password_reset_token = $1, password_reset_expires = $2
       WHERE id = $3`,
      [resetToken, resetTokenExpires, user.id]
    );

    // Enviar email de recuperação
    await sendPasswordResetEmail(user.email, resetToken);

    res.json({ message: 'Se o email existir, você receberá instruções para recuperar sua senha.' });

  } catch (error) {
    console.error('❌ Erro ao solicitar recuperação de senha:', error);
    res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
});

// Redefinir senha com token
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token e senha são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
    }

    // Buscar usuário pelo token
    const result = await pool.query(
      'SELECT id, email, password_reset_expires FROM users WHERE password_reset_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Token de recuperação inválido' });
    }

    const user = result.rows[0];

    // Verificar se token expirou
    if (new Date() > new Date(user.password_reset_expires)) {
      return res.status(400).json({ error: 'Token de recuperação expirado. Solicite uma nova recuperação de senha.' });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Atualizar senha e limpar token
    await pool.query(
      `UPDATE users
       SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    res.json({ message: 'Senha redefinida com sucesso!' });

  } catch (error) {
    console.error('❌ Erro ao redefinir senha:', error);
    res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
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

// Chat endpoint - COM AUTENTICAÇÃO E LANGGRAPH
// Compilar workflow uma vez na inicialização
const medicalAgentWorkflow = createMedicalAgentWorkflow();

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

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🤖 NOVA REQUISIÇÃO - Usuário: ${userId}`);
    console.log(`📝 Pergunta: "${message}"`);
    console.log(`🏷️  Contexto: ${assistantType}`);
    console.log('='.repeat(80));

    // Recuperar histórico do cache
    let conversationHistory = [];
    const newConversationId = conversationId || `conv_${userId}_${Date.now()}`;
    const cacheKey = `${userId}_${newConversationId}`;

    if (conversationId && conversationCache.has(cacheKey)) {
      conversationHistory = conversationCache.get(cacheKey);
    }


    // System message dinâmico
    const defaultSystemMessage = 'Você é a CinthiaMed, uma assistente médica virtual altamente especializada e confiável. Base suas respostas em evidências científicas.';
    const activeSystemMessage = systemMessage || defaultSystemMessage;

    // Criar estado inicial para o workflow
    const initialState = createInitialState({
      user_query: message,
      conversation_history: conversationHistory,
      system_message: activeSystemMessage
    });
    const finalState = await runWorkflowWithStreaming(
      medicalAgentWorkflow,
      initialState,
      (event) => {
        // Log de eventos intermediários (opcional)
        // console.log('Event:', event);
      }
    );

    // Extrair resposta e metadados
    const response = finalState.clinical_synthesis;

    // Atualizar cache com novo histórico (adicionar nova mensagem)
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: message },
      { role: 'assistant', content: response }
    ];
    conversationCache.set(cacheKey, updatedHistory);

    // Limpar cache antigo
    if (conversationCache.size > 100) {
      const firstKey = conversationCache.keys().next().value;
      conversationCache.delete(firstKey);
    }

    // Preparar fontes científicas para o frontend
    const scientificSources = [];

    // Adicionar fontes do Semantic Scholar
    if (finalState.raw_evidence?.semanticScholar?.length > 0) {
      finalState.raw_evidence.semanticScholar.forEach(paper => {
        scientificSources.push({
          title: paper.title,
          authors: paper.authors,
          journal: 'Semantic Scholar',
          year: paper.year,
          url: paper.url
        });
      });
    }

    // Adicionar fontes do Europe PMC
    if (finalState.raw_evidence?.europePmc?.length > 0) {
      finalState.raw_evidence.europePmc.forEach(paper => {
        scientificSources.push({
          title: paper.title,
          authors: paper.authors,
          journal: paper.journal || 'Europe PMC',
          year: paper.year,
          url: paper.url
        });
      });
    }

    // Adicionar fontes do LILACS
    if (finalState.raw_evidence?.lilacs?.length > 0) {
      finalState.raw_evidence.lilacs.forEach(article => {
        scientificSources.push({
          title: article.title,
          authors: article.authors,
          journal: `${article.journal} (LILACS - ${article.country})`,
          year: article.year,
          url: article.url
        });
      });
    }

    console.log('\n📤 ENVIANDO RESPOSTA');
    console.log(`   Fontes: ${finalState.metadata?.sources_used?.join(', ') || 'Nenhuma'}`);
    console.log(`   Evidências: ${finalState.metadata?.evidence_count || 0}`);
    console.log(`   Tempo total: ${finalState.metadata?.total_processing_time_ms || 0}ms`);
    console.log(`   Avisos de segurança: ${finalState.metadata?.has_safety_warnings ? 'SIM' : 'NÃO'}`);
    console.log('='.repeat(80) + '\n');

    // Sugerir ferramentas clínicas relevantes
    const suggestedTools = suggestTools(response, message);

    res.json({
      success: true,
      conversationId: newConversationId,
      response: response,
      scientificSources: scientificSources,
      suggestedTools: suggestedTools,
      metadata: {
        model: finalState.metadata?.model || 'gpt-4o',
        context: assistantType,
        timestamp: new Date().toISOString(),
        evidenceUsed: (finalState.metadata?.evidence_count || 0) > 0,
        evidenceSources: finalState.metadata?.sources_used || [],
        evidenceCount: finalState.metadata?.evidence_count || 0,
        hasSafetyWarnings: finalState.metadata?.has_safety_warnings || false,
        processingTimeMs: finalState.metadata?.total_processing_time_ms || 0,
        revisionAttempts: finalState.revision_count || 0
      }
    });

  } catch (error) {
    console.error('\n❌ ERRO NO CHAT:', error);
    console.error('Stack:', error.stack);

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
    const { audioData, textData, patientData } = req.body;

    // Aceitar texto OU áudio (não obrigatório ter ambos)
    if (!audioData && !textData) {
      return res.status(400).json({
        success: false,
        error: 'Forneça áudio ou texto da consulta'
      });
    }

    let transcript = textData || '';

    // Se houver áudio, transcrever
    if (audioData) {
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

      transcript = transcriptionResponse.text;

      if (!transcript || transcript.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Não foi possível transcrever o áudio'
        });
      }
    }

    // Validar que temos algum conteúdo
    if (!transcript || transcript.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Transcrição ou texto não pode estar vazio'
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

// ============================================
// NOVOS ENDPOINTS - Análise de Exames e SOAP
// ============================================

/**
 * POST /api/analyze-exam
 * Analisa imagem de exame usando GPT-4 Vision
 */
app.post('/api/analyze-exam', async (req, res) => {
  try {
    // Verificar se há arquivo de imagem
    if (!req.body.image) {
      return res.status(400).json({ error: 'Nenhuma imagem fornecida' });
    }

    // Extrair o tipo MIME da imagem e a parte base64
    const imageData = req.body.image;
    const mimeMatch = imageData.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const base64Image = imageData.replace(/^data:image\/\w+;base64,/, '');

    console.log('📋 Analisando exame médico...');
    console.log(`Tipo de imagem: ${mimeType}`);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Você é um assistente médico especializado em análise de exames laboratoriais e de imagem.

IMPORTANTE: Sempre inclua no final da análise o seguinte aviso:
"⚠️ AVISO: Esta é uma análise auxiliada por Inteligência Artificial e NÃO substitui a interpretação de um médico qualificado. Sempre consulte um profissional de saúde para validação."

Analise a imagem do exame e forneça:
1. Tipo de exame identificado
2. Achados principais (valores fora da referência marcados como anormais)
3. Resumo clínico objetivo
4. Recomendações baseadas em evidências científicas (quando aplicável)

Seja objetivo, técnico e use terminologia médica apropriada.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analise este exame médico e forneça um relatório estruturado em JSON com os campos: examType, findings (array de objetos com parameter, value, reference, severity), summary, recommendations.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.3
    });

    const analysis = response.choices[0].message.content;
    console.log('✅ Análise concluída');

    // Tentar parsear JSON se vier nesse formato
    let result;
    try {
      result = JSON.parse(analysis);
    } catch {
      // Se não vier em JSON, estruturar manualmente
      result = {
        examType: 'Exame Médico',
        findings: [],
        summary: analysis,
        recommendations: 'Consultar médico para avaliação detalhada.'
      };
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Erro na análise de exame:', error);
    res.status(500).json({
      error: 'Erro ao analisar exame',
      details: error.message
    });
  }
});

/**
 * POST /api/format-soap
 * Formata transcrição de consulta em formato SOAP
 */
app.post('/api/format-soap', async (req, res) => {
  try {
    const { transcript, patientData } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcrição não fornecida' });
    }

    console.log('🏥 Formatando prontuário em SOAP...');

    // Buscar evidências científicas se necessário
    let evidenciasContext = '';
    if (detectMedicalQuestion(transcript)) {
      try {
        console.log('🔬 Buscando evidências científicas...');
        const evidencias = await buscarEvidencias(transcript);
        if (evidencias && evidencias.length > 0) {
          evidenciasContext = formatarParaPrompt(evidencias);
        }
      } catch (err) {
        console.warn('⚠️  Erro ao buscar evidências:', err.message);
      }
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Você é um assistente médico especializado em estruturação de prontuários eletrônicos.

Formate a transcrição da consulta no formato SOAP:

**S (SUBJETIVO)**: Queixa principal, história da doença atual, sintomas relatados pelo paciente
**O (OBJETIVO)**: Exame físico, sinais vitais, achados objetivos
**A (AVALIAÇÃO)**: Diagnóstico, hipótese diagnóstica, análise clínica, CID se mencionado
**P (PLANO)**: Conduta terapêutica, prescrições, orientações, encaminhamentos, retorno

DIRETRIZES:
- Seja objetivo e use terminologia médica adequada
- Baseie condutas em evidências científicas quando disponíveis
- Se alguma seção não estiver clara na transcrição, indique "Não mencionado na consulta"
- Mantenha a estrutura clara com cada seção bem delimitada

${evidenciasContext ? `\nEVIDÊNCIAS CIENTÍFICAS RELEVANTES:\n${evidenciasContext}` : ''}

SEMPRE inclua ao final:
"⚠️ Prontuário estruturado com auxílio de IA. Revise e valide antes de finalizar."`
        },
        {
          role: 'user',
          content: `Transcrição da consulta:
${transcript}

Dados do paciente:
- Nome: ${patientData?.name || 'Não informado'}
- Idade: ${patientData?.age || 'Não informada'}
- Sexo: ${patientData?.gender || 'Não informado'}

Por favor, formate em SOAP estruturado.`
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });

    const soapText = response.choices[0].message.content;

    // Extrair seções SOAP
    const extractSection = (text, sectionName) => {
      const patterns = [
        new RegExp(`\\*\\*${sectionName}[\\*:]?\\*\\*[\\s]*([\\s\\S]*?)(?=\\n\\s*\\*\\*[SOAP]|$)`, 'i'),
        new RegExp(`${sectionName}[:\n]([\\s\\S]*?)(?=\\n\\n[A-Z]|$)`, 'i')
      ];

      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
      return null;
    };

    const soapData = {
      soap: {
        subjetivo: extractSection(soapText, 'S') || extractSection(soapText, 'SUBJETIVO') || 'Não identificado na transcrição',
        objetivo: extractSection(soapText, 'O') || extractSection(soapText, 'OBJETIVO') || 'Não identificado na transcrição',
        avaliacao: extractSection(soapText, 'A') || extractSection(soapText, 'AVALIAÇÃO') || 'Não identificado na transcrição',
        plano: extractSection(soapText, 'P') || extractSection(soapText, 'PLANO') || 'Não identificado na transcrição'
      },
      patientData: {
        nome: patientData?.name || 'Não informado',
        idade: patientData?.age || 'Não informada',
        sexo: patientData?.gender || 'Não informado'
      },
      timestamp: new Date().toLocaleString('pt-BR'),
      fullText: soapText
    };

    console.log('✅ SOAP formatado com sucesso');
    res.json(soapData);

  } catch (error) {
    console.error('❌ Erro ao formatar SOAP:', error);
    res.status(500).json({
      error: 'Erro ao formatar prontuário',
      details: error.message
    });
  }
});

// Export handler para Vercel
export default function handler(req, res) {
  return app(req, res);
}
