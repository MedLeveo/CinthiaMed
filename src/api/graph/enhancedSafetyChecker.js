/**
 * Enhanced Safety Checker Node
 *
 * Auditor de Segurança Médica com critérios rigorosos:
 * 1. Dosagem incorreta
 * 2. Omissão de alertas críticos (Boxed Warnings)
 * 3. Conflito de protocolos regionais
 * 4. Contraindicações não mencionadas
 */

import { ChatOpenAI } from '@langchain/openai';

const llm = new ChatOpenAI({
  modelName: 'gpt-4o',
  temperature: 0.1, // Baixa temperatura para análise rigorosa
  maxTokens: 1500,
  openAIApiKey: process.env.OPENAI_API_KEY?.replace(/\s+/g, '')
});

/**
 * Auditor de Segurança Médica Aprimorado
 */
export async function enhancedSafetyCheckerNode(state) {
  console.log('\n🛡️ NÓ SAFETY CHECKER APRIMORADO: Auditoria rigorosa...');

  const { raw_evidence, clinical_synthesis, user_query } = state;

  // 1. VERIFICAR BOXED WARNINGS (ALERTAS CRÍTICOS)
  const boxedWarningIssues = await checkBoxedWarnings(raw_evidence.openFDA || [], clinical_synthesis);

  // 2. VERIFICAR DOSAGENS
  const dosageIssues = await checkDosageAccuracy(raw_evidence.openFDA || [], clinical_synthesis);

  // 3. VERIFICAR CONFLITOS DE PROTOCOLO REGIONAL
  const protocolConflicts = await checkRegionalProtocolConflicts(
    raw_evidence.lilacs || [],
    clinical_synthesis,
    user_query
  );

  // 4. VERIFICAR CONTRAINDICAÇÕES
  const contraindicationIssues = await checkContraindications(
    raw_evidence.openFDA || [],
    clinical_synthesis,
    user_query
  );

  // Consolidar problemas encontrados
  const allIssues = [
    ...boxedWarningIssues,
    ...dosageIssues,
    ...protocolConflicts,
    ...contraindicationIssues
  ];

  if (allIssues.length > 0) {
    console.log(`   ⚠️ ENCONTRADOS ${allIssues.length} PROBLEMAS DE SEGURANÇA:`);
    allIssues.forEach((issue, i) => {
      console.log(`   ${i + 1}. [${issue.severity}] ${issue.type}: ${issue.description}`);
    });

    return {
      is_safe: false,
      safety_warnings: allIssues,
      metadata: {
        ...state.metadata,
        safety_audit_performed: true,
        issues_found: allIssues.length
      }
    };
  }

  console.log('   ✅ Nenhum problema de segurança detectado');
  return {
    is_safe: true,
    safety_warnings: [],
    metadata: {
      ...state.metadata,
      safety_audit_performed: true,
      has_safety_warnings: false
    }
  };
}

/**
 * 1. Verificar se Boxed Warnings foram mencionados
 */
async function checkBoxedWarnings(fdaDrugs, synthesis) {
  const issues = [];

  for (const drug of fdaDrugs) {
    if (!drug.boxedWarning) continue;

    const drugName = drug.genericName.toLowerCase();
    const synthesisLower = synthesis.toLowerCase();

    // Medicamento foi mencionado na síntese?
    const drugMentioned = synthesisLower.includes(drugName.split(' ')[0]);

    if (!drugMentioned) continue; // Se não foi mencionado, não precisa verificar

    // Palavras-chave de aviso
    const warningKeywords = [
      'boxed warning', 'black box', 'tarja preta',
      'alerta crítico', 'alerta fda', 'aviso importante',
      'contraindicado', 'risco grave', 'não usar'
    ];

    const warningMentioned = warningKeywords.some(kw => synthesisLower.includes(kw));

    if (!warningMentioned) {
      issues.push({
        type: 'BOXED_WARNING_OMITTED',
        severity: 'CRÍTICO',
        drug: drug.brandName || drug.genericName,
        description: `Boxed Warning da FDA não foi mencionado: "${drug.boxedWarning.substring(0, 150)}..."`,
        recommendation: `Adicionar: "⚠️ ALERTA FDA: ${drug.boxedWarning}"`
      });
    }
  }

  return issues;
}

/**
 * 2. Verificar acurácia de dosagens
 */
async function checkDosageAccuracy(fdaDrugs, synthesis) {
  const issues = [];

  for (const drug of fdaDrugs) {
    if (!drug.dosageAndAdministration) continue;

    const drugName = drug.genericName.toLowerCase();
    const synthesisLower = synthesis.toLowerCase();

    // Procurar menções de dosagem na síntese
    const dosageRegex = /(\d+)\s*(mg|g|ml|mcg|ui)/gi;
    const matches = synthesis.match(dosageRegex);

    if (!matches) continue;

    // Extrair dosagens da FDA
    const fdaDosages = drug.dosageAndAdministration.match(/(\d+)\s*(mg|g|ml|mcg|ui)/gi) || [];

    // Usar LLM para comparação semântica
    const comparisonPrompt = `Compare as dosagens mencionadas:

DOSAGEM NA SÍNTESE: ${matches.join(', ')}
DOSAGEM APROVADA FDA: ${fdaDosages.join(', ')}

Medicamento: ${drug.genericName}
Informação completa FDA: ${drug.dosageAndAdministration.substring(0, 300)}

Há divergência SIGNIFICATIVA? Responda apenas SIM ou NÃO.
Se SIM, explique brevemente o erro.`;

    try {
      const response = await llm.invoke([
        { role: 'user', content: comparisonPrompt }
      ]);

      const result = response.content.toUpperCase();

      if (result.includes('SIM')) {
        issues.push({
          type: 'DOSAGE_INCORRECT',
          severity: 'ALTO',
          drug: drug.brandName || drug.genericName,
          description: result,
          recommendation: `Corrigir dosagem conforme FDA: ${fdaDosages.join(', ')}`
        });
      }
    } catch (error) {
      console.error('Erro ao verificar dosagem:', error.message);
    }
  }

  return issues;
}

