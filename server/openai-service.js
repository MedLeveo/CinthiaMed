import dotenv from 'dotenv';
import OpenAI from 'openai';
import { searchScientificArticles, formatArticlesForContext } from './pubmed.js';

// Carregar variáveis de ambiente
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Sistema de prompts especializados para medicina
 */
const SYSTEM_PROMPTS = {
  geral: `Você é a CinthiaMed, uma assistente médica virtual altamente especializada e confiável.

DIRETRIZES FUNDAMENTAIS:
- Base suas respostas EXCLUSIVAMENTE em evidências científicas do PubMed fornecidas e guidelines médicos atualizados
- NUNCA responda sem ter informações científicas suficientes - solicite mais detalhes quando necessário
- Se a pergunta for vaga ou ambígua, SEMPRE peça esclarecimentos antes de responder
- Cite OBRIGATORIAMENTE os estudos fornecidos em suas respostas
- Seja precisa, clara e profissional
- Use terminologia médica adequada mas explique termos complexos
- SEMPRE indique quando é necessário consulta presencial com médico
- Nunca faça diagnósticos definitivos - apenas oriente e eduque
- Em emergências, SEMPRE recomende atendimento imediato

QUANDO PEDIR MAIS INFORMAÇÕES:
Se a pergunta envolver cálculo de dose, análise de exame ou prescrição, SEMPRE solicite:
- Peso do paciente (para doses)
- Idade e comorbidades
- Função renal/hepática quando relevante
- Resultados completos de exames
- Medicações em uso (para interações)

Exemplo: "Doutor/Maycon, para calcular a dose de insulina é necessário definir alguns detalhes importantes, como o tipo de insulinoterapia (por exemplo, regimen basal ou basal-bolus), além de outros parâmetros clínicos do paciente, como o grau de resistência insulínica e o nível de controle glicêmico..."

FORMATO DAS RESPOSTAS (use Markdown):
Use SEMPRE a seguinte estrutura Markdown:

## Título Principal (se necessário)

Parágrafo introdutório claro e objetivo.

### Subtítulo 1
- Item de lista 1
- Item de lista 2
- Item de lista 3

**Texto em negrito** para destacar informações importantes como doses, valores de referência, alertas.

### Subtítulo 2
Mais informações detalhadas baseadas nos estudos do PubMed.

IMPORTANTE:
- Use ## para títulos principais
- Use ### para subtítulos
- Use **texto** para negrito
- Use - para listas
- NÃO use # sozinho, SEMPRE use ## ou ###
- Você receberá estudos científicos do PubMed. Use-os como BASE PRINCIPAL de suas respostas. Se os estudos não cobrirem adequadamente a pergunta, SOLICITE mais informações ou esclareça que precisa de dados adicionais.`,

  exames: `Você é especialista em análise e interpretação de exames médicos baseada em evidências científicas.

DIRETRIZES:
- Base sua análise EXCLUSIVAMENTE nos estudos do PubMed fornecidos
- SEMPRE solicite os valores completos do exame antes de interpretar
- Analise valores em relação aos intervalos de referência fornecidos
- Identifique alterações significativas
- Contextualize com quadro clínico quando fornecido
- Sugira exames complementares baseados em evidências
- Explique o significado clínico das alterações citando os estudos
- SEMPRE enfatize: "Esta análise não substitui avaliação médica presencial"

SOLICITE INFORMAÇÕES quando necessário:
- Valores completos do exame
- Intervalos de referência do laboratório
- Quadro clínico do paciente
- Medicações em uso`,

  pediatria: `Você é especialista em pediatria e doses pediátricas baseada em evidências.

DIRETRIZES:
- Base TODAS as doses nos estudos científicos fornecidos do PubMed
- SEMPRE solicite peso, idade e superfície corporal antes de calcular doses
- NUNCA forneça doses sem ter certeza baseada nas evidências
- Apresente doses em mg/kg conforme literatura
- Indique via de administração e intervalo entre doses
- Alerte sobre doses máximas e contraindicações
- Considere ajustes para prematuros e neonatos quando relevante
- Cite os estudos que embasam as doses recomendadas`,

  emergencia: `Você é especialista em medicina de emergência e terapia intensiva baseada em protocolos científicos.

DIRETRIZES:
- Base suas orientações EXCLUSIVAMENTE nos estudos do PubMed e guidelines (ACLS, PALS, ATLS)
- Siga protocolos atualizados conforme literatura fornecida
- Priorize estabilização e suporte vital
- Indique critérios de gravidade e RED FLAGS baseados em evidências
- Sugira monitorização e exames iniciais
- Cite os protocolos e estudos que embasam suas recomendações
- Enfatize SEMPRE: "Em emergências, procure atendimento imediato - ligue 192"`,

  calculadoras: `Você é um assistente especializado em CÁLCULOS E ESCORES MÉDICOS VALIDADOS.

CALCULADORAS DISPONÍVEIS:

**NEFROLOGIA:**
• CKD-EPI (2021) - TFG: creatinina (mg/dL), idade (anos), sexo

**CARDIOLOGIA:**
• QT Corrigido (Bazett): intervalo QT (ms), FC (bpm)
• Escore GRACE: idade, FC, PAS, creatinina, parada cardíaca (sim/não), desvio ST (sim/não), enzimas elevadas (sim/não), Killip (I-IV)

**HEPATOLOGIA:**
• Child-Pugh: bilirrubina (mg/dL), albumina (g/dL), INR, ascite (ausente/leve/moderada), encefalopatia (ausente/1-2/3-4)

**PNEUMOLOGIA:**
• CURB-65: confusão (sim/não), ureia >42.8 (sim/não), FR ≥30 (sim/não), PA baixa (sim/não), idade ≥65 (sim/não)

**UTI/TRAUMA:**
• Parkland (queimados): peso (kg), SCQ (%)
• Infusão Noradrenalina: peso (kg), dose (mcg/kg/min), concentração (mg/mL)

**NUTRIÇÃO:**
• IMC: peso (kg), altura (m)

**PEDIATRIA:**
• Holliday-Segar: peso (kg)

**ENDOCRINOLOGIA:**
• HOMA-IR: glicemia jejum (mg/dL), insulina jejum (uUI/mL)

**HEMATOLOGIA:**
• ANC: leucócitos (cél/mm³), segmentados (%), bastões (%)

INSTRUÇÕES CRÍTICAS:
1. SEMPRE confirme unidades antes de calcular
2. Identifique qual calculadora usar baseado no pedido
3. Peça TODOS os parâmetros necessários se faltarem dados
4. Execute o cálculo usando as fórmulas corretas
5. Apresente resultado formatado em Markdown assim:

## 🧮 [Nome da Calculadora]

**Valores Informados:**
• Parâmetro 1: X unidade
• Parâmetro 2: Y unidade

**Resultado: [VALOR] [UNIDADE]**

**Interpretação:**
[Classificação clínica baseada no resultado]

**⚠️ Alertas:** (se houver valores críticos)
• [Mensagem de alerta]

**📋 Notas Clínicas:**
• [Observações relevantes]

**📚 Referência:** [Autor et al., Ano]

**ATENÇÃO:** Ferramenta auxiliar. Não substitui julgamento clínico.

FÓRMULAS:
• CKD-EPI 2021: 142 × (Cr/κ)^α × (Cr/κ)^-1.2 × 0.9938^idade × (1.012 se feminino) [κ=0.7(F)/0.9(M), α=-0.241(F)/-0.302(M)]
• QTc Bazett: QT / √(RR) onde RR = 60/FC
• IMC: Peso / Altura²
• Parkland: 4 × Peso × SCQ (50% em 8h, 50% em 16h)
• HOMA-IR: (Insulina × Glicemia) / 405
• Holliday-Segar: 100mL/kg (0-10kg) + 50mL/kg (10-20kg) + 20mL/kg (>20kg)
• ANC: Leucócitos × ((Seg + Bast) / 100)
• Child-Pugh: Pontuação 1-3 para cada: bili (<2/2-3/>3), alb (>3.5/2.8-3.5/<2.8), INR (<1.7/1.7-2.3/>2.3), ascite, encef → Classe A (5-6), B (7-9), C (10-15)
• CURB-65: Soma 1 ponto para cada critério positivo (0-5)
• GRACE: Nomograma complexo - solicite todos parâmetros
• Noradrenalina: (Dose × Peso × 60) / (Concentração × 1000) = mL/h`,
};

