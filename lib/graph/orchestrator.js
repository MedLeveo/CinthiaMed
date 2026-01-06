/**
 * Medical Workflow Orchestrator
 *
 * Substitui o LangGraph por um orquestrador simples em JavaScript puro
 * Mantém a mesma lógica de negócio, mas sem dependências externas complexas
 */

import {
  routerNode,
  multiSearcherNode,
  synthesizerNode,
  safetyCheckerNode,
  revisionNode
} from './nodes.js';
import { createInitialState } from './state.js';

/**
 * Orquestrador de fluxo médico
 * Executa os nós sequencialmente com lógica condicional
 */
export class MedicalWorkflowOrchestrator {
  constructor() {
    this.maxRevisions = 2; // Limite de revisões para evitar loops infinitos
  }

  /**
   * Executa o workflow completo
   * @param {Object} initialState - Estado inicial com user_query
   * @returns {Promise<Object>} Estado final com clinical_synthesis
   */
  async execute(inputState) {
    console.log('🚀 Iniciando Medical Workflow Orchestrator');

    // Inicializa estado usando a função de state.js
    let state = createInitialState(inputState);

    try {
      // 1️⃣ ROUTER NODE: Classifica a pergunta
      console.log('\n1️⃣ Router Node: Classificando pergunta...');
      const routerResult = await routerNode(state);
      state = this.mergeState(state, routerResult);
      console.log(`   → É pergunta médica? ${state.is_medical_question}`);

      // 2️⃣ MULTI SEARCHER NODE: Busca evidências (condicional)
      if (state.is_medical_question) {
        console.log('\n2️⃣ Multi Searcher Node: Buscando evidências científicas...');
        const searchResult = await multiSearcherNode(state);
        state = this.mergeState(state, searchResult);
        console.log(`   → Evidências encontradas: ${Object.keys(state.raw_evidence).length} fontes`);
      } else {
        console.log('\n⏭️  Pulando busca de evidências (não é pergunta médica)');
      }

      // 3️⃣ SYNTHESIZER NODE: Gera resposta clínica
      console.log('\n3️⃣ Synthesizer Node: Gerando resposta clínica...');
      const synthesizerResult = await synthesizerNode(state);
      state = this.mergeState(state, synthesizerResult);
      console.log(`   → Síntese gerada com sucesso`);

      // 4️⃣ SAFETY CHECKER + REVISION LOOP
      let revisionCount = 0;

      while (revisionCount < this.maxRevisions) {
        console.log(`\n4️⃣ Safety Checker Node: Validando segurança (tentativa ${revisionCount + 1}/${this.maxRevisions})...`);
        const safetyResult = await safetyCheckerNode(state);
        state = this.mergeState(state, safetyResult);

        if (state.is_safe) {
          console.log('   ✅ Resposta aprovada no Safety Checker');
          break;
        }

        console.log(`   ⚠️  Problemas encontrados: ${state.safety_issues?.map(i => i.type).join(', ') || 'Desconhecidos'}`);

        if (revisionCount < this.maxRevisions - 1) {
          console.log('\n5️⃣ Revision Node: Corrigindo problemas...');
          const revisionResult = await revisionNode(state);
          state = this.mergeState(state, revisionResult);
          state.revision_count += 1;
          console.log(`   → Revisão ${state.revision_count} concluída`);
        } else {
          console.log('   ⛔ Limite de revisões atingido');
          break;
        }

        revisionCount++;
      }

      console.log('\n✅ Workflow concluído com sucesso\n');
      return state;

    } catch (error) {
      console.error('❌ Erro no workflow:', error);
      console.error('Stack trace:', error.stack);

      // Retorna estado com erro detalhado
      return {
        ...state,
        error: error.message,
        error_details: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        clinical_synthesis: 'Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.'
      };
    }
  }


  /**
   * Merge de estado - combina estado atual com updates
   */
  mergeState(currentState, updates) {
    return {
      ...currentState,
      ...updates,

      // Arrays são concatenados, não substituídos
      conversation_history: [
        ...(currentState.conversation_history || []),
        ...(updates.conversation_history || [])
      ],

      api_errors: [
        ...(currentState.api_errors || []),
        ...(updates.api_errors || [])
      ],

      safety_issues: updates.safety_issues || currentState.safety_issues || [],

      // Objetos são merged
      raw_evidence: {
        ...(currentState.raw_evidence || {}),
        ...(updates.raw_evidence || {})
      },

      regional_disease_info: {
        ...(currentState.regional_disease_info || {}),
        ...(updates.regional_disease_info || {})
      },

      // Metadata merge
      metadata: {
        ...(currentState.metadata || {}),
        ...(updates.metadata || {})
      }
    };
  }
}

/**
 * Factory function para criar orchestrator
 */
export function createMedicalWorkflowOrchestrator() {
  return new MedicalWorkflowOrchestrator();
}

/**
 * Função de execução com streaming (compatível com API existente)
 */
export async function runWorkflowWithStreaming(initialState, onUpdate = null) {
  const orchestrator = createMedicalWorkflowOrchestrator();

  // Se houver callback de update, chama após cada nó
  if (onUpdate) {
    // Wrapper para chamar onUpdate após cada operação
    // Por enquanto, executa normalmente e retorna resultado final
    const result = await orchestrator.execute(initialState);
    onUpdate(result);
    return result;
  }

  return orchestrator.execute(initialState);
}