/**
 * 3. Verificar conflitos com protocolos regionais (LILACS)
 */
async function checkRegionalProtocolConflicts(lilacsArticles, synthesis, userQuery) {
  const issues = [];

  if (lilacsArticles.length === 0) return issues;

  // Doenças que exigem prioridade LILACS
  const regionalDiseases = [
    'dengue', 'zika', 'chikungunya', 'febre amarela',
    'chagas', 'leishmaniose', 'malária', 'esquistossomose',
    'tuberculose', 'hanseníase'
  ];

  const queryLower = userQuery.toLowerCase();
  const isRegionalDisease = regionalDiseases.some(disease => queryLower.includes(disease));

  if (isRegionalDisease) {
    console.log('   🌎 Doença tropical/regional detectada - Priorizando LILACS');

    // Verificar se a síntese menciona protocolos LILACS
    const lilacsKeywords = ['protocolo brasileiro', 'ministério da saúde', 'sus', 'sbmt', 'lilacs'];
    const lilacsMentioned = lilacsKeywords.some(kw => synthesis.toLowerCase().includes(kw));

    if (!lilacsMentioned) {
      issues.push({
        type: 'REGIONAL_PROTOCOL_NOT_CITED',
        severity: 'ALTO',
        description: 'Doença tropical/regional detectada mas protocolos LILACS não foram citados',
        recommendation: 'Adicionar referência explícita aos protocolos brasileiros/regionais da LILACS'
      });
    }
  }

  // Verificar se há conflito entre LILACS e síntese
  const conflictCheckPrompt = `Você é um auditor de protocolos médicos.

PROTOCOLOS REGIONAIS (LILACS):
${lilacsArticles.map((article, i) => `${i + 1}. ${article.title} (${article.country})`).join('\n')}

SÍNTESE CLÍNICA GERADA:
${synthesis.substring(0, 500)}...

Pergunta: Há alguma CONTRADIÇÃO entre os protocolos LILACS e a síntese?
Por exemplo:
- LILACS recomenda X mas síntese sugere Y
- Medicamento proibido no Brasil foi sugerido
- Conduta específica do Brasil foi ignorada

Responda: SIM + explicação OU NÃO`;

  try {
    const response = await llm.invoke([
      { role: 'user', content: conflictCheckPrompt }
    ]);

    const result = response.content;

    if (result.toUpperCase().includes('SIM')) {
      issues.push({
        type: 'PROTOCOL_CONFLICT',
        severity: 'CRÍTICO',
        description: result,
        recommendation: 'Revisar síntese para alinhar com protocolos regionais'
      });
    }
  } catch (error) {
    console.error('Erro ao verificar conflitos de protocolo:', error.message);
  }

  return issues;
}

/**
 * 4. Verificar contraindicações
 */
async function checkContraindications(fdaDrugs, synthesis, userQuery) {
  const issues = [];

  // Condições comuns mencionadas em perguntas
  const conditions = [
    'gravidez', 'gestante', 'grávida',
    'lactação', 'amamentação',
    'criança', 'pediátrico', 'infantil',
    'idoso', 'geriátrico',
    'insuficiência renal', 'doença renal',
    'insuficiência hepática', 'cirrose',
    'diabetes', 'hipertensão'
  ];

  const queryLower = userQuery.toLowerCase();
  const detectedConditions = conditions.filter(cond => queryLower.includes(cond));

  if (detectedConditions.length === 0) return issues;

  console.log(`   🔍 Condições detectadas: ${detectedConditions.join(', ')}`);

  for (const drug of fdaDrugs) {
    if (!drug.contraindications && !drug.warnings) continue;

    const contraText = (drug.contraindications || '') + ' ' + (drug.warnings || '');
    const contraLower = contraText.toLowerCase();

    // Verificar se alguma condição do paciente está nas contraindicações
    for (const condition of detectedConditions) {
      if (contraLower.includes(condition)) {
        // Verificar se a síntese mencionou a contraindicação
        const synthesisLower = synthesis.toLowerCase();
        const contraindicationMentioned = synthesisLower.includes('contraindicad') ||
                                          synthesisLower.includes('não usar') ||
                                          synthesisLower.includes('evitar');

        if (!contraindicationMentioned) {
          issues.push({
            type: 'CONTRAINDICATION_NOT_MENTIONED',
            severity: 'CRÍTICO',
            drug: drug.brandName || drug.genericName,
            condition: condition,
            description: `${drug.genericName} tem contraindicação para ${condition} mas isso não foi mencionado`,
            recommendation: `Adicionar: "⚠️ CONTRAINDICADO em ${condition}"`
          });
        }
      }
    }
  }

  return issues;
}

export default {
  enhancedSafetyCheckerNode,
  checkBoxedWarnings,
  checkDosageAccuracy,
  checkRegionalProtocolConflicts,
  checkContraindications
};