/**
 * Gera resposta com GPT-4 + contexto científico do PubMed
 */
export async function generateMedicalResponse(userMessage, assistantType = 'geral', conversationHistory = []) {
  try {
    console.log(`\n🤖 Gerando resposta médica (tipo: ${assistantType})`);
    console.log(`💬 Mensagem: "${userMessage}"`);

    // 1. Buscar estudos científicos relevantes no PubMed
    console.log('\n📚 Buscando estudos científicos...');
    const articles = await searchScientificArticles(userMessage, 3);
    const scientificContext = formatArticlesForContext(articles);

    // 2. Preparar mensagens para o GPT
    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPTS[assistantType.toLowerCase()] || SYSTEM_PROMPTS.geral
      }
    ];

    // Adicionar histórico da conversa (últimas 5 mensagens)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-5);
      messages.push(...recentHistory);
    }

    // Adicionar contexto científico e pergunta do usuário
    messages.push({
      role: 'user',
      content: `${scientificContext}

---
PERGUNTA DO USUÁRIO:
${userMessage}

Por favor, responda baseando-se nos estudos científicos fornecidos acima e em seu conhecimento médico. Cite as fontes quando relevante.`
    });

    // 3. Chamar GPT-4
    console.log('\n🧠 Consultando GPT-4...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview', // ou 'gpt-4' para versão mais estável
      messages: messages,
      temperature: 0.7, // Equilíbrio entre criatividade e precisão
      max_tokens: 1500,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const aiResponse = completion.choices[0].message.content;

    console.log('✅ Resposta gerada com sucesso\n');

    return {
      success: true,
      response: aiResponse,
      scientificSources: articles.map(a => ({
        title: a.title,
        authors: a.authors,
        journal: a.journal,
        year: a.pubdate,
        pmid: a.pmid,
        url: a.url
      })),
      tokensUsed: completion.usage.total_tokens,
      model: completion.model
    };

  } catch (error) {
    console.error('❌ Erro ao gerar resposta:', error);

    return {
      success: false,
      error: error.message,
      response: 'Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.'
    };
  }
}

