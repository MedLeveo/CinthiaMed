/**
 * Medical Workflow - Orquestração do fluxo de IA
 *
 * ATUALIZADO: Removido LangGraph, usando orchestrator nativo
 * Mantém mesma interface pública para compatibilidade com api/server.js
 */

import {
  createMedicalWorkflowOrchestrator,
  runWorkflowWithStreaming as runOrchestrator
} from './orchestrator.js';

/**
 * Cria o workflow (compatibilidade com interface anterior)
 * Antes: retornava LangGraph compiled app
 * Agora: retorna orchestrator
 */
export function createMedicalAgentWorkflow() {
  console.log('\n🏗️  Construindo workflow do agente médico...');
  console.log('✅ Usando Orchestrator nativo (sem LangGraph)\n');

  return createMedicalWorkflowOrchestrator();
}

/**
 * Executa o workflow com streaming de eventos
 * Mantém mesma assinatura para compatibilidade
 *
 * @param {Object} workflow - Orchestrator instance
 * @param {Object} initialState - Estado inicial
 * @param {Function} onEvent - Callback para eventos (opcional)
 * @returns {Promise<Object>} Estado final
 */
export async function runWorkflowWithStreaming(workflow, initialState, onEvent = null) {
  console.log('\n🚀 Iniciando execução do workflow...\n');
  console.log('='.repeat(80));

  const startTime = Date.now();

  try {
    // Executa workflow
    const finalState = await workflow.execute(initialState);

    const totalTime = Date.now() - startTime;

    console.log('='.repeat(80));
    console.log(`\n✅ Workflow concluído em ${totalTime}ms`);

    // Callback final
    if (onEvent) {
      onEvent(finalState);
    }

    // Adiciona metadata de timing e atualiza campos
    return {
      ...finalState,
      end_time: new Date().toISOString(),
      total_processing_time_ms: totalTime,
      metadata: {
        ...finalState.metadata,
        total_processing_time_ms: totalTime,
        has_safety_warnings: finalState.safety_issues?.length > 0 || false
      }
    };

  } catch (error) {
    const errorTime = Date.now() - startTime;
    console.error(`\n❌ Erro no workflow após ${errorTime}ms:`, error.message);

    throw error;
  }
}

export default {
  createMedicalAgentWorkflow,
  runWorkflowWithStreaming
};
