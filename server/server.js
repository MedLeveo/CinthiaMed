import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import session from 'express-session';
import passport from 'passport';
import { generateMedicalResponse, analyzeConsultationTranscript, transcribeAudio, analyzeExamImages } from './openai-service.js';

// Importar rotas de autenticação
import { router as authRouter } from './routes/auth.js';
import medicalRecordRouter from './routes/medical-record.js';
import { initializeDatabase } from './database/db.js';
import { configurePassport } from './config/passport.js';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000; // Mudando para 5000 para evitar conflito com React

// Configurar Passport
configurePassport();

// Configurar multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB (limite do Whisper)
  },
});

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Para transcrições longas

// Configurar sessão (necessário para Passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'cinthiamed_session_secret_2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // true em produção com HTTPS
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
  }
}));

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// Registrar rotas de autenticação
app.use('/api/auth', authRouter);

// Registrar rotas de prontuário médico
app.use('/api/medical-record', medicalRecordRouter);

// Cache simples em memória
const conversationCache = new Map();

/**
 * Rota de saúde
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CinthiaMed API está funcionando!',
    timestamp: new Date().toISOString(),
    endpoints: {
      chat: 'POST /api/chat',
      analyzeConsultation: 'POST /api/analyze-consultation',
      analyzeExam: 'POST /api/analyze-exam-image'
    }
  });
});

/**
 * Rota principal de chat
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, assistantType = 'geral', conversationId } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Mensagem não pode estar vazia'
      });
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📨 Nova mensagem recebida`);
    console.log(`Tipo: ${assistantType}`);
    console.log(`ID Conversa: ${conversationId || 'nova'}`);
    console.log(`${'='.repeat(60)}\n`);

    // Recuperar histórico da conversa
    let conversationHistory = [];
    if (conversationId && conversationCache.has(conversationId)) {
      conversationHistory = conversationCache.get(conversationId);
    }

    // Gerar resposta com GPT-4 + PubMed
    const result = await generateMedicalResponse(
      message,
      assistantType,
      conversationHistory
    );

    if (!result.success) {
      return res.status(500).json(result);
    }

    // Atualizar histórico da conversa
    const newConversationId = conversationId || `conv_${Date.now()}`;
    conversationHistory.push(
      { role: 'user', content: message },
      { role: 'assistant', content: result.response }
    );
    conversationCache.set(newConversationId, conversationHistory);

    // Limpar cache antigo (manter apenas últimas 100 conversas)
    if (conversationCache.size > 100) {
      const firstKey = conversationCache.keys().next().value;
      conversationCache.delete(firstKey);
    }

    res.json({
      success: true,
      conversationId: newConversationId,
      response: result.response,
      scientificSources: result.scientificSources,
      metadata: {
        model: result.model,
        tokensUsed: result.tokensUsed,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erro na rota /api/chat:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * Rota para análise de transcrição de consulta (suporta áudio e texto)
 */