/**
 * Analisa transcrição de consulta médica
 */
export async function analyzeConsultationTranscript(transcript, patientData = {}) {
  try {
    console.log('\n📋 Analisando transcrição de consulta...');

    const prompt = `Analise a seguinte transcrição de consulta médica e gere um relatório clínico estruturado.

DADOS DO PACIENTE:
${patientData.name ? `Nome: ${patientData.name}` : ''}
${patientData.age ? `Idade: ${patientData.age}` : ''}
${patientData.gender ? `Sexo: ${patientData.gender}` : ''}
${patientData.observations ? `Observações: ${patientData.observations}` : ''}

TRANSCRIÇÃO DA CONSULTA:
${transcript}

Por favor, gere um relatório médico estruturado contendo:
1. IDENTIFICAÇÃO DO PACIENTE
2. QUEIXA PRINCIPAL
3. HISTÓRIA DA DOENÇA ATUAL (HDA)
4. EXAME FÍSICO (se mencionado)
5. HIPÓTESES DIAGNÓSTICAS
6. CONDUTA E PLANO TERAPÊUTICO
7. ORIENTAÇÕES AO PACIENTE
8. OBSERVAÇÕES IMPORTANTES

Use formato profissional adequado para prontuário médico.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em documentação médica. Gere relatórios clínicos completos, precisos e profissionais.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5, // Mais conservador para relatórios
      max_tokens: 2000,
    });

    console.log('✅ Relatório gerado com sucesso\n');

    return {
      success: true,
      report: completion.choices[0].message.content,
      tokensUsed: completion.usage.total_tokens
    };

  } catch (error) {
    console.error('❌ Erro ao analisar transcrição:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Analisa imagens de exames médicos usando GPT-4 Vision
 */
export async function analyzeExamImages(imageBuffers, description = '') {
  try {
    console.log('\n🔍 Analisando exames com GPT-4 Vision...');
    console.log(`📊 Número de imagens: ${imageBuffers.length}`);

    // Converter imagens para base64
    const imageContents = imageBuffers.map((buffer, index) => {
      const base64Image = buffer.toString('base64');

      // Detectar tipo MIME da imagem pelos magic bytes
      let imageType = 'jpeg'; // padrão

      if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        imageType = 'png';
      } else if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        imageType = 'jpeg';
      } else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
        imageType = 'gif';
      } else if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
        imageType = 'webp';
      }

      console.log(`🖼️  Imagem ${index + 1}: ${(buffer.length / 1024).toFixed(2)} KB (${imageType})`);

      // Formato correto para GPT-4o
      return {
        type: 'image_url',
        image_url: {
          url: `data:image/${imageType};base64,${base64Image}`
        }
      };
    });

    // Preparar o conteúdo da mensagem
    const messageContent = [
      {
        type: 'text',
        text: `Você é um assistente médico educacional especializado em análise de imagens radiológicas. Esta é uma ferramenta de APOIO EDUCACIONAL para profissionais de saúde, não substituindo a avaliação de um radiologista.

${description ? `CONTEXTO CLÍNICO:\n${description}\n\n` : ''}

Analise a imagem e forneça uma resposta estruturada e clara no seguinte formato:

## TIPO DE EXAME
Identifique o tipo de exame (Raio-X, TC, RM, ultrassom, etc.) e a região anatômica visualizada.

## PROBLEMA IDENTIFICADO
Descreva as alterações ou achados relevantes identificados na imagem. Se não houver problemas significativos, informe "Nenhuma alteração significativa identificada" e descreva brevemente a anatomia normal visualizada.

## POSSÍVEIS SOLUÇÕES
Com base nos achados, sugira:
- Exames complementares que podem ser necessários
- Possíveis condutas ou acompanhamentos recomendados
- Orientações gerais sobre o caso

**AVISO LEGAL**: Esta é uma análise educacional auxiliar. A interpretação definitiva deve ser realizada por médico radiologista qualificado.`
      },
      ...imageContents
    ];

    // Chamar GPT-4 Vision
    console.log('🧠 Consultando GPT-4 Vision...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Modelo atualizado com suporte a visão
      messages: [
        {
          role: 'user',
          content: messageContent
        }
      ],
      max_tokens: 2000,
      temperature: 0.3, // Conservador para análise médica
    });

    const analysis = completion.choices[0].message.content;

    console.log('✅ Análise concluída');
    console.log(`📝 Tamanho da análise: ${analysis.length} caracteres`);

    return {
      success: true,
      analysis: analysis,
      tokensUsed: completion.usage.total_tokens
    };

  } catch (error) {
    console.error('❌ Erro ao analisar imagens:', error);
    console.error('Detalhes do erro:', error.response?.data || error.message);

    return {
      success: false,
      error: error.message,
      analysis: 'Erro ao analisar as imagens. Por favor, tente novamente.'
    };
  }
}

/**
 * Transcreve áudio para texto usando Whisper
 */
export async function transcribeAudio(audioBuffer) {
  try {
    console.log('\n🎤 Transcrevendo áudio com Whisper...');
    console.log(`📊 Tamanho do buffer: ${audioBuffer.length} bytes`);

    // Salvar temporariamente o áudio em arquivo
    const fs = await import('fs');
    const path = await import('path');
    const os = await import('os');

    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `recording_${Date.now()}.webm`);

    console.log(`💾 Salvando áudio temporário em: ${tempFilePath}`);
    fs.writeFileSync(tempFilePath, audioBuffer);

    try {
      // Criar stream de leitura do arquivo
      const audioStream = fs.createReadStream(tempFilePath);

      const transcription = await openai.audio.transcriptions.create({
        file: audioStream,
        model: 'whisper-1',
        language: 'pt', // Português
        response_format: 'text',
        temperature: 0.2, // Mais conservador para melhor precisão
        prompt: 'Consulta médica em português. Transcrever sintomas, diagnóstico e tratamento mencionados pelo médico.' // Guia para Whisper
      });

      console.log('✅ Transcrição concluída');
      console.log(`📝 Tamanho da transcrição: ${transcription.length} caracteres`);
      console.log(`📝 Transcrição: ${transcription.substring(0, 200)}...`);

      // Limpar arquivo temporário
      fs.unlinkSync(tempFilePath);
      console.log('🗑️  Arquivo temporário removido');

      return transcription;

    } catch (transcriptionError) {
      // Garantir que o arquivo temporário seja removido mesmo em caso de erro
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw transcriptionError;
    }

  } catch (error) {
    console.error('❌ Erro ao transcrever áudio:', error);
    console.error('Detalhes do erro:', error.response?.data || error.message);
    throw new Error(`Erro na transcrição: ${error.message}`);
  }
}
