/**
 * OpenFDA Drug Label Search Service
 *
 * Busca informações de medicamentos registrados na FDA
 * - Dosagem e administração
 * - Reações adversas
 * - Avisos de segurança (boxed warnings)
 */

import axios from 'axios';

const FDA_API_KEY = 'uLQHnkAQadOUiR8rpmglSz7XYo9NMivoxuD1bZz8';
const FDA_BASE_URL = 'https://api.fda.gov/drug/label.json';

/**
 * Busca informações de medicamentos na OpenFDA
 *
 * @param {string} query - Nome do medicamento ou princípio ativo
 * @param {number} limit - Número máximo de resultados
 * @returns {Promise<Array>} Array de medicamentos encontrados
 */
export async function searchDrugLabels(query, limit = 5) {
  try {
    console.log(`\n💊 OPENFDA - Buscando informações de: "${query}"`);

    const response = await axios.get(FDA_BASE_URL, {
      params: {
        api_key: FDA_API_KEY,
        search: query,
        limit: limit
      },
      timeout: 10000
    });

    if (!response.data || !response.data.results) {
      console.log('⚠️  OpenFDA: Nenhum resultado encontrado');
      return [];
    }

    const results = response.data.results.map((drug, index) => {
      // Extrair informações relevantes
      const brandName = drug.openfda?.brand_name?.[0] || 'N/A';
      const genericName = drug.openfda?.generic_name?.[0] || 'N/A';
      const manufacturer = drug.openfda?.manufacturer_name?.[0] || 'N/A';

      // Informações clínicas
      const dosageAndAdministration = drug.dosage_and_administration?.[0] || null;
      const adverseReactions = drug.adverse_reactions?.[0] || null;
      const boxedWarning = drug.boxed_warning?.[0] || null;
      const warnings = drug.warnings?.[0] || null;
      const indications = drug.indications_and_usage?.[0] || null;
      const contraindications = drug.contraindications?.[0] || null;

      return {
        source: 'OpenFDA',
        brandName,
        genericName,
        manufacturer,
        dosageAndAdministration: dosageAndAdministration
          ? truncateText(dosageAndAdministration, 500)
          : null,
        adverseReactions: adverseReactions
          ? truncateText(adverseReactions, 500)
          : null,
        boxedWarning: boxedWarning
          ? truncateText(boxedWarning, 500)
          : null,
        warnings: warnings
          ? truncateText(warnings, 500)
          : null,
        indications: indications
          ? truncateText(indications, 300)
          : null,
        contraindications: contraindications
          ? truncateText(contraindications, 300)
          : null,
        hasSafetyWarning: !!boxedWarning,
        url: `https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=BasicSearch.process&searchterm=${encodeURIComponent(genericName)}`
      };
    });

    console.log(`✅ OpenFDA: ${results.length} medicamentos encontrados`);
    if (results.length > 0) {
      console.log(`   Exemplo: ${results[0].brandName} (${results[0].genericName})`);
      if (results[0].boxedWarning) {
        console.log(`   ⚠️  TEM BOXED WARNING!`);
      }
    }

    return results;

  } catch (error) {
    if (error.response?.status === 404) {
      console.log('⚠️  OpenFDA: Medicamento não encontrado na base FDA');
      return [];
    }

    console.error('❌ Erro OpenFDA:', error.message);
    throw new Error(`Erro ao buscar na OpenFDA: ${error.message}`);
  }
}

/**
 * Trunca texto longo mantendo informações relevantes
 */
function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;

  // Remover tags HTML se houver
  const cleanText = text.replace(/<[^>]*>/g, '');

  return cleanText.substring(0, maxLength) + '...';
}

/**
 * Extrai apenas os boxed warnings para análise de segurança
 */
export function extractSafetyWarnings(fdaResults) {
  const warnings = [];

  for (const drug of fdaResults) {
    if (drug.boxedWarning) {
      warnings.push({
        drug: `${drug.brandName} (${drug.genericName})`,
        warning: drug.boxedWarning,
        source: 'FDA Boxed Warning'
      });
    }
  }

  return warnings;
}

export default {
  searchDrugLabels,
  extractSafetyWarnings
};
