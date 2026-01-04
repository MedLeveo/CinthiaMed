/**
 * Scientific Search Unified Service
 *
 * Orquestra buscas paralelas em múltiplas fontes científicas:
 * - Semantic Scholar (artigos acadêmicos)
 * - Europe PMC (SciELO, DOAJ, PubMed)
 * - ClinicalTrials.gov (ensaios clínicos)
 */

import * as semanticScholarService from './semanticScholarService.js';
import * as europePmcService from './europePmcService.js';
import * as clinicalTrialsService from './clinicalTrialsService.js';

/**
 * Busca evidências científicas em múltiplas fontes simultaneamente
 *
 * @param {string} termo - Termo de busca (ex: "diabetes treatment", "hipertensão arterial")
 * @param {number} limitePorFonte - Número máximo de resultados por fonte (padrão: 5)
 * @returns {Promise<Object>} Objeto consolidado com resultados de todas as fontes
 */
async function buscarEvidencias(termo, limitePorFonte = 5) {
  console.log('\n' + '='.repeat(80));
  console.log('🔬 BUSCA CIENTÍFICA UNIFICADA');
  console.log('='.repeat(80));
  console.log(`📝 Termo de busca: "${termo}"`);
  console.log(`📊 Limite por fonte: ${limitePorFonte} resultados`);
  console.log('⏳ Iniciando buscas paralelas...\n');

  const startTime = Date.now();

  // Disparar buscas em paralelo usando Promise.allSettled
  // Se uma API falhar, as outras continuam normalmente
  const [semanticResult, europePmcResult, clinicalTrialsResult] = await Promise.allSettled([
    semanticScholarService.searchPapers(termo, limitePorFonte),
    europePmcService.searchPapers(termo, limitePorFonte),
    clinicalTrialsService.searchTrials(termo, limitePorFonte)
  ]);

  const endTime = Date.now();
  const totalTime = ((endTime - startTime) / 1000).toFixed(2);

  // Processar resultados (fulfilled = sucesso, rejected = erro)
  const semanticScholarData = semanticResult.status === 'fulfilled'
    ? semanticResult.value
    : [];

  const europePmcData = europePmcResult.status === 'fulfilled'
    ? europePmcResult.value
    : [];

  const clinicalTrialsData = clinicalTrialsResult.status === 'fulfilled'
    ? clinicalTrialsResult.value
    : [];

  // Consolidar resultados
  const resultadoConsolidado = {
    termo: termo,
    timestamp: new Date().toISOString(),
    tempoTotal: `${totalTime}s`,
    resumo: {
      totalResultados: semanticScholarData.length + europePmcData.length + clinicalTrialsData.length,
      semanticScholar: {
        total: semanticScholarData.length,
        status: semanticResult.status,
        erro: semanticResult.status === 'rejected' ? semanticResult.reason.message : null
      },
      europePmc: {
        total: europePmcData.length,
        status: europePmcResult.status,
        erro: europePmcResult.status === 'rejected' ? europePmcResult.reason.message : null
      },
      clinicalTrials: {
        total: clinicalTrialsData.length,
        status: clinicalTrialsResult.status,
        erro: clinicalTrialsResult.status === 'rejected' ? clinicalTrialsResult.reason.message : null
      }
    },
    fontes: {
      semanticScholar: semanticScholarData,
      europePmc: europePmcData,
      clinicalTrials: clinicalTrialsData
    }
  };

  // Log formatado dos resultados
  console.log('='.repeat(80));
  console.log('✅ RESULTADOS CONSOLIDADOS');
  console.log('='.repeat(80));
  console.log(`⏱️  Tempo total: ${totalTime}s`);
  console.log(`📊 Total de resultados: ${resultadoConsolidado.resumo.totalResultados}\n`);

  // Semantic Scholar
  console.log('📚 SEMANTIC SCHOLAR');
  console.log(`   Status: ${semanticResult.status === 'fulfilled' ? '✅ Sucesso' : '❌ Falha'}`);
  console.log(`   Resultados: ${semanticScholarData.length}`);
  if (semanticScholarData.length > 0) {
    console.log(`   Exemplo: "${semanticScholarData[0].title.substring(0, 60)}..."`);
  }
  if (semanticResult.status === 'rejected') {
    console.log(`   Erro: ${semanticResult.reason.message}`);
  }
  console.log('');

  // Europe PMC
  console.log('🌍 EUROPE PMC (SciELO, DOAJ, PubMed)');
  console.log(`   Status: ${europePmcResult.status === 'fulfilled' ? '✅ Sucesso' : '❌ Falha'}`);
  console.log(`   Resultados: ${europePmcData.length}`);
  if (europePmcData.length > 0) {
    console.log(`   Exemplo: "${europePmcData[0].title.substring(0, 60)}..."`);
    // Mostrar fontes encontradas
    const fontes = [...new Set(europePmcData.map(p => p.source))];
    console.log(`   Fontes: ${fontes.join(', ')}`);
  }
  if (europePmcResult.status === 'rejected') {
    console.log(`   Erro: ${europePmcResult.reason.message}`);
  }
  console.log('');

  // ClinicalTrials.gov
  console.log('🏥 CLINICALTRIALS.GOV');
  console.log(`   Status: ${clinicalTrialsResult.status === 'fulfilled' ? '✅ Sucesso' : '❌ Falha'}`);
  console.log(`   Resultados: ${clinicalTrialsData.length}`);
  if (clinicalTrialsData.length > 0) {
    console.log(`   Exemplo: "${clinicalTrialsData[0].title.substring(0, 60)}..."`);
    // Mostrar status dos estudos
    const statuses = [...new Set(clinicalTrialsData.map(t => t.status))];
    console.log(`   Status: ${statuses.join(', ')}`);
  }
  if (clinicalTrialsResult.status === 'rejected') {
    console.log(`   Erro: ${clinicalTrialsResult.reason.message}`);
  }
  console.log('');

  console.log('='.repeat(80));
  console.log(`✅ Busca concluída! Total: ${resultadoConsolidado.resumo.totalResultados} evidências encontradas`);
  console.log('='.repeat(80) + '\n');

  return resultadoConsolidado;
}

