/**
 * Semantic Scholar API Service
 *
 * Integração com a API do Semantic Scholar para busca de artigos científicos.
 * Documentação: https://api.semanticscholar.org/
 *
 * RATE LIMITS (API Pública sem chave):
 * - 100 requisições por 5 minutos (20 req/min)
 * - Recomendado: 1 req/segundo para segurança
 */

import axios from 'axios';

const SEMANTIC_SCHOLAR_API_BASE = 'https://api.semanticscholar.org/graph/v1';

// Controle simples de rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 segundo entre requisições

/**
 * Busca artigos científicos no Semantic Scholar
 *
 * @param {string} query - Termo de busca (ex: "diabetes mellitus treatment")
 * @param {number} limit - Número máximo de resultados (padrão: 10)
 * @returns {Promise<Array>} Array de artigos encontrados
 */
async function searchPapers(query, limit = 10) {
  try {
    if (!query || query.trim() === '') {
      console.warn('Semantic Scholar: Query vazia fornecida');
      return [];
    }

    // Rate limiting: aguardar intervalo mínimo entre requisições
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    lastRequestTime = Date.now();

    const response = await axios.get(`${SEMANTIC_SCHOLAR_API_BASE}/paper/search`, {
      params: {
        query: query.trim(),
        limit: limit,
        fields: 'title,url,abstract,year,authors,citationCount'
      },
      headers: {
        'Accept': 'application/json'
      },
      timeout: 10000 // 10 segundos de timeout
    });

    // Extrair papers do resultado
    const papers = response.data?.data || [];

    // Limpar e formatar resultados
    const cleanedPapers = papers.map(paper => ({
      title: paper.title || 'Título não disponível',
      url: paper.url || null,
      abstract: paper.abstract || 'Resumo não disponível',
      year: paper.year || null,
      authors: paper.authors?.map(author => author.name).join(', ') || 'Autores não disponíveis',
      citationCount: paper.citationCount || 0,
      source: 'Semantic Scholar'
    }));

    console.log(`✅ Semantic Scholar: ${cleanedPapers.length} artigos encontrados para "${query}"`);
    return cleanedPapers;

  } catch (error) {
    // Log detalhado do erro
    if (error.response) {
      // Erro da API (4xx, 5xx)
      console.error('❌ Semantic Scholar API Error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    } else if (error.request) {
      // Requisição feita mas sem resposta
      console.error('❌ Semantic Scholar: Sem resposta da API', error.message);
    } else {
      // Erro na configuração da requisição
      console.error('❌ Semantic Scholar: Erro ao configurar requisição', error.message);
    }

    // Retornar array vazio em caso de erro
    return [];
  }
}

/**
 * Busca um artigo específico por ID do Semantic Scholar
 *
 * @param {string} paperId - ID do artigo no Semantic Scholar
 * @returns {Promise<Object|null>} Objeto do artigo ou null se não encontrado
 */
async function getPaperById(paperId) {
  try {
    const response = await axios.get(`${SEMANTIC_SCHOLAR_API_BASE}/paper/${paperId}`, {
      params: {
        fields: 'title,url,abstract,year,authors,citationCount,references,citations'
      },
      timeout: 10000
    });

    const paper = response.data;

    return {
      title: paper.title || 'Título não disponível',
      url: paper.url || null,
      abstract: paper.abstract || 'Resumo não disponível',
      year: paper.year || null,
      authors: paper.authors?.map(author => author.name).join(', ') || 'Autores não disponíveis',
      citationCount: paper.citationCount || 0,
      referencesCount: paper.references?.length || 0,
      citationsCount: paper.citations?.length || 0,
      source: 'Semantic Scholar'
    };

  } catch (error) {
    console.error('❌ Semantic Scholar: Erro ao buscar artigo por ID', error.message);
    return null;
  }
}

export {
  searchPapers,
  getPaperById
};
