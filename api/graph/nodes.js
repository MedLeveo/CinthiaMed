/**
 * Nós (Nodes) do LangGraph
 *
 * Cada nó representa uma etapa lógica do processamento
 */

import { ChatOpenAI } from '@langchain/openai';
import * as semanticScholarService from '../services/semanticScholarService.js';
import * as europePmcService from '../services/europePmcService.js';
import * as clinicalTrialsService from '../services/clinicalTrialsService.js';
import * as openFdaService from '../services/openFdaService.js';
import * as lilacsService from '../services/lilacsService.js';

// Inicializar modelo OpenAI
const llm = new ChatOpenAI({
  modelName: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 3000,
  openAIApiKey: process.env.OPENAI_API_KEY?.replace(/\s+/g, '')
});

/**
 * NÓ 1: ROUTER
 * Analisa a pergunta do usuário e define rotas de busca
 */
export async function routerNode(state) {
  console.log('\n🔀 NÓ ROUTER: Analisando tipo de pergunta...');

  const query = state.user_query.toLowerCase();

  // Detectar se é pergunta médica
  const medicalKeywords = [
    'tratamento', 'terapia', 'medicamento', 'droga', 'fármaco', 'remédio',
    'diagnóstico', 'sintoma', 'doença', 'condição', 'patologia',
    'estudo', 'pesquisa', 'evidência', 'protocolo', 'diretriz',
    'dose', 'posologia', 'administração', 'efeito colateral', 'reação adversa'
  ];

  const isMedicalQuestion = medicalKeywords.some(kw => query.includes(kw)) ||
                           query.includes('?');

  // Detectar se menciona medicamentos específicos
  const drugKeywords = [
    'medicamento', 'remédio', 'droga', 'fármaco', 'comprimido',
    'dose', 'posologia', 'bula', 'administração', 'mg', 'ml'
  ];

  const needsDrugSearch = drugKeywords.some(kw => query.includes(kw));

  // Detectar se beneficia de estudos regionais
  const regionalKeywords = [
    'brasil', 'brasileiro', 'sus', 'público', 'nacional',
    'latino', 'américa latina', 'regional', 'local'
  ];

  const needsRegionalSearch = regionalKeywords.some(kw => query.includes(kw)) ||
                              isMedicalQuestion; // Sempre buscar LILACS para contexto

  console.log(`   É pergunta médica: ${isMedicalQuestion}`);
  console.log(`   Precisa busca de medicamentos (FDA): ${needsDrugSearch}`);
  console.log(`   Precisa busca regional (LILACS): ${needsRegionalSearch}`);

  return {
    is_medical_question: isMedicalQuestion,
    needs_drug_search: needsDrugSearch,
    needs_regional_search: needsRegionalSearch
  };
}

/**
 * NÓ 2: MULTI SEARCHER
 * Executa buscas paralelas em múltiplas fontes
 */
