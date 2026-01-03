/**
 * Query Normalizer
 *
 * Normaliza termos de busca para diferentes APIs:
 * - OpenFDA e PubMed: Inglês
 * - LILACS: Português/Espanhol
 */

import { ChatOpenAI } from '@langchain/openai';

const llm = new ChatOpenAI({
  modelName: 'gpt-4o-mini', // Modelo menor para tradução rápida
  temperature: 0.3,
  maxTokens: 200,
  openAIApiKey: process.env.OPENAI_API_KEY?.replace(/\s+/g, '')
});

/**
 * Dicionário de traduções médicas comuns (PT -> EN)
 */
const MEDICAL_TRANSLATIONS = {
  // Medicamentos
  'dipirona': 'metamizole',
  'paracetamol': 'acetaminophen',
  'ácido acetilsalicílico': 'aspirin',
  'ibuprofeno': 'ibuprofen',
  'amoxicilina': 'amoxicillin',
  'azitromicina': 'azithromycin',

  // Doenças
  'diabetes': 'diabetes',
  'hipertensão': 'hypertension',
  'asma': 'asthma',
  'pneumonia': 'pneumonia',
  'gripe': 'influenza',
  'resfriado': 'common cold',
  'febre': 'fever',
  'dor de cabeça': 'headache',
  'enxaqueca': 'migraine',
  'dengue': 'dengue',
  'malária': 'malaria',
  'tuberculose': 'tuberculosis',

  // Tratamentos
  'tratamento': 'treatment',
  'medicamento': 'medication',
  'dose': 'dose',
  'posologia': 'dosage',
  'efeitos colaterais': 'side effects',
  'contraindicações': 'contraindications',

  // Condições
  'gravidez': 'pregnancy',
  'lactação': 'lactation',
  'criança': 'children',
  'idoso': 'elderly',
  'adulto': 'adult'
};

/**
 * Traduz query para inglês (OpenFDA, PubMed)
 */
export async function translateToEnglish(query) {
  console.log(`📝 Traduzindo para inglês: "${query}"`);

  // Tentar tradução por dicionário primeiro (mais rápido)
  const lowerQuery = query.toLowerCase();
  let translated = query;

  for (const [pt, en] of Object.entries(MEDICAL_TRANSLATIONS)) {
    const regex = new RegExp(`\\b${pt}\\b`, 'gi');
    translated = translated.replace(regex, en);
  }

  // Se mudou significativamente, retornar tradução de dicionário
  if (translated.toLowerCase() !== lowerQuery) {
    console.log(`   ✅ Tradução (dicionário): "${translated}"`);
    return translated;
  }

  // Caso contrário, usar LLM para tradução completa
  try {
    const prompt = `Traduza esta pergunta médica do português para o inglês.
Mantenha termos técnicos precisos.
NÃO adicione explicações, apenas retorne a tradução.

Pergunta: ${query}

Tradução:`;

    const response = await llm.invoke([
      { role: 'user', content: prompt }
    ]);

    const translation = response.content.trim();
    console.log(`   ✅ Tradução (LLM): "${translation}"`);

    return translation;

  } catch (error) {
    console.error('Erro na tradução LLM:', error.message);
    return translated; // Fallback para tradução de dicionário
  }
}

/**
 * Mantém query em português/espanhol para LILACS
 */
export function keepPortugueseSpanish(query) {
  // LILACS aceita português e espanhol, apenas retornar original
  return query;
}

/**
 * Detecta idioma da query
 */
export function detectLanguage(query) {
  const portugueseIndicators = ['ção', 'ões', 'ã', 'õ', 'á', 'é', 'ê', 'ó', 'ô'];
  const spanishIndicators = ['ción', 'ñ', 'á', 'é', 'í', 'ó', 'ú'];

  const hasPT = portugueseIndicators.some(ind => query.includes(ind));
  const hasES = spanishIndicators.some(ind => query.includes(ind));

  if (hasPT) return 'pt';
  if (hasES) return 'es';
  return 'en';
}

/**
 * Detecta doenças tropicais/regionais que exigem prioridade LILACS
 */
