/**
 * Estado do Grafo LangGraph
 *
 * Define a estrutura de dados que será passada entre os nós do grafo
 */

import { Annotation } from '@langchain/langgraph';

/**
 * Definição do estado usando LangGraph Annotation
 */
export const GraphState = Annotation.Root({
  // Histórico de mensagens da conversa
  messages: Annotation({
    reducer: (current, update) => [...current, ...update],
    default: () => []
  }),

  // Pergunta original do usuário
  user_query: Annotation({
    reducer: (_, update) => update,
    default: () => ''
  }),

  // ID do usuário para cache
  userId: Annotation({
    reducer: (_, update) => update,
    default: () => ''
  }),

  // ID da conversa
  conversationId: Annotation({
    reducer: (_, update) => update,
    default: () => ''
  }),

  // Tipo de contexto (Geral, Pediatria, Emergência, etc.)
  context_type: Annotation({
    reducer: (_, update) => update,
    default: () => 'geral'
  }),

  // System message personalizado
  system_message: Annotation({
    reducer: (_, update) => update,
    default: () => 'Você é a CinthiaMed, uma assistente médica virtual.'
  }),

  // Evidências brutas de TODAS as APIs
  raw_evidence: Annotation({
    reducer: (current, update) => ({ ...current, ...update }),
    default: () => ({
      semanticScholar: [],
      europePmc: [],
      clinicalTrials: [],
      openFDA: [],
      lilacs: []
    })
  }),

  // Informações sobre doença regional detectada
  regional_disease_info: Annotation({
    reducer: (_, update) => update,
    default: () => ({ detected: false })
  }),

  // Erros de API (para mensagens ao usuário)
  api_errors: Annotation({
    reducer: (current, update) => [...current, ...update],
    default: () => []
  }),

  // Flags de roteamento
  needs_drug_search: Annotation({
    reducer: (_, update) => update,
    default: () => false
  }),

  needs_regional_search: Annotation({
    reducer: (_, update) => update,
    default: () => false
  }),

  is_medical_question: Annotation({
    reducer: (_, update) => update,
    default: () => false
  }),

  // Síntese clínica gerada pela IA
  clinical_synthesis: Annotation({
    reducer: (_, update) => update,
    default: () => ''
  }),

  // Avisos de segurança encontrados
  safety_warnings: Annotation({
    reducer: (current, update) => [...current, ...update],
    default: () => []
  }),

  // Flag de aprovação do revisor
  is_safe: Annotation({
    reducer: (_, update) => update,
    default: () => true
  }),

  // Contador de tentativas de revisão
  revision_attempts: Annotation({
    reducer: (current, update) => current + update,
    default: () => 0
  }),

  // Metadados da resposta
  metadata: Annotation({
    reducer: (current, update) => ({ ...current, ...update }),
    default: () => ({
      model: 'gpt-4o',
      sources_used: [],
      evidence_count: 0,
      has_safety_warnings: false,
      processing_time_ms: 0
    })
  }),

  // Erro (se houver)
  error: Annotation({
    reducer: (_, update) => update,
    default: () => null
  })
});

/**
 * Estado inicial para uma nova requisição
 */
export function createInitialState(userId, conversationId, userQuery, contextType, systemMessage) {
  return {
    messages: [],
    user_query: userQuery,
    userId: userId,
    conversationId: conversationId,
    context_type: contextType || 'geral',
    system_message: systemMessage || 'Você é a CinthiaMed, uma assistente médica virtual.',
    raw_evidence: {
      semanticScholar: [],
      europePmc: [],
      clinicalTrials: [],
      openFDA: [],
      lilacs: []
    },
    regional_disease_info: { detected: false },
    api_errors: [],
    needs_drug_search: false,
    needs_regional_search: false,
    is_medical_question: false,
    clinical_synthesis: '',
    safety_warnings: [],
    is_safe: true,
    revision_attempts: 0,
    metadata: {
      model: 'gpt-4o',
      sources_used: [],
      evidence_count: 0,
      has_safety_warnings: false,
      processing_time_ms: 0
    },
    error: null
  };
}

export default GraphState;