export async function multiSearcherNode(state) {
  console.log('\n🔍 NÓ MULTI SEARCHER: Executando buscas paralelas...');

  if (!state.is_medical_question) {
    console.log('   Pulando buscas (não é pergunta médica)');
    return {
      raw_evidence: state.raw_evidence,
      metadata: {
        ...state.metadata,
        sources_used: []
      }
    };
  }

  const startTime = Date.now();
  const searchPromises = [];
  const sourcesUsed = [];

  // Buscar em fontes acadêmicas padrão
  searchPromises.push(
    semanticScholarService.searchPapers(state.user_query, 3)
      .then(results => {
        if (results.length > 0) sourcesUsed.push('Semantic Scholar');
        return { semanticScholar: results };
      })
      .catch(() => ({ semanticScholar: [] }))
  );

  searchPromises.push(
    europePmcService.searchPapers(state.user_query, 3)
      .then(results => {
        if (results.length > 0) sourcesUsed.push('Europe PMC');
        return { europePmc: results };
      })
      .catch(() => ({ europePmc: [] }))
  );

  searchPromises.push(
    clinicalTrialsService.searchTrials(state.user_query, 3)
      .then(results => {
        if (results.length > 0) sourcesUsed.push('ClinicalTrials.gov');
        return { clinicalTrials: results };
      })
      .catch(() => ({ clinicalTrials: [] }))
  );

  // Buscar na OpenFDA se relevante
  if (state.needs_drug_search) {
    searchPromises.push(
      openFdaService.searchDrugLabels(state.user_query, 3)
        .then(results => {
          if (results.length > 0) sourcesUsed.push('OpenFDA');
          return { openFDA: results };
        })
        .catch(() => ({ openFDA: [] }))
    );
  }

  // Buscar no LILACS se relevante
  if (state.needs_regional_search) {
    searchPromises.push(
      lilacsService.searchLilacs(state.user_query, 3)
        .then(results => {
          if (results.length > 0) sourcesUsed.push('LILACS');
          return { lilacs: results };
        })
        .catch(() => ({ lilacs: [] }))
    );
  }

  // Executar todas as buscas em paralelo
  const results = await Promise.allSettled(searchPromises);

  // Consolidar resultados
  const rawEvidence = {
    semanticScholar: [],
    europePmc: [],
    clinicalTrials: [],
    openFDA: [],
    lilacs: []
  };

  for (const result of results) {
    if (result.status === 'fulfilled') {
      Object.assign(rawEvidence, result.value);
    }
  }

  const totalEvidence = Object.values(rawEvidence).flat().length;
  const searchTime = Date.now() - startTime;

  console.log(`✅ Buscas concluídas em ${searchTime}ms`);
  console.log(`   Total de evidências: ${totalEvidence}`);
  console.log(`   Fontes utilizadas: ${sourcesUsed.join(', ')}`);

  return {
    raw_evidence: rawEvidence,
    metadata: {
      ...state.metadata,
      sources_used: sourcesUsed,
      evidence_count: totalEvidence,
      processing_time_ms: searchTime
    }
  };
}

/**
 * NÓ 3: SYNTHESIZER
 * Usa GPT-4o para sintetizar resposta baseada em evidências
 */