/**
 * Formata resultados para incluir no prompt da IA
 *
 * @param {Object} resultados - Objeto retornado por buscarEvidencias()
 * @param {number} maxPorFonte - Máximo de resultados por fonte a incluir (padrão: 3)
 * @returns {string} String formatada em markdown para incluir no contexto da IA
 */
function formatarParaPrompt(resultados, maxPorFonte = 3) {
  let prompt = `# Evidências Científicas Encontradas\n\n`;
  prompt += `**Termo de busca:** ${resultados.termo}\n`;
  prompt += `**Total de resultados:** ${resultados.resumo.totalResultados}\n\n`;

  // Semantic Scholar
  if (resultados.fontes.semanticScholar.length > 0) {
    prompt += `## 📚 Artigos Científicos (Semantic Scholar)\n\n`;
    resultados.fontes.semanticScholar.slice(0, maxPorFonte).forEach((paper, idx) => {
      prompt += `### ${idx + 1}. ${paper.title}\n`;
      prompt += `- **Autores:** ${paper.authors}\n`;
      prompt += `- **Ano:** ${paper.year || 'N/A'}\n`;
      prompt += `- **Citações:** ${paper.citationCount}\n`;
      prompt += `- **Resumo:** ${paper.abstract.substring(0, 200)}...\n`;
      if (paper.url) prompt += `- **Link:** ${paper.url}\n`;
      prompt += `\n`;
    });
  }

  // Europe PMC
  if (resultados.fontes.europePmc.length > 0) {
    prompt += `## 🌍 Artigos Médicos (Europe PMC)\n\n`;
    resultados.fontes.europePmc.slice(0, maxPorFonte).forEach((paper, idx) => {
      prompt += `### ${idx + 1}. ${paper.title}\n`;
      prompt += `- **Autores:** ${paper.authors}\n`;
      prompt += `- **Fonte:** ${paper.source}\n`;
      prompt += `- **Ano:** ${paper.year || 'N/A'}\n`;
      if (paper.journal) prompt += `- **Revista:** ${paper.journal}\n`;
      prompt += `- **Resumo:** ${paper.abstract.substring(0, 200)}...\n`;
      if (paper.url) prompt += `- **Link:** ${paper.url}\n`;
      prompt += `\n`;
    });
  }

  // ClinicalTrials
  if (resultados.fontes.clinicalTrials.length > 0) {
    prompt += `## 🏥 Ensaios Clínicos (ClinicalTrials.gov)\n\n`;
    resultados.fontes.clinicalTrials.slice(0, maxPorFonte).forEach((trial, idx) => {
      prompt += `### ${idx + 1}. ${trial.title}\n`;
      prompt += `- **Condição:** ${trial.condition}\n`;
      prompt += `- **Intervenção:** ${trial.intervention}\n`;
      prompt += `- **Status:** ${trial.status}\n`;
      prompt += `- **Fase:** ${trial.phase}\n`;
      if (trial.url) prompt += `- **Link:** ${trial.url}\n`;
      prompt += `\n`;
    });
  }

  return prompt;
}

/**
 * Obtém resumo estatístico dos resultados
 *
 * @param {Object} resultados - Objeto retornado por buscarEvidencias()
 * @returns {Object} Estatísticas consolidadas
 */
function obterEstatisticas(resultados) {
  const stats = {
    totalResultados: resultados.resumo.totalResultados,
    porFonte: {
      semanticScholar: resultados.resumo.semanticScholar.total,
      europePmc: resultados.resumo.europePmc.total,
      clinicalTrials: resultados.resumo.clinicalTrials.total
    },
    fontesMaisProdutivas: [],
    tempoConsulta: resultados.tempoTotal
  };

  // Ordenar fontes por produtividade
  const fontes = [
    { nome: 'Semantic Scholar', total: stats.porFonte.semanticScholar },
    { nome: 'Europe PMC', total: stats.porFonte.europePmc },
    { nome: 'ClinicalTrials.gov', total: stats.porFonte.clinicalTrials }
  ];

  stats.fontesMaisProdutivas = fontes
    .sort((a, b) => b.total - a.total)
    .map(f => f.nome);

  return stats;
}

export {
  buscarEvidencias,
  formatarParaPrompt,
  obterEstatisticas
};
