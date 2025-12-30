import express from 'express';
import OpenAI from 'openai';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configurar multer para upload de áudio
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueName = `audio-${Date.now()}.webm`;
      cb(null, uniqueName);
    },
  }),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limite do Whisper
  },
});

// Endpoint para transcrever áudio
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo de áudio enviado' });
    }

    console.log('🎤 Transcrevendo áudio:', req.file.filename);

    // Transcrever com Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: 'whisper-1',
      language: 'pt',
      response_format: 'verbose_json',
    });

    // Deletar arquivo temporário
    fs.unlinkSync(req.file.path);

    console.log('✅ Transcrição concluída');

    res.json({
      text: transcription.text,
      duration: transcription.duration,
    });
  } catch (error) {
    console.error('❌ Erro na transcrição:', error);

    // Limpar arquivo em caso de erro
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: 'Erro ao transcrever áudio',
      details: error.message
    });
  }
});

// Endpoint para gerar prontuário a partir da transcrição
router.post('/generate-record', async (req, res) => {
  try {
    const { transcription, patientName, patientAge, patientGender } = req.body;

    if (!transcription) {
      return res.status(400).json({ error: 'Transcrição não fornecida' });
    }

    console.log('📝 Gerando prontuário médico...');

    const prompt = `Você é um assistente médico especializado em criar prontuários estruturados a partir de consultas médicas.

DADOS DO PACIENTE:
- Nome: ${patientName || 'Não informado'}
- Idade: ${patientAge || 'Não informada'}
- Sexo: ${patientGender || 'Não informado'}

TRANSCRIÇÃO DA CONSULTA:
${transcription}

---

Analise a transcrição da consulta médica acima e gere um prontuário médico completo e estruturado seguindo o formato SOAP (Subjetivo, Objetivo, Avaliação, Plano). Inclua APENAS as informações que foram mencionadas na consulta.

Organize o prontuário nos seguintes tópicos:

**IDENTIFICAÇÃO DO PACIENTE**
- Nome, idade, sexo

**SUBJETIVO (S)**
- Queixa principal
- História da doença atual (HDA)
- História patológica pregressa (HPP)
- Medicações em uso
- Alergias
- Hábitos de vida relevantes

**OBJETIVO (O)**
- Sinais vitais mencionados
- Exame físico realizado
- Achados do exame físico

**AVALIAÇÃO (A)**
- Hipóteses diagnósticas
- Diagnóstico principal
- Diagnósticos diferenciais (se mencionados)

**PLANO (P)**
- Exames solicitados
- Medicações prescritas (com posologia)
- Orientações ao paciente
- Retorno programado

**OBSERVAÇÕES IMPORTANTES**
- Qualquer informação relevante que não se encaixe nas categorias acima

Se alguma informação não foi mencionada na consulta, escreva "Não avaliado" ou "Não mencionado" na seção correspondente.

Use linguagem médica apropriada, seja conciso e objetivo. Formate o texto de forma clara e profissional.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente médico especializado em documentação clínica. Gere prontuários precisos, completos e bem estruturados seguindo o padrão SOAP.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const medicalRecord = completion.choices[0].message.content;

    console.log('✅ Prontuário gerado com sucesso');

    res.json({
      medicalRecord,
      tokensUsed: completion.usage.total_tokens,
    });
  } catch (error) {
    console.error('❌ Erro ao gerar prontuário:', error);
    res.status(500).json({
      error: 'Erro ao gerar prontuário médico',
      details: error.message
    });
  }
});

// Endpoint combinado: transcrever + gerar prontuário
router.post('/process-consultation', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo de áudio enviado' });
    }

    const { patientName, patientAge, patientGender, clinicalObservations } = req.body;

    console.log('🎤 Processando consulta médica...');
    console.log(`📋 Paciente: ${patientName}, ${patientAge} anos, ${patientGender}`);

    // 1. Transcrever áudio
    console.log('🎤 Etapa 1/2: Transcrevendo áudio...');
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: 'whisper-1',
      language: 'pt',
      response_format: 'verbose_json',
    });

    // Deletar arquivo temporário
    fs.unlinkSync(req.file.path);

    console.log('✅ Transcrição concluída');

    // 2. Gerar prontuário
    console.log('📝 Etapa 2/2: Gerando prontuário...');

    const additionalContext = clinicalObservations
      ? `\n\nOBSERVAÇÕES CLÍNICAS ADICIONAIS:\n${clinicalObservations}`
      : '';

    const prompt = `Você é um assistente médico especializado em criar prontuários estruturados a partir de consultas médicas.

DADOS DO PACIENTE:
- Nome: ${patientName || 'Não informado'}
- Idade: ${patientAge || 'Não informada'}
- Sexo: ${patientGender || 'Não informado'}

TRANSCRIÇÃO DA CONSULTA:
${transcription.text}${additionalContext}

---

Analise a transcrição da consulta médica acima e gere um prontuário médico completo e estruturado seguindo o formato SOAP (Subjetivo, Objetivo, Avaliação, Plano). Inclua APENAS as informações que foram mencionadas na consulta.

Organize o prontuário nos seguintes tópicos:

**IDENTIFICAÇÃO DO PACIENTE**
- Nome, idade, sexo

**SUBJETIVO (S)**
- Queixa principal
- História da doença atual (HDA)
- História patológica pregressa (HPP)
- Medicações em uso
- Alergias
- Hábitos de vida relevantes

**OBJETIVO (O)**
- Sinais vitais mencionados
- Exame físico realizado
- Achados do exame físico

**AVALIAÇÃO (A)**
- Hipóteses diagnósticas
- Diagnóstico principal
- Diagnósticos diferenciais (se mencionados)

**PLANO (P)**
- Exames solicitados
- Medicações prescritas (com posologia)
- Orientações ao paciente
- Retorno programado

**OBSERVAÇÕES IMPORTANTES**
- Qualquer informação relevante que não se encaixe nas categorias acima

Se alguma informação não foi mencionada na consulta, escreva "Não avaliado" ou "Não mencionado" na seção correspondente.

Use linguagem médica apropriada, seja conciso e objetivo. Formate o texto de forma clara e profissional.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente médico especializado em documentação clínica. Gere prontuários precisos, completos e bem estruturados seguindo o padrão SOAP.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const medicalRecord = completion.choices[0].message.content;

    console.log('✅ Prontuário gerado com sucesso');

    res.json({
      transcription: transcription.text,
      duration: transcription.duration,
      medicalRecord,
      tokensUsed: completion.usage.total_tokens,
    });
  } catch (error) {
    console.error('❌ Erro ao processar consulta:', error);

    // Limpar arquivo em caso de erro
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: 'Erro ao processar consulta médica',
      details: error.message
    });
  }
});

export default router;