export async function synthesizerNode(state) {
  console.log('\n🧠 NÓ SYNTHESIZER: Gerando síntese clínica...');

  const { raw_evidence, user_query, system_message, messages } = state;

  // Formatar evidências para o prompt
  let evidenceContext = '';

  // Semantic Scholar
  if (raw_evidence.semanticScholar?.length > 0) {
    evidenceContext += '\n📚 SEMANTIC SCHOLAR (Artigos Acadêmicos):\n';
    raw_evidence.semanticScholar.slice(0, 2).forEach((paper, i) => {
      evidenceContext += `${i + 1}. "${paper.title}"\n`;
      evidenceContext += `   Autores: ${paper.authors}\n`;
      evidenceContext += `   Ano: ${paper.year} | Citações: ${paper.citationCount}\n`;
      if (paper.abstract) {
        evidenceContext += `   Resumo: ${paper.abstract.substring(0, 300)}...\n`;
      }
      evidenceContext += '\n';
    });
  }

  // Europe PMC
  if (raw_evidence.europePmc?.length > 0) {
    evidenceContext += '\n🌍 EUROPE PMC (PubMed, SciELO, DOAJ):\n';
    raw_evidence.europePmc.slice(0, 2).forEach((paper, i) => {
      evidenceContext += `${i + 1}. "${paper.title}"\n`;
      evidenceContext += `   Autores: ${paper.authors}\n`;
      evidenceContext += `   Publicação: ${paper.journal} (${paper.year})\n`;
      if (paper.abstract) {
        evidenceContext += `   Resumo: ${paper.abstract.substring(0, 300)}...\n`;
      }
      evidenceContext += '\n';
    });
  }

  // LILACS (Protocolo Regional)
  if (raw_evidence.lilacs?.length > 0) {
    evidenceContext += '\n🌎 PROTOCOLOS REGIONAIS - LILACS (América Latina/Brasil):\n';
    evidenceContext += '💡 Use para contextualizar recomendações para realidade brasileira\n\n';
    raw_evidence.lilacs.slice(0, 2).forEach((article, i) => {
      evidenceContext += `${i + 1}. "${article.title}"\n`;
      evidenceContext += `   Autores: ${article.authors}\n`;
      evidenceContext += `   País: ${article.country} | Idioma: ${article.language}\n`;
      evidenceContext += `   Publicação: ${article.journal} (${article.year})\n`;
      if (article.abstract) {
        evidenceContext += `   Resumo: ${article.abstract.substring(0, 250)}...\n`;
      }
      evidenceContext += '\n';
    });
  }

  // OpenFDA
  if (raw_evidence.openFDA?.length > 0) {
    evidenceContext += '\n💊 OPENFDA (Informações Oficiais de Medicamentos):\n';
    raw_evidence.openFDA.forEach((drug, i) => {
      evidenceContext += `${i + 1}. ${drug.brandName} (${drug.genericName})\n`;
      evidenceContext += `   Fabricante: ${drug.manufacturer}\n`;

      if (drug.indications) {
        evidenceContext += `   Indicações: ${drug.indications}\n`;
      }

      if (drug.dosageAndAdministration) {
        evidenceContext += `   Dosagem: ${drug.dosageAndAdministration}\n`;
      }

      if (drug.boxedWarning) {
        evidenceContext += `   ⚠️ ALERTA FDA (Boxed Warning): ${drug.boxedWarning}\n`;
      }

      evidenceContext += '\n';
    });
  }

  // Clinical Trials
  if (raw_evidence.clinicalTrials?.length > 0) {
    evidenceContext += '\n🔬 ENSAIOS CLÍNICOS (ClinicalTrials.gov):\n';
    raw_evidence.clinicalTrials.slice(0, 2).forEach((trial, i) => {
      evidenceContext += `${i + 1}. "${trial.title}"\n`;
      evidenceContext += `   Status: ${trial.status} | Fase: ${trial.phase}\n`;
      evidenceContext += `   Condições: ${trial.conditions.join(', ')}\n`;
      evidenceContext += '\n';
    });
  }

  // Construir prompt para GPT-4o
  const systemPrompt = `${system_message}

EVIDÊNCIAS CIENTÍFICAS ENCONTRADAS:
${evidenceContext}

INSTRUÇÕES IMPORTANTES:
1. Base sua resposta nas evidências científicas fornecidas acima
2. SEMPRE cite as fontes ao fazer afirmações (ex: "Segundo estudo da LILACS...")
3. Diferencie claramente:
   - "Protocolos Internacionais" (Semantic Scholar, PubMed)
   - "Protocolos Nacionais/Regionais" (LILACS - contexto brasileiro)
4. Se houver informações da OpenFDA, MENCIONE os avisos de segurança
5. Use linguagem técnica mas acessível
6. Seja objetivo e estruturado

IMPORTANTE: Se encontrou avisos de segurança (Boxed Warnings) da FDA, SEMPRE os mencione claramente na resposta.`;

  const userPrompt = user_query;

  // Chamar GPT-4o
  const response = await llm.invoke([
    { role: 'system', content: systemPrompt },
    ...messages,
    { role: 'user', content: userPrompt }
  ]);

  const synthesis = response.content;

  console.log(`✅ Síntese gerada (${synthesis.length} caracteres)`);

  return {
    clinical_synthesis: synthesis,
    messages: [
      ...messages,
      { role: 'user', content: userPrompt },
      { role: 'assistant', content: synthesis }
    ]
  };
}

/**
 * NÓ 4: SAFETY CHECKER
 * Verifica se a resposta incluiu avisos de segurança importantes
 */
