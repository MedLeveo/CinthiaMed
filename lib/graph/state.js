/**
 * Medical Workflow State Management
 *
 * ATUALIZADO: Removido LangGraph Annotation, usando plain JavaScript objects
 * Mantém mesma estrutura de estado para compatibilidade
 */

/**
 * Cria estado inicial do workflow
 *
 * @param {Object} input - Dados iniciais
 * @param {string} input.user_query - Pergunta do usuário
 * @param {Array} input.conversation_history - Histórico de conversa
 * @returns {Object} Estado inicial
 */
export function createInitialState(input = {}) {
  return {
    // ============================================
    // INPUT - Dados de entrada
    // ============================================
    user_query: input.user_query || '',
    conversation_history: input.conversation_history || [],
    system_message: input.system_message || 'Você é a CinthiaMed, uma assistente médica virtual altamente especializada e confiável. Base suas respostas em evidências científicas.',

    // ============================================
    // ROUTER NODE - Outputs
    // ============================================
    is_medical_question: false,
    query_category: '',
    regional_disease_info: {
      detected: false,
      disease: null,
      priority: null,
      region: null
    },

    // ============================================
    // MULTI SEARCHER NODE - Outputs
    // ============================================
    raw_evidence: {
      openFDA: [],
      lilacs: [],
      europePMC: [],
      clinicalTrials: [],
      semanticScholar: []
    },
    formatted_evidence: '',
    api_errors: [],

    // ============================================
    // SYNTHESIZER NODE - Outputs
    // ============================================
    clinical_synthesis: '',

    // ============================================
    // SAFETY CHECKER NODE - Outputs
    // ============================================
    is_safe: true,
    safety_issues: [],
    boxed_warning_issues: [],
    dosage_issues: [],
    protocol_conflicts: [],
    contraindication_issues: [],

    // ============================================
    // REVISION NODE - Tracking
    // ============================================
    revision_count: 0,
    revision_history: [],
    revision_attempts: 0,

    // ============================================
    // METADATA
    // ============================================
    start_time: new Date().toISOString(),
    end_time: null,
    total_processing_time_ms: 0,
    node_execution_times: {},
    metadata: {
      model: 'gpt-4o',
      sources_used: [],
      evidence_count: 0,
      has_safety_warnings: false,
      total_processing_time_ms: 0
    }
  };
}

/**
 * Schema de estado (para documentação)
 * Antes era Annotation.Root(), agora é apenas documentação
 */
export const StateSchema = {
  // Input
  user_query: 'string',
  conversation_history: 'array',

  // Router
  is_medical_question: 'boolean',
  query_category: 'string',
  regional_disease_info: 'object',

  // Multi Searcher
  raw_evidence: 'object',
  formatted_evidence: 'string',
  api_errors: 'array',

  // Synthesizer
  clinical_synthesis: 'string',

  // Safety Checker
  is_safe: 'boolean',
  safety_issues: 'array',
  boxed_warning_issues: 'array',
  dosage_issues: 'array',
  protocol_conflicts: 'array',
  contraindication_issues: 'array',

  // Revision
  revision_count: 'number',
  revision_history: 'array',

  // Metadata
  start_time: 'string (ISO 8601)',
  end_time: 'string (ISO 8601)',
  total_processing_time_ms: 'number',
  node_execution_times: 'object'
};

/**
 * Alias para compatibilidade com código existente
 */
export const GraphState = StateSchema;

export default {
  createInitialState,
  StateSchema,
  GraphState
};
