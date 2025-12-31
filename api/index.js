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

    // Insert user
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hashedPassword]
    );

    const user = result.rows[0];

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
    const activeSystemMessage = systemMessage || defaultSystemMessage;

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
        timestamp: new Date().toISOString()
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
      // Create new user
      result = await pool.query(
        'INSERT INTO users (name, email, google_id, avatar_url) VALUES ($1, $2, $3, $4) RETURNING id, name, email',
        [googleUser.name, googleUser.email, googleUser.id, googleUser.picture]
      );
      user = result.rows[0];
    } else {
      // Update existing user
      result = await pool.query(
        'UPDATE users SET google_id = $1, avatar_url = $2, last_login = NOW() WHERE email = $3 RETURNING id, name, email',
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

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}?token=${token}&user=${encodeURIComponent(JSON.stringify({ name: user.name, email: user.email }))}`);

  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}?error=oauth_failed`);
  }
});

// Export handler para Vercel
export default function handler(req, res) {
  return app(req, res);
}