export async function safetyCheckerNode(state) {
  console.log('\n🛡️ NÓ SAFETY CHECKER: Verificando segurança da resposta...');

  const { raw_evidence, clinical_synthesis } = state;

  // Extrair todos os avisos de segurança da FDA
  const fdaWarnings = openFdaService.extractSafetyWarnings(raw_evidence.openFDA || []);

  if (fdaWarnings.length === 0) {
    console.log('   Sem avisos de segurança FDA. Resposta aprovada.');
    return {
      is_safe: true,
      safety_warnings: []
    };
  }

  console.log(`   Encontrados ${fdaWarnings.length} avisos FDA`);

  // Verificar se os avisos foram mencionados na síntese
  const synthesisLower = clinical_synthesis.toLowerCase();
  const missedWarnings = [];

  for (const warning of fdaWarnings) {
    const drugNameLower = warning.drug.toLowerCase();

    // Se o medicamento foi mencionado na resposta
    if (synthesisLower.includes(drugNameLower.split('(')[0].trim().toLowerCase())) {
      // Verificar se o aviso foi mencionado
      const warningKeywords = ['alerta', 'aviso', 'atenção', 'cuidado', 'boxed warning', 'black box'];
      const warningMentioned = warningKeywords.some(kw => synthesisLower.includes(kw));

      if (!warningMentioned) {
        missedWarnings.push(warning);
      }
    }
  }

  if (missedWarnings.length > 0) {
    console.log(`   ⚠️ ${missedWarnings.length} avisos não foram mencionados adequadamente!`);
    return {
      is_safe: false,
      safety_warnings: missedWarnings
    };
  }

  console.log('   ✅ Todos os avisos de segurança foram incluídos');
  return {
    is_safe: true,
    safety_warnings: [],
    metadata: {
      ...state.metadata,
      has_safety_warnings: fdaWarnings.length > 0
    }
  };
}

/**
 * NÓ 5: REVISION NODE
 * Reescreve a resposta incluindo avisos de segurança omitidos
 */
export async function revisionNode(state) {
  console.log('\n✏️ NÓ REVISION: Reescrevendo resposta com avisos de segurança...');

  const { clinical_synthesis, safety_warnings, user_query, system_message } = state;

  // Formatar avisos omitidos
  let warningsText = '\n⚠️ AVISOS DE SEGURANÇA CRÍTICOS (FDA):\n\n';
  safety_warnings.forEach((warning, i) => {
    warningsText += `${i + 1}. ${warning.drug}:\n`;
    warningsText += `   ${warning.warning}\n\n`;
  });

  // Prompt para revisão
  const revisionPrompt = `Você precisa REVISAR a resposta anterior para incluir avisos de segurança críticos.

RESPOSTA ORIGINAL:
${clinical_synthesis}

AVISOS DE SEGURANÇA QUE DEVEM SER ADICIONADOS:
${warningsText}

INSTRUÇÕES:
1. Mantenha o conteúdo técnico da resposta original
2. ADICIONE os avisos de segurança em local apropriado
3. Use formatação destacada para os avisos (⚠️, negrito)
4. Seja claro que são avisos oficiais da FDA
5. Mantenha o tom profissional mas enfático nos avisos

Reescreva a resposta incluindo estes avisos de forma clara e destacada.`;

  const response = await llm.invoke([
    { role: 'system', content: system_message },
    { role: 'user', content: revisionPrompt }
  ]);

  const revisedSynthesis = response.content;

  console.log('✅ Resposta revisada com avisos de segurança');

  return {
    clinical_synthesis: revisedSynthesis,
    is_safe: true, // Após revisão, aprovado
    revision_attempts: state.revision_attempts + 1
  };
}

export default {
  routerNode,
  multiSearcherNode,
  synthesizerNode,
  safetyCheckerNode,
  revisionNode
};
