/**
 * ClinicalTrials.gov API v2 Service
 *
 * Integração com a API v2 do ClinicalTrials.gov para busca de ensaios clínicos.
 * Documentação: https://clinicaltrials.gov/data-api/api
 *
 * RATE LIMITS (API Pública):
 * - Sem limite oficial para uso justo
 * - Recomendado pela NIH: não exceder 1000 requisições por hora
 * - Para segurança: 1 req/segundo
 */

import axios from 'axios';

const CLINICAL_TRIALS_API_BASE = 'https://clinicaltrials.gov/api/v2/studies';

// Controle simples de rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 segundo entre requisições

/**
 * Busca ensaios clínicos no ClinicalTrials.gov
 *
 * @param {string} query - Termo de busca (ex: "diabetes treatment")
 * @param {number} pageSize - Número de resultados (padrão: 10)
 * @param {Array<string>} statusFilter - Status desejados (padrão: RECRUITING, COMPLETED)
 * @returns {Promise<Array>} Array de ensaios clínicos encontrados
 */
async function searchTrials(query, pageSize = 10, statusFilter = ['RECRUITING', 'COMPLETED']) {
  try {
    if (!query || query.trim() === '') {
      console.warn('ClinicalTrials.gov: Query vazia fornecida');
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

    // Construir filtro de status para a query
    // Formato: filter.overallStatus=RECRUITING,COMPLETED
    const statusQuery = statusFilter.length > 0 ? statusFilter.join(',') : undefined;

    const response = await axios.get(CLINICAL_TRIALS_API_BASE, {
      params: {
        'query.term': query.trim(),
        'filter.overallStatus': statusQuery,
        'pageSize': pageSize,
        'format': 'json',
        'fields': 'NCTId,BriefTitle,Condition,InterventionName,OverallStatus,Phase,StudyFirstPostDate'
      },
      headers: {
        'Accept': 'application/json'
      },
      timeout: 15000 // 15 segundos de timeout
    });

    // Extrair estudos da resposta
    const studies = response.data?.studies || [];

    // Mapear e limpar resultados
    const cleanedTrials = studies.map(study => {
      const protocolSection = study.protocolSection || {};
      const identificationModule = protocolSection.identificationModule || {};
      const statusModule = protocolSection.statusModule || {};
      const conditionsModule = protocolSection.conditionsModule || {};
      const armsInterventionsModule = protocolSection.armsInterventionsModule || {};
      const designModule = protocolSection.designModule || {};

      // NCT ID (identificador único)
      const nctId = identificationModule.nctId || 'ID não disponível';

      // Título do estudo
      const title = identificationModule.briefTitle ||
                    identificationModule.officialTitle ||
                    'Título não disponível';

      // Condições tratadas (doenças)
      let conditions = 'Condição não especificada';
      if (conditionsModule.conditions && conditionsModule.conditions.length > 0) {
        conditions = conditionsModule.conditions.join(', ');
      }

      // Intervenções (medicamentos, terapias, etc.)
      let interventions = 'Intervenção não especificada';
      if (armsInterventionsModule.interventions && armsInterventionsModule.interventions.length > 0) {
        interventions = armsInterventionsModule.interventions
          .map(intervention => {
            const type = intervention.type || '';
            const name = intervention.name || '';
            return type && name ? `${type}: ${name}` : name;
          })
          .filter(i => i)
          .join(', ');
      }

      // Link do estudo
      const url = nctId !== 'ID não disponível'
        ? `https://clinicaltrials.gov/study/${nctId}`
        : null;

      // Informações adicionais
      const status = statusModule.overallStatus || 'Status desconhecido';
      const phase = designModule.phases?.join(', ') || 'Fase não especificada';
      const startDate = statusModule.startDateStruct?.date || null;

      return {
        nctId: nctId,
        title: title,
        condition: conditions,
        intervention: interventions,
        url: url,
        status: status,
        phase: phase,
        startDate: startDate,
        source: 'ClinicalTrials.gov'
      };
    });

    console.log(`✅ ClinicalTrials.gov: ${cleanedTrials.length} ensaios clínicos encontrados para "${query}"`);

    // Log de status encontrados (útil para debugging)
    const statuses = [...new Set(cleanedTrials.map(t => t.status))];
    console.log(`   Status: ${statuses.join(', ')}`);

    return cleanedTrials;

  } catch (error) {
    // Log detalhado do erro
    if (error.response) {
      // Erro da API (4xx, 5xx)
      console.error('❌ ClinicalTrials.gov API Error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    } else if (error.request) {
      // Requisição feita mas sem resposta
      console.error('❌ ClinicalTrials.gov: Sem resposta da API', error.message);
    } else {
      // Erro na configuração da requisição
      console.error('❌ ClinicalTrials.gov: Erro ao configurar requisição', error.message);
    }

    // Retornar array vazio em caso de erro
    return [];
  }
}

/**
 * Busca um ensaio clínico específico por NCT ID
 *
 * @param {string} nctId - NCT ID do estudo (ex: "NCT04280705")
 * @returns {Promise<Object|null>} Objeto do ensaio clínico ou null se não encontrado
 */
async function getTrialById(nctId) {
  try {
    const response = await axios.get(`${CLINICAL_TRIALS_API_BASE}/${nctId}`, {
      params: {
        'format': 'json',
        'fields': 'NCTId,BriefTitle,OfficialTitle,Condition,InterventionName,OverallStatus,Phase,BriefSummary,DetailedDescription,EligibilityCriteria'
      },
      timeout: 10000
    });

    const study = response.data?.protocolSection || {};
    const identificationModule = study.identificationModule || {};
    const statusModule = study.statusModule || {};
    const conditionsModule = study.conditionsModule || {};
    const armsInterventionsModule = study.armsInterventionsModule || {};
    const descriptionModule = study.descriptionModule || {};
    const eligibilityModule = study.eligibilityModule || {};

    return {
      nctId: identificationModule.nctId || nctId,
      title: identificationModule.briefTitle || 'Título não disponível',
      officialTitle: identificationModule.officialTitle || null,
      condition: conditionsModule.conditions?.join(', ') || 'Condição não especificada',
      intervention: armsInterventionsModule.interventions
        ?.map(i => i.name)
        .join(', ') || 'Intervenção não especificada',
      url: `https://clinicaltrials.gov/study/${nctId}`,
      status: statusModule.overallStatus || 'Status desconhecido',
      summary: descriptionModule.briefSummary || 'Resumo não disponível',
      description: descriptionModule.detailedDescription || null,
      eligibility: eligibilityModule.eligibilityCriteria || null,
      source: 'ClinicalTrials.gov'
    };

  } catch (error) {
    console.error('❌ ClinicalTrials.gov: Erro ao buscar estudo por NCT ID', error.message);
    return null;
  }
}

/**
 * Busca ensaios clínicos por condição específica
 *
 * @param {string} condition - Condição médica (ex: "diabetes", "hypertension")
 * @param {number} pageSize - Número de resultados (padrão: 10)
 * @returns {Promise<Array>} Array de ensaios clínicos
 */
async function searchByCondition(condition, pageSize = 10) {
  return searchTrials(`AREA[Condition]${condition}`, pageSize);
}

/**
 * Busca ensaios clínicos por intervenção (medicamento/terapia)
 *
 * @param {string} intervention - Nome do medicamento ou terapia
 * @param {number} pageSize - Número de resultados (padrão: 10)
 * @returns {Promise<Array>} Array de ensaios clínicos
 */
async function searchByIntervention(intervention, pageSize = 10) {
  return searchTrials(`AREA[InterventionName]${intervention}`, pageSize);
}

export {
  searchTrials,
  getTrialById,
  searchByCondition,
  searchByIntervention
};