export function detectRegionalDisease(query) {
  const regionalDiseases = {
    'dengue': { priority: 'MÁXIMA', region: 'Tropical/Brasil' },
    'zika': { priority: 'MÁXIMA', region: 'Tropical/América Latina' },
    'chikungunya': { priority: 'MÁXIMA', region: 'Tropical/Brasil' },
    'febre amarela': { priority: 'MÁXIMA', region: 'Tropical/Brasil' },
    'chagas': { priority: 'MÁXIMA', region: 'América Latina' },
    'leishmaniose': { priority: 'MÁXIMA', region: 'Tropical/Brasil' },
    'malária': { priority: 'ALTA', region: 'Tropical/Mundial' },
    'esquistossomose': { priority: 'ALTA', region: 'Brasil/África' },
    'tuberculose': { priority: 'MÉDIA', region: 'Brasil (SUS)' },
    'hanseníase': { priority: 'ALTA', region: 'Brasil/Tropical' },
    'leptospirose': { priority: 'ALTA', region: 'Brasil' },
    'covid': { priority: 'MÉDIA', region: 'Mundial (protocolos locais)' }
  };

  const queryLower = query.toLowerCase();

  for (const [disease, info] of Object.entries(regionalDiseases)) {
    if (queryLower.includes(disease)) {
      console.log(`🌎 DOENÇA REGIONAL DETECTADA: ${disease.toUpperCase()}`);
      console.log(`   Prioridade LILACS: ${info.priority}`);
      console.log(`   Região: ${info.region}`);
      return {
        detected: true,
        disease,
        ...info
      };
    }
  }

  return { detected: false };
}

/**
 * Gera instrução especial para o Synthesizer quando detecta doença regional
 */
export function generateRegionalPriorityInstruction(diseaseInfo) {
  if (!diseaseInfo.detected) return '';

  return `
🌎 ⚠️ ATENÇÃO ESPECIAL - DOENÇA REGIONAL DETECTADA ⚠️

Doença: ${diseaseInfo.disease.toUpperCase()}
Região: ${diseaseInfo.region}
Prioridade LILACS: ${diseaseInfo.priority}

🎯 INSTRUÇÕES OBRIGATÓRIAS:

1. DÊ PRIORIDADE MÁXIMA aos documentos da base LILACS
2. Os protocolos LILACS representam as DIRETRIZES BRASILEIRAS/REGIONAIS oficiais
3. Em caso de divergência entre protocolos internacionais e LILACS:
   → SEMPRE priorize LILACS para contexto brasileiro
   → Explique a diferença se relevante

4. Mencione explicitamente:
   - "Segundo protocolo brasileiro (LILACS)..."
   - "Diretrizes do Ministério da Saúde..."
   - "Protocolo específico para o Brasil/América Latina..."

5. Para ${diseaseInfo.disease}:
   - Use dados epidemiológicos locais
   - Considere disponibilidade no SUS
   - Mencione vetores/condições climáticas regionais

⚠️ Esta é uma doença com ESPECIFICIDADES REGIONAIS. Protocolos internacionais podem não ser adequados.
`;
}

/**
 * Fallback para erro de API com mensagem apropriada
 */
export function generateAPIErrorMessage(apiName, error) {
  const messages = {
    'OpenFDA': `⚠️ Aviso: Dados regulatórios da FDA temporariamente indisponíveis (${error}). Prosseguindo com outras bases científicas.`,
    'LILACS': `⚠️ Aviso: Base LILACS temporariamente indisponível (${error}). Protocolos regionais podem estar limitados.`,
    'PubMed': `⚠️ Aviso: PubMed/Europe PMC temporariamente indisponível (${error}). Usando fontes alternativas.`,
    'Semantic Scholar': `⚠️ Aviso: Semantic Scholar temporariamente indisponível (${error}). Número de artigos pode estar reduzido.`,
    'ClinicalTrials': `⚠️ Aviso: ClinicalTrials.gov temporariamente indisponível (${error}). Dados de ensaios clínicos limitados.`
  };

  return messages[apiName] || `⚠️ Aviso: ${apiName} temporariamente indisponível.`;
}

export default {
  translateToEnglish,
  keepPortugueseSpanish,
  detectLanguage,
  detectRegionalDisease,
  generateRegionalPriorityInstruction,
  generateAPIErrorMessage
};
