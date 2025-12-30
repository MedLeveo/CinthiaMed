import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';

/**
 * Serviço de integração com PubMed
 * Busca artigos científicos para embasar respostas médicas
 */

const PUBMED_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const EMAIL = process.env.PUBMED_EMAIL || 'cinthiamed@example.com';

/**
 * Busca IDs de artigos no PubMed
 */
export async function searchPubMed(query, maxResults = 5) {
  try {
    const searchUrl = `${PUBMED_BASE_URL}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json&email=${EMAIL}&sort=relevance`;

    const response = await fetch(searchUrl);
    const data = await response.json();

    if (!data.esearchresult || !data.esearchresult.idlist) {
      return [];
    }

    return data.esearchresult.idlist;
  } catch (error) {
    console.error('Erro ao buscar no PubMed:', error);
    return [];
  }
}

/**
 * Busca detalhes dos artigos por IDs
 */
export async function fetchArticleDetails(ids) {
  if (!ids || ids.length === 0) return [];

  try {
    const summaryUrl = `${PUBMED_BASE_URL}/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json&email=${EMAIL}`;

    const response = await fetch(summaryUrl);
    const data = await response.json();

    if (!data.result) return [];

    // Processar resultados
    const articles = [];
    for (const id of ids) {
      if (data.result[id] && data.result[id].title) {
        const article = data.result[id];
        articles.push({
          pmid: id,
          title: article.title,
          authors: article.authors?.map(a => a.name).join(', ') || 'Autores não disponíveis',
          journal: article.fulljournalname || article.source || 'Journal não disponível',
          pubdate: article.pubdate || 'Data não disponível',
          abstract: '', // Será preenchido se necessário
          doi: article.elocationid || '',
          url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
        });
      }
    }

    return articles;
  } catch (error) {
    console.error('Erro ao buscar detalhes dos artigos:', error);
    return [];
  }
}

/**
 * Busca abstracts completos dos artigos
 */
export async function fetchArticleAbstracts(ids) {
  if (!ids || ids.length === 0) return [];

  try {
    const fetchUrl = `${PUBMED_BASE_URL}/efetch.fcgi?db=pubmed&id=${ids.join(',')}&retmode=xml&email=${EMAIL}`;

    const response = await fetch(fetchUrl);
    const xmlData = await response.text();
    const parsedData = await parseStringPromise(xmlData);

    const articles = [];
    const pubmedArticles = parsedData?.PubmedArticleSet?.PubmedArticle || [];

    for (const article of pubmedArticles) {
      const medlineCitation = article.MedlineCitation?.[0];
      if (!medlineCitation) continue;

      const pmid = medlineCitation.PMID?.[0]._ || medlineCitation.PMID?.[0];
      const articleData = medlineCitation.Article?.[0];

      if (!articleData) continue;

      // Extrair abstract
      const abstractTexts = articleData.Abstract?.[0]?.AbstractText || [];
      const abstract = abstractTexts.map(text => {
        if (typeof text === 'string') return text;
        if (text._ ) return `${text.$.Label || ''}: ${text._}`;
        return '';
      }).join('\n');

      articles.push({
        pmid: pmid,
        title: articleData.ArticleTitle?.[0] || 'Título não disponível',
        abstract: abstract || 'Abstract não disponível',
      });
    }

    return articles;
  } catch (error) {
    console.error('Erro ao buscar abstracts:', error);
    return [];
  }
}

/**
 * Busca completa: IDs + Detalhes + Abstracts
 */
export async function searchScientificArticles(query, maxResults = 3) {
  try {
    console.log(`🔍 Buscando artigos sobre: "${query}"`);

    // 1. Buscar IDs
    const ids = await searchPubMed(query, maxResults);
    if (ids.length === 0) {
      console.log('❌ Nenhum artigo encontrado');
      return [];
    }

    console.log(`📚 Encontrados ${ids.length} artigos`);

    // 2. Buscar detalhes básicos
    const details = await fetchArticleDetails(ids);

    // 3. Buscar abstracts
    const abstracts = await fetchArticleAbstracts(ids);

    // 4. Combinar dados
    const articles = details.map(detail => {
      const abstractData = abstracts.find(a => a.pmid === detail.pmid);
      return {
        ...detail,
        abstract: abstractData?.abstract || 'Abstract não disponível'
      };
    });

    console.log(`✅ ${articles.length} artigos processados com sucesso`);
    return articles;

  } catch (error) {
    console.error('Erro na busca completa:', error);
    return [];
  }
}

/**
 * Formata artigos para contexto do GPT
 */
export function formatArticlesForContext(articles) {
  if (!articles || articles.length === 0) {
    return 'Nenhum estudo científico recente encontrado para esta consulta.';
  }

  return articles.map((article, index) => `
📄 ESTUDO ${index + 1}:
Título: ${article.title}
Autores: ${article.authors}
Revista: ${article.journal}
Ano: ${article.pubdate}
PMID: ${article.pmid}
Link: ${article.url}

Abstract:
${article.abstract}
---
`).join('\n');
}
