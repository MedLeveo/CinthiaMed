/**
 * Europe PMC API Service
 *
 * Integração com a API REST do Europe PMC para busca de artigos científicos.
 * Esta API indexa artigos da SciELO, DOAJ, PubMed e outras fontes.
 * Documentação: https://europepmc.org/RestfulWebService
 *
 * RATE LIMITS (API Pública):
 * - Sem limite oficial documentado para uso justo
 * - Recomendado: máximo 3 req/segundo
 * - Evitar mais de 1000 requisições por hora
 */

import axios from 'axios';

const EUROPE_PMC_API_BASE = 'https://www.ebi.ac.uk/europepmc/webservices/rest';

// Controle simples de rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 350; // ~3 req/segundo (350ms entre requisições)

/**
 * Busca artigos científicos no Europe PMC
 *
 * @param {string} query - Termo de busca (ex: "hypertension treatment")
 * @param {number} pageSize - Número de resultados (padrão: 10)
 * @returns {Promise<Array>} Array de artigos encontrados
 */
async function searchPapers(query, pageSize = 10) {
  try {
    if (!query || query.trim() === '') {
      console.warn('Europe PMC: Query vazia fornecida');
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

    const response = await axios.get(`${EUROPE_PMC_API_BASE}/search`, {
      params: {
        query: query.trim(),
        format: 'json', // CRÍTICO: padrão é XML
        pageSize: pageSize,
        resultType: 'core' // Retorna resultados com mais detalhes
      },
      headers: {
        'Accept': 'application/json'
      },
      timeout: 15000 // 15 segundos de timeout
    });

    // Extrair resultados
    const results = response.data?.resultList?.result || [];

    // Mapear e limpar resultados
    const cleanedPapers = results.map(paper => {
      // Construir URL do artigo
      let articleUrl = null;

      // Priorizar fullTextUrlList se disponível
      if (paper.fullTextUrlList?.fullTextUrl?.length > 0) {
        // Pegar primeiro URL disponível (geralmente PDF ou HTML)
        const fullTextUrl = paper.fullTextUrlList.fullTextUrl[0];
        articleUrl = fullTextUrl.url;
      } else if (paper.doi) {
        // Fallback para DOI
        articleUrl = `https://doi.org/${paper.doi}`;
      } else if (paper.pmid) {
        // Fallback para PubMed
        articleUrl = `https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`;
      } else if (paper.pmcid) {
        // Fallback para PMC
        articleUrl = `https://europepmc.org/article/PMC/${paper.pmcid}`;
      }

      // Formatar autores
      let authors = 'Autores não disponíveis';
      if (paper.authorString) {
        authors = paper.authorString;
      } else if (paper.authorList?.author?.length > 0) {
        authors = paper.authorList.author
          .map(author => `${author.firstName || ''} ${author.lastName || ''}`.trim())
          .filter(name => name)
          .join(', ');
      }

      return {
        title: paper.title || 'Título não disponível',
        authors: authors,
        url: articleUrl,
        abstract: paper.abstractText || 'Resumo não disponível',
        year: paper.pubYear || null,
        journal: paper.journalTitle || null,
        doi: paper.doi || null,
        pmid: paper.pmid || null,
        source: paper.source || 'Europe PMC',
        isOpenAccess: paper.isOpenAccess === 'Y'
      };
    });

    console.log(`✅ Europe PMC: ${cleanedPapers.length} artigos encontrados para "${query}"`);

    // Log de fontes encontradas (útil para debugging)
    const sources = [...new Set(cleanedPapers.map(p => p.source))];
    console.log(`   Fontes: ${sources.join(', ')}`);

    return cleanedPapers;

  } catch (error) {
    // Log detalhado do erro
    if (error.response) {
      // Erro da API (4xx, 5xx)
      console.error('❌ Europe PMC API Error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    } else if (error.request) {
      // Requisição feita mas sem resposta
      console.error('❌ Europe PMC: Sem resposta da API', error.message);
    } else {
      // Erro na configuração da requisição
      console.error('❌ Europe PMC: Erro ao configurar requisição', error.message);
    }

    // Retornar array vazio em caso de erro
    return [];
  }
}

/**
 * Busca um artigo específico por ID (PMID, PMCID, ou DOI)
 *
 * @param {string} id - ID do artigo (ex: "PMC3257301" ou "10.1093/nar/gkr1086")
 * @param {string} source - Tipo de ID: 'PMC', 'MED' (PubMed), ou 'DOI'
 * @returns {Promise<Object|null>} Objeto do artigo ou null se não encontrado
 */
async function getPaperById(id, source = 'MED') {
  try {
    const response = await axios.get(`${EUROPE_PMC_API_BASE}/${source}/${id}`, {
      params: {
        format: 'json'
      },
      timeout: 10000
    });

    const paper = response.data?.result || response.data;

    // Construir URL
    let articleUrl = null;
    if (paper.fullTextUrlList?.fullTextUrl?.length > 0) {
      articleUrl = paper.fullTextUrlList.fullTextUrl[0].url;
    } else if (paper.doi) {
      articleUrl = `https://doi.org/${paper.doi}`;
    }

    return {
      title: paper.title || 'Título não disponível',
      authors: paper.authorString || 'Autores não disponíveis',
      url: articleUrl,
      abstract: paper.abstractText || 'Resumo não disponível',
      year: paper.pubYear || null,
      journal: paper.journalTitle || null,
      doi: paper.doi || null,
      source: paper.source || 'Europe PMC'
    };

  } catch (error) {
    console.error('❌ Europe PMC: Erro ao buscar artigo por ID', error.message);
    return null;
  }
}

export {
  searchPapers,
  getPaperById
};