app.post('/api/analyze-consultation', upload.single('audio'), async (req, res) => {
  try {
    const audioFile = req.file;
    const { transcript, patientData, patientName, patientAge, patientGender, observations } = req.body;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 Análise de consulta solicitada`);

    let transcriptionText = transcript;

    console.log(`Paciente: ${patientName || 'Não informado'}`);

    // Se há arquivo de áudio, transcrever primeiro
    if (audioFile) {
      console.log(`🎤 Arquivo de áudio recebido: ${audioFile.size} bytes`);
      console.log(`Tipo: ${audioFile.mimetype}`);

      // Validar tamanho do arquivo
      if (audioFile.size === 0) {
        return res.status(400).json({
          success: false,
          error: 'Arquivo de áudio vazio',
          message: 'O arquivo de áudio recebido está vazio. Por favor, grave novamente.'
        });
      }

      try {
        const audioTranscription = await transcribeAudio(audioFile.buffer);

        // Se já há uma transcrição manual, concatenar com a transcrição do áudio
        if (transcriptionText && transcriptionText.trim()) {
          transcriptionText = `${transcriptionText}\n\n[Transcrição do áudio]:\n${audioTranscription}`;
          console.log(`✅ Usando transcrição manual + áudio`);
        } else {
          transcriptionText = audioTranscription;
          console.log(`✅ Usando apenas transcrição do áudio`);
        }

        // Validar se a transcrição não está vazia
        if (!transcriptionText || transcriptionText.trim() === '') {
          return res.status(400).json({
            success: false,
            error: 'Transcrição vazia',
            message: 'A transcrição do áudio resultou em texto vazio. Certifique-se de falar durante a gravação e tente novamente.'
          });
        }

        console.log(`✅ Transcrição total: ${transcriptionText.length} caracteres`);
      } catch (transcribeError) {
        console.error('❌ Erro na transcrição:', transcribeError);
        return res.status(500).json({
          success: false,
          error: 'Erro ao transcrever áudio',
          message: transcribeError.message
        });
      }
    } else if (!transcriptionText || transcriptionText.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'É necessário fornecer um arquivo de áudio ou uma transcrição'
      });
    } else {
      console.log(`✅ Usando apenas transcrição manual`);
    }

    console.log(`${'='.repeat(60)}\n`);

    // Preparar dados do paciente
    const patientInfo = patientData || {
      name: patientName,
      age: patientAge,
      gender: patientGender,
      observations: observations
    };

    // Gerar relatório com GPT-4
    const result = await analyzeConsultationTranscript(transcriptionText, patientInfo);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      report: result.report,
      transcript: transcriptionText, // Retornar transcrição para referência
      metadata: {
        tokensUsed: result.tokensUsed,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erro na rota /api/analyze-consultation:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * Rota para análise de imagens de exames com GPT-4 Vision
 */
app.post('/api/analyze-exam-image', upload.array('images', 5), async (req, res) => {
  try {
    const imageFiles = req.files;
    const { description } = req.body;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔬 Análise de exame de imagem solicitada`);
    console.log(`📊 Número de imagens: ${imageFiles?.length || 0}`);
    if (description) {
      console.log(`📝 Descrição clínica fornecida: ${description.substring(0, 100)}...`);
    }
    console.log(`${'='.repeat(60)}\n`);

    // Validar se há imagens
    if (!imageFiles || imageFiles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma imagem fornecida',
        message: 'Por favor, envie pelo menos uma imagem do exame.'
      });
    }

    // Validar tamanho das imagens
    for (const file of imageFiles) {
      if (file.size === 0) {
        return res.status(400).json({
          success: false,
          error: 'Arquivo de imagem vazio',
          message: 'Uma ou mais imagens estão vazias. Por favor, envie imagens válidas.'
        });
      }
    }

    // Extrair buffers das imagens
    const imageBuffers = imageFiles.map(file => file.buffer);

    // Analisar com GPT-4 Vision
    const result = await analyzeExamImages(imageBuffers, description);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      analysis: result.analysis,
      metadata: {
        imagesAnalyzed: imageFiles.length,
        tokensUsed: result.tokensUsed,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erro na rota /api/analyze-exam-image:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * Rota para limpar histórico de conversa
 */
app.delete('/api/chat/:conversationId', (req, res) => {
  const { conversationId } = req.params;

  if (conversationCache.has(conversationId)) {
    conversationCache.delete(conversationId);
    res.json({
      success: true,
      message: 'Histórico de conversa excluído'
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Conversa não encontrada'
    });
  }
});

/**
 * Middleware de erro 404
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
    availableRoutes: [
      'GET /health',
      'POST /api/chat',
      'POST /api/analyze-consultation',
      'POST /api/analyze-exam-image',
      'DELETE /api/chat/:conversationId'
    ]
  });
});

/**
 * Iniciar servidor
 */
const startServer = async () => {
  try {
    // Inicializar banco de dados
    console.log('🔄 Inicializando banco de dados...');
    await initializeDatabase();
    console.log('✅ Banco de dados inicializado com sucesso!\n');

    app.listen(PORT, () => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🚀 CinthiaMed API rodando!`);
      console.log(`📍 Porta: ${PORT}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`❤️  Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Auth endpoints:`);
      console.log(`   - POST /api/auth/register`);
      console.log(`   - POST /api/auth/login`);
      console.log(`   - POST /api/auth/logout`);
      console.log(`   - GET  /api/auth/verify`);
      console.log(`${'='.repeat(60)}\n`);

      // Verificar se a API key está configurada
      if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️  ATENÇÃO: OPENAI_API_KEY não configurada!');
        console.warn('   Configure sua chave no arquivo .env\n');
      }
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

export default app;

