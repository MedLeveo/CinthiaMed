/**
 * LILACS Search Service (via iAHx/BIREME)
 *
 * Literatura Latino-Americana e do Caribe em Ciências da Saúde
 * - Foco em estudos regionais (Brasil, América Latina)
 * - Resultados em português e espanhol
 * - Saúde pública e contexto local
 */

import axios from 'axios';

const LILACS_API_URL = 'https://pesquisa.bvsalud.org/portal/api/v1/search';

/**
 * Busca artigos científicos na base LILACS
 *
 * @param {string} query - Termo de busca
 * @param {number} limit - Número máximo de resultados
 * @returns {Promise<Array>} Array de artigos encontrados
 */
export async function searchLilacs(query, limit = 5) {
  try {
    console.log(`\n🌎 LILACS - Buscando literatura regional: "${query}"`);

    const response = await axios.get(LILACS_API_URL, {
      params: {
        q: query,
        filter: 'db:("LILACS")',
        lang: 'pt',
        count: limit,
        output: 'json',
        format: 'summary'
      },
      timeout: 15000
    });

    if (!response.data || !response.data.response?.docs) {
      console.log('⚠️  LILACS: Nenhum resultado encontrado');
      return [];
    }

    const docs = response.data.response.docs;

    const results = docs.map(doc => {
      // Extrair autores
      const authors = doc.au || [];
      const authorsFormatted = authors.slice(0, 3).join('; ') +
        (authors.length > 3 ? ' et al.' : '');

      // Extrair idioma
      const language = doc.la?.[0] || 'pt';

      // Tipo de documento
      const docType = doc.type || 'article';

      return {
        source: 'LILACS',
        title: doc.ti || doc.title_t || 'Sem título',
        authors: authorsFormatted || 'Autores não informados',
        journal: doc.ta || 'Revista não informada',
        year: doc.year_cluster || 'N/A',
        abstract: doc.ab || doc.abstract_t || null,
        language: language,
        country: doc.affiliation_country || 'N/A',
        docType: docType,
        isRegional: true, // Flag para indicar que é estudo regional
        url: doc.id || doc.ur?.[0] || '#',
        relevance: doc.score || 0
      };
    });

    console.log(`✅ LILACS: ${results.length} artigos encontrados`);
    if (results.length > 0) {
      console.log(`   Exemplo: "${results[0].title.substring(0, 60)}..."`);
      console.log(`   Idioma: ${results[0].language} | País: ${results[0].country}`);
    }

    return results;

  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.log('⚠️  LILACS: Timeout na busca (servidor lento)');
      return [];
    }

    console.error('❌ Erro LILACS:', error.message);
    // Não falhar completamente, retornar array vazio
    return [];
  }
}

/**
 * Formata resultados LILACS para inclusão no prompt
 */
export function formatLilacsForPrompt(results, maxArticles = 3) {
  if (!results || results.length === 0) {
    return '';
  }

  const articlesToInclude = results.slice(0, maxArticles);

  let formatted = '\n🌎 PROTOCOLOS REGIONAIS (LILACS - América Latina):\n\n';

  articlesToInclude.forEach((article, index) => {
    formatted += `${index + 1}. "${article.title}"\n`;
    formatted += `   Autores: ${article.authors}\n`;
    formatted += `   Publicação: ${article.journal} (${article.year})\n`;
    formatted += `   País: ${article.country} | Idioma: ${article.language}\n`;

    if (article.abstract) {
      const abstractPreview = article.abstract.substring(0, 250) + '...';
      formatted += `   Resumo: ${abstractPreview}\n`;
    }

    formatted += '\n';
  });

  formatted += `💡 Use estes estudos para contextualizar recomendações para o contexto brasileiro/latino-americano.\n`;

  return formatted;
}

export default {
  searchLilacs,
  formatLilacsForPrompt
};
