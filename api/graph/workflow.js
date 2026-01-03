/**
 * LangGraph Workflow - Orquestração do fluxo de IA
 *
 * Define o grafo de execução com nós e arestas condicionais
 */

import { StateGraph, END } from '@langchain/langgraph';
import { GraphState } from './state.js';
import {
  routerNode,
  multiSearcherNode,
  synthesizerNode,
  safetyCheckerNode,
  revisionNode
} from './nodes.js';

/**
 * Função de decisão: Roteamento após Router Node
 * Decide se vai buscar evidências ou pular direto para síntese
 */
function shouldSearch(state) {
  if (!state.is_medical_question) {
    console.log('→ Pulando busca (não é pergunta médica)');
    return 'synthesizer';
  }

  console.log('→ Iniciando busca de evidências');
  return 'multi_searcher';
}

/**
 * Função de decisão: Após Safety Checker
 * Decide se a resposta precisa de revisão
 */
function needsRevision(state) {
  // Limitar a 2 tentativas de revisão para evitar loop infinito
  if (state.revision_attempts >= 2) {
    console.log('→ Máximo de revisões atingido, aprovando resposta');
    return END;
  }

  if (!state.is_safe) {
    console.log('→ Resposta NÃO SEGURA, enviando para revisão');
    return 'revision';
  }

  console.log('→ Resposta aprovada pelo revisor de segurança');
  return END;
}

/**
 * Cria e compila o workflow do LangGraph
 */
export function createMedicalAgentWorkflow() {
  console.log('\n🏗️  Construindo workflow do agente médico...');

  // Criar grafo
  const workflow = new StateGraph(GraphState);

  // ADICIONAR NÓS
  workflow.addNode('router', routerNode);
  workflow.addNode('multi_searcher', multiSearcherNode);
  workflow.addNode('synthesizer', synthesizerNode);
  workflow.addNode('safety_checker', safetyCheckerNode);
  workflow.addNode('revision', revisionNode);

  // DEFINIR PONTO DE ENTRADA
  workflow.setEntryPoint('router');

  // ADICIONAR ARESTAS

  // Router → Multi Searcher OU Synthesizer (condicional)
  workflow.addConditionalEdges(
    'router',
    shouldSearch,
    {
      multi_searcher: 'multi_searcher',
      synthesizer: 'synthesizer'
    }
  );

  // Multi Searcher → Synthesizer (sempre)
  workflow.addEdge('multi_searcher', 'synthesizer');

  // Synthesizer → Safety Checker (sempre)
  workflow.addEdge('synthesizer', 'safety_checker');

  // Safety Checker → Revision OU END (condicional)
  workflow.addConditionalEdges(
    'safety_checker',
    needsRevision,
    {
      revision: 'revision',
      [END]: END
    }
  );

  // Revision → Safety Checker (loop de revisão)
  workflow.addEdge('revision', 'safety_checker');

  // Compilar grafo
  const app = workflow.compile();

  console.log('✅ Workflow compilado com sucesso\n');
  console.log('📊 ESTRUTURA DO GRAFO:');
  console.log('   1. router → (decide) → multi_searcher OU synthesizer');
  console.log('   2. multi_searcher → synthesizer');
  console.log('   3. synthesizer → safety_checker');
  console.log('   4. safety_checker → (decide) → revision OU END');
  console.log('   5. revision → safety_checker (loop)');
  console.log('');

  return app;
}

/**
 * Executa o workflow com streaming de eventos
 */
export async function runWorkflowWithStreaming(app, initialState, onEvent) {
  console.log('\n🚀 Iniciando execução do workflow...\n');
  console.log('='.repeat(80));

  const startTime = Date.now();
  let finalState = null;

  try {
    // Executar workflow com streaming
    const stream = await app.stream(initialState, {
      streamMode: 'values' // Stream dos valores do estado
    });

    for await (const event of stream) {
      // Callback para cada evento (para logging/debugging)
      if (onEvent) {
        onEvent(event);
      }

      // Salvar último estado
      finalState = event;
    }

    const totalTime = Date.now() - startTime;

    console.log('='.repeat(80));
    console.log(`\n✅ Workflow concluído em ${totalTime}ms`);

    if (finalState) {
      finalState.metadata = {
        ...finalState.metadata,
        total_processing_time_ms: totalTime
      };
    }

    return finalState;

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
