/**
 * Escores Clínicos Complexos
 * Implementa escores com árvore decisória e avaliações step-by-step
 */

export const complexScores = {
  'Glasgow': {
    type: 'stepbystep',
    sections: [
      {
        name: 'Abertura Ocular',
        options: [
          { label: 'Espontânea', points: 4 },
          { label: 'Ao comando verbal', points: 3 },
          { label: 'À dor', points: 2 },
          { label: 'Nenhuma', points: 1 }
        ]
      },
      {
        name: 'Resposta Verbal',
        options: [
          { label: 'Orientado e conversando', points: 5 },
          { label: 'Confuso', points: 4 },
          { label: 'Palavras inapropriadas', points: 3 },
          { label: 'Sons incompreensíveis', points: 2 },
          { label: 'Nenhuma', points: 1 }
        ]
      },
      {
        name: 'Resposta Motora',
        options: [
          { label: 'Obedece comandos', points: 6 },
          { label: 'Localiza dor', points: 5 },
          { label: 'Movimento de retirada à dor', points: 4 },
          { label: 'Flexão anormal (decorticação)', points: 3 },
          { label: 'Extensão anormal (descerebração)', points: 2 },
          { label: 'Nenhuma', points: 1 }
        ]
      }
    ],
    interpret: (score) => {
      if (score >= 14) return {
        score,
        severity: 'TCE Leve',
        description: 'Glasgow 14-15. Geralmente sem lesão intracraniana grave.',
        recommendation: 'Observação. TC de crânio conforme protocolo PECARN ou Canadense.',
        reference: 'Teasdale G, Jennett B. Lancet. 1974;2:81-4'
      };
      if (score >= 9) return {
        score,
        severity: 'TCE Moderado',
        description: 'Glasgow 9-13. Risco moderado de lesão intracraniana.',
        recommendation: 'TC de crânio imediata. Internação para observação. Considerar neurocirurgia.',
        reference: 'Teasdale G, Jennett B. Lancet. 1974;2:81-4'
      };
      return {
        score,
        severity: 'TCE Grave',
        description: `Glasgow ≤ 8. Alto risco de lesão grave. ${score <= 8 ? 'Indicação de IOT!' : ''}`,
        recommendation: '⚠️ TC de crânio urgente. IOT se Glasgow ≤ 8. UTI. Neurocirurgia de urgência.',
        reference: 'Teasdale G, Jennett B. Lancet. 1974;2:81-4'
      };
    }
  },

  'NIHSS': {
    type: 'stepbystep',
    sections: [
      {
        name: '1a. Nível de Consciência',
        options: [
          { label: 'Alerta', points: 0 },
          { label: 'Sonolento', points: 1 },
          { label: 'Estuporoso', points: 2 },
          { label: 'Coma', points: 3 }
        ]
      },
      {
        name: '1b. Perguntas (mês atual, idade)',
        options: [
          { label: 'Ambas corretas', points: 0 },
          { label: '1 correta', points: 1 },
          { label: 'Nenhuma correta', points: 2 }
        ]
      },
      {
        name: '1c. Comandos (fechar olhos, abrir/fechar mão)',
        options: [
          { label: 'Ambos corretos', points: 0 },
          { label: '1 correto', points: 1 },
          { label: 'Nenhum correto', points: 2 }
        ]
      },
      {
        name: '2. Melhor Olhar Conjugado',
        options: [
          { label: 'Normal', points: 0 },
          { label: 'Paralisia parcial do olhar', points: 1 },
          { label: 'Desvio forçado ou paralisia total', points: 2 }
        ]
      },
      {
        name: '3. Campos Visuais',
        options: [
          { label: 'Sem perda visual', points: 0 },
          { label: 'Hemianopsia parcial', points: 1 },
          { label: 'Hemianopsia completa', points: 2 },
          { label: 'Hemianopsia bilateral (cegueira cortical)', points: 3 }
        ]
      },
      {
        name: '4. Paralisia Facial',
        options: [
          { label: 'Movimentos normais/simétricos', points: 0 },
          { label: 'Paralisia menor (apagamento sulco nasolabial)', points: 1 },
          { label: 'Paralisia parcial (hemiface inferior)', points: 2 },
          { label: 'Paralisia completa (superior e inferior)', points: 3 }
        ]
      },
      {
        name: '5a. Motor Braço Esquerdo',
        options: [
          { label: 'Sem queda', points: 0 },
          { label: 'Queda antes de 10s', points: 1 },
          { label: 'Algum esforço contra gravidade', points: 2 },
          { label: 'Sem esforço contra gravidade', points: 3 },
          { label: 'Sem movimento', points: 4 }
        ]
      },
      {
        name: '5b. Motor Braço Direito',
        options: [
          { label: 'Sem queda', points: 0 },
          { label: 'Queda antes de 10s', points: 1 },
          { label: 'Algum esforço contra gravidade', points: 2 },
          { label: 'Sem esforço contra gravidade', points: 3 },
          { label: 'Sem movimento', points: 4 }
        ]
      },
      {
        name: '6a. Motor Perna Esquerda',
        options: [
          { label: 'Sem queda', points: 0 },
          { label: 'Queda antes de 5s', points: 1 },
          { label: 'Algum esforço contra gravidade', points: 2 },
          { label: 'Sem esforço contra gravidade', points: 3 },
          { label: 'Sem movimento', points: 4 }
        ]
      },
      {
        name: '6b. Motor Perna Direita',
        options: [
          { label: 'Sem queda', points: 0 },
          { label: 'Queda antes de 5s', points: 1 },
          { label: 'Algum esforço contra gravidade', points: 2 },
          { label: 'Sem esforço contra gravidade', points: 3 },
          { label: 'Sem movimento', points: 4 }
        ]
      },
      {
        name: '7. Ataxia de Membros',
        options: [
          { label: 'Ausente', points: 0 },
          { label: 'Presente em 1 membro', points: 1 },
          { label: 'Presente em 2 membros', points: 2 }
        ]
      },
      {
        name: '8. Sensibilidade',
        options: [
          { label: 'Normal', points: 0 },
          { label: 'Perda sensitiva leve a moderada', points: 1 },
          { label: 'Perda sensitiva grave ou total', points: 2 }
        ]
      },
      {
        name: '9. Melhor Linguagem',
        options: [
          { label: 'Sem afasia', points: 0 },
          { label: 'Afasia leve a moderada', points: 1 },
          { label: 'Afasia grave', points: 2 },
          { label: 'Mudo/afasia global', points: 3 }
        ]
      },
      {
        name: '10. Disartria',
        options: [
          { label: 'Normal', points: 0 },
          { label: 'Leve a moderada', points: 1 },
          { label: 'Grave/anártrico ou intubado', points: 2 }
        ]
      },
      {
        name: '11. Extinção/Desatenção',
        options: [
          { label: 'Sem negligência', points: 0 },
          { label: 'Negligência visual, táctil, auditiva ou espacial', points: 1 },
          { label: 'Hemi-inatência grave em > 1 modalidade', points: 2 }
        ]
      }
    ],
    interpret: (score) => {
      if (score === 0) return {
        score,
        severity: 'Sem sintomas de AVC',
        description: 'NIHSS = 0. Sem déficit neurológico detectável.',
        recommendation: 'Avaliar diagnósticos diferenciais. Considerar AIT se sintomas prévios.',
        trombolitico: 'Não elegível (sem déficit)',
        reference: 'Brott T, et al. Stroke. 1989;20:864-70'
      };
      if (score <= 4) return {
        score,
        severity: 'AVC Leve',
        description: 'NIHSS 1-4. Déficit neurológico menor.',
        recommendation: 'Avaliar elegibilidade para trombólise. Antiagregação se não candidato a trombolítico.',
        trombolitico: 'Discutir caso a caso (risco-benefício)',
        reference: 'Brott T, et al. Stroke. 1989;20:864-70'
      };
      if (score <= 15) return {
        score,
        severity: 'AVC Moderado',
        description: 'NIHSS 5-15. Déficit moderado.',
        recommendation: 'Candidato a trombólise IV (se janela < 4,5h) ou trombectomia mecânica (se < 24h).',
        trombolitico: 'Elegível se dentro da janela terapêutica',
        reference: 'Brott T, et al. Stroke. 1989;20:864-70'
      };
      if (score <= 20) return {
        score,
        severity: 'AVC Moderado-Grave',
        description: 'NIHSS 16-20. Déficit significativo.',
        recommendation: '⚠️ Candidato forte a trombólise + trombectomia. Considerar UTI.',
        trombolitico: 'Fortemente recomendado',
        reference: 'Brott T, et al. Stroke. 1989;20:864-70'
      };
      return {
        score,
        severity: 'AVC Grave',
        description: 'NIHSS > 20. Déficit neurológico extenso.',
        recommendation: '⚠️ AVC grave! Trombólise + trombectomia urgente. UTI. Neurologia/Neurocirurgia.',
        trombolitico: 'Urgente se elegível',
        mortalidade: 'Alta (40-60%)',
        reference: 'Brott T, et al. Stroke. 1989;20:864-70'
      };
    }
  },

  'CIWA-Ar': {
    type: 'stepbystep',
    sections: [
      {
        name: 'Náusea/Vômitos',
        info: 'Perguntar: Você sente náusea? Teve vômitos?',
        options: [
          { label: 'Nenhuma', points: 0 },
          { label: 'Náusea leve, sem vômitos', points: 1 },
          { label: 'Náusea intermitente', points: 2 },
          { label: 'Náusea intermitente com ânsia seca', points: 3 },
          { label: 'Náusea constante, ânsia e vômitos', points: 4 },
          { label: 'Náusea/vômitos constantes', points: 5 },
          { label: 'Náusea/vômitos constantes graves', points: 6 },
          { label: 'Náusea/vômitos muito graves', points: 7 }
        ]
      },
      {
        name: 'Tremor',
        info: 'Observar com braços estendidos e dedos separados',
        options: [
          { label: 'Sem tremor', points: 0 },
          { label: 'Não visível, mas sentido nas pontas dos dedos', points: 1 },
          { label: 'Moderado, com braços estendidos', points: 2 },
          { label: 'Moderado, com braços não estendidos', points: 3 },
          { label: 'Moderado a grave, com braços não estendidos', points: 4 },
          { label: 'Grave, mesmo com braços não estendidos', points: 5 },
          { label: 'Grave, mesmo em repouso', points: 6 },
          { label: 'Tremor muito grave', points: 7 }
        ]
      },
      {
        name: 'Sudorese Paroxística',
        info: 'Observar suor visível na testa',
        options: [
          { label: 'Sem suor', points: 0 },
          { label: 'Palmas úmidas', points: 1 },
          { label: 'Suor leve na testa', points: 2 },
          { label: 'Suor moderado na testa', points: 3 },
          { label: 'Gotas de suor na testa', points: 4 },
          { label: 'Suor abundante na testa', points: 5 },
          { label: 'Suor profuso', points: 6 },
          { label: 'Suor muito profuso', points: 7 }
        ]
      },
      {
        name: 'Ansiedade',
        info: 'Perguntar e observar',
        options: [
          { label: 'Sem ansiedade', points: 0 },
          { label: 'Levemente ansioso', points: 1 },
          { label: 'Moderadamente ansioso', points: 2 },
          { label: 'Ansioso, equivalente a um pânico agudo', points: 3 },
          { label: 'Ansiedade grave', points: 4 },
          { label: 'Pânico', points: 5 },
          { label: 'Pânico grave', points: 6 },
          { label: 'Pânico extremo', points: 7 }
        ]
      },
      {
        name: 'Agitação',
        info: 'Observar durante a avaliação',
        options: [
          { label: 'Atividade normal', points: 0 },
          { label: 'Atividade levemente aumentada', points: 1 },
          { label: 'Moderadamente inquieto', points: 2 },
          { label: 'Inquieto, com dificuldade de ficar sentado', points: 3 },
          { label: 'Frequentemente inquieto', points: 4 },
          { label: 'Agitado, pula constantemente', points: 5 },
          { label: 'Muito agitado', points: 6 },
          { label: 'Agitação extrema, risco de auto-lesão', points: 7 }
        ]
      },
      {
        name: 'Distúrbios Táteis',
        info: 'Perguntar: Você sente formigamento, prurido, queimação?',
        options: [
          { label: 'Nenhum', points: 0 },
          { label: 'Prurido/formigamento leve', points: 1 },
          { label: 'Prurido/formigamento moderado', points: 2 },
          { label: 'Prurido/formigamento moderado-grave', points: 3 },
          { label: 'Alucinações táteis moderadas', points: 4 },
          { label: 'Alucinações táteis graves', points: 5 },
          { label: 'Alucinações táteis muito graves', points: 6 },
          { label: 'Alucinações táteis extremas', points: 7 }
        ]
      },
      {
        name: 'Distúrbios Auditivos',
        info: 'Perguntar: Os sons parecem mais altos? Você ouve coisas que o incomodam?',
        options: [
          { label: 'Nenhum', points: 0 },
          { label: 'Hiperacusia leve', points: 1 },
          { label: 'Hiperacusia moderada', points: 2 },
          { label: 'Hiperacusia moderada-grave', points: 3 },
          { label: 'Alucinações auditivas moderadas', points: 4 },
          { label: 'Alucinações auditivas graves', points: 5 },
          { label: 'Alucinações auditivas muito graves', points: 6 },
          { label: 'Alucinações auditivas extremas', points: 7 }
        ]
      },
      {
        name: 'Distúrbios Visuais',
        info: 'Perguntar: A luz parece muito forte? Você vê algo que o perturba?',
        options: [
          { label: 'Nenhum', points: 0 },
          { label: 'Fotofobia leve', points: 1 },
          { label: 'Fotofobia moderada', points: 2 },
          { label: 'Fotofobia moderada-grave', points: 3 },
          { label: 'Alucinações visuais moderadas', points: 4 },
          { label: 'Alucinações visuais graves', points: 5 },
          { label: 'Alucinações visuais muito graves', points: 6 },
          { label: 'Alucinações visuais extremas', points: 7 }
        ]
      },
      {
        name: 'Cefaleia',
        info: 'Perguntar: Sua cabeça dói? Quão forte?',
        options: [
          { label: 'Sem cefaleia', points: 0 },
          { label: 'Cefaleia muito leve', points: 1 },
          { label: 'Cefaleia leve', points: 2 },
          { label: 'Cefaleia moderada', points: 3 },
          { label: 'Cefaleia moderada-grave', points: 4 },
          { label: 'Cefaleia grave', points: 5 },
          { label: 'Cefaleia muito grave', points: 6 },
          { label: 'Cefaleia extremamente grave', points: 7 }
        ]
      },
      {
        name: 'Orientação/Obnubilação',
        info: 'Perguntar: Que dia é hoje? Onde você está? Quem sou eu?',
        options: [
          { label: 'Orientado, lúcido', points: 0 },
          { label: 'Incerto sobre a data, mas < 2 dias de erro', points: 1 },
          { label: 'Desorientado para data por > 2 dias', points: 2 },
          { label: 'Desorientado para local e/ou pessoa', points: 3 },
          { label: 'Desorientação grave', points: 4 }
        ]
      }
    ],
    interpret: (score) => {
      if (score < 8) return {
        score,
        severity: 'Abstinência Leve/Ausente',
        description: 'CIWA-Ar < 8. Sintomas mínimos ou ausentes.',
        recommendation: 'Monitorização. Benzodiazepínico não necessário. Tiamina, folato, hidratação.',
        reference: 'Sullivan JT, et al. Br J Addict. 1989;84:1353-7'
      };
      if (score <= 15) return {
        score,
        severity: 'Abstinência Moderada',
        description: 'CIWA-Ar 8-15. Sintomas moderados.',
        recommendation: 'Benzodiazepínico (Diazepam 10mg ou Lorazepam 2mg VO). Reavaliar em 1h. Tiamina 300mg IV.',
        reference: 'Sullivan JT, et al. Br J Addict. 1989;84:1353-7'
      };
      return {
        score,
        severity: 'Abstinência Grave',
        description: 'CIWA-Ar > 15. Alto risco de delirium tremens e convulsões.',
        recommendation: '⚠️ Benzodiazepínico em doses altas (Diazepam 20mg ou Lorazepam 4mg IV). Tiamina 500mg IV. UTI. Reavaliar a cada 30min.',
        reference: 'Sullivan JT, et al. Br J Addict. 1989;84:1353-7'
      };
    }
  },

  'PECARN TCE': {
    type: 'decision-tree',
    ageGroups: {
      '< 2 anos': {
        highRisk: [
          'Glasgow < 15',
          'Afundamento ou fratura de crânio palpável',
          'Perda de consciência ≥ 5 segundos',
          'Hematoma não frontal',
          'Comportamento anormal na avaliação dos pais'
        ],
        moderateRisk: [
          'Hematoma frontal',
          'Perda de consciência < 5 segundos',
          'Mecanismo grave (queda > 90 cm, impacto contundente)'
        ]
      },
      '≥ 2 anos': {
        highRisk: [
          'Glasgow < 15 após 2 horas',
          'Sinais de fratura de base de crânio',
          'Perda de consciência',
          'Vômitos persistentes (≥ 3 episódios)',
          'Cefaleia grave'
        ],
        moderateRisk: [
          'Mecanismo grave (queda > 1,5m, impacto alta velocidade)',
          'Vômitos (< 3 episódios)'
        ]
      }
    },
    interpret: (ageGroup, risks) => {
      const hasHighRisk = risks.some(r => r.isHighRisk);
      const hasModerateRisk = risks.some(r => r.isModerateRisk);

      if (hasHighRisk) return {
        risk: 'Alto',
        recommendation: '⚠️ TC de crânio IMEDIATA. Risco de lesão intracraniana clinicamente importante: 4-7%.',
        reference: 'Kuppermann N, et al. Lancet. 2009;374:1160-70'
      };
      if (hasModerateRisk) return {
        risk: 'Moderado',
        recommendation: 'Considerar TC de crânio OU observação. Discutir com família. Risco de lesão: 0,9%.',
        reference: 'Kuppermann N, et al. Lancet. 2009;374:1160-70'
      };
      return {
        risk: 'Baixo',
        recommendation: 'TC de crânio não necessária. Risco de lesão intracraniana < 0,05%. Observação domiciliar com orientações de retorno.',
        reference: 'Kuppermann N, et al. Lancet. 2009;374:1160-70'
      };
    }
  },

  // Adicionar mais escores de UTI
  'SOFA': {
    type: 'sections',
    sections: [
      {
        name: 'Respiratório (PaO₂/FiO₂)',
        options: [
          { label: '≥ 400', points: 0 },
          { label: '< 400', points: 1 },
          { label: '< 300', points: 2 },
          { label: '< 200 com suporte ventilatório', points: 3 },
          { label: '< 100 com suporte ventilatório', points: 4 }
        ]
      },
      {
        name: 'Coagulação (Plaquetas x10³/µL)',
        options: [
          { label: '≥ 150', points: 0 },
          { label: '< 150', points: 1 },
          { label: '< 100', points: 2 },
          { label: '< 50', points: 3 },
          { label: '< 20', points: 4 }
        ]
      },
      {
        name: 'Hepático (Bilirrubina mg/dL)',
        options: [
          { label: '< 1,2', points: 0 },
          { label: '1,2 - 1,9', points: 1 },
          { label: '2,0 - 5,9', points: 2 },
          { label: '6,0 - 11,9', points: 3 },
          { label: '≥ 12', points: 4 }
        ]
      },
      {
        name: 'Cardiovascular (PAM e Vasopressores)',
        options: [
          { label: 'PAM ≥ 70 mmHg', points: 0 },
          { label: 'PAM < 70 mmHg', points: 1 },
          { label: 'Dopamina ≤ 5 ou Dobutamina (qualquer dose)', points: 2 },
          { label: 'Dopamina > 5 ou Noradrenalina ≤ 0,1', points: 3 },
          { label: 'Dopamina > 15 ou Noradrenalina > 0,1', points: 4 }
        ]
      },
      {
        name: 'Sistema Nervoso Central (Glasgow)',
        options: [
          { label: '15', points: 0 },
          { label: '13-14', points: 1 },
          { label: '10-12', points: 2 },
          { label: '6-9', points: 3 },
          { label: '< 6', points: 4 }
        ]
      },
      {
        name: 'Renal (Creatinina mg/dL ou Débito Urinário)',
        options: [
          { label: '< 1,2', points: 0 },
          { label: '1,2 - 1,9', points: 1 },
          { label: '2,0 - 3,4', points: 2 },
          { label: '3,5 - 4,9 ou débito < 500 mL/dia', points: 3 },
          { label: '≥ 5,0 ou débito < 200 mL/dia', points: 4 }
        ]
      }
    ],
    interpret: (score) => {
      const mortality = score < 2 ? '< 10%' : score <= 5 ? '15-20%' :
                       score <= 9 ? '40-50%' : score <= 14 ? '> 50%' : '> 80%';

      return {
        score,
        severity: score < 2 ? 'Baixa disfunção' : score <= 5 ? 'Disfunção moderada' :
                 score <= 9 ? 'Disfunção grave' : 'Disfunção muito grave',
        mortality,
        recommendation: score >= 10
          ? '⚠️ SOFA ≥ 10: Mortalidade > 50%. Suporte intensivo multissistêmico urgente.'
          : score >= 6 ? 'SOFA 6-9: Monitorização contínua e suporte de múltiplos órgãos.'
          : 'SOFA < 6: Monitorização de sinais de deterioração.',
        reference: 'Vincent JL, et al. Intensive Care Med. 1996;22:707-10'
      };
    }
  },

  'APACHE II': {
    type: 'complex',
    // Este seria muito complexo para implementar completamente aqui
    // Placeholder para versão simplificada
    description: 'Acute Physiology and Chronic Health Evaluation II - Sistema de 12 variáveis fisiológicas + idade + doença crônica. Score: 0-71 pontos.',
    note: 'Por sua complexidade (12 parâmetros fisiológicos), recomenda-se calculadora dedicada online.',
    reference: 'Knaus WA, et al. Crit Care Med. 1985;13:818-29'
  },

  'Ranson': {
    type: 'mixed',
    description: 'Critérios de Ranson para Pancreatite Aguda',
    admissionCriteria: [
      { id: 'idade', label: 'Idade > 55 anos', points: 1 },
      { id: 'leucocitos', label: 'Leucócitos > 16.000/mm³', points: 1 },
      { id: 'glicose', label: 'Glicose > 200 mg/dL', points: 1 },
      { id: 'ldh', label: 'LDH > 350 U/L', points: 1 },
      { id: 'ast', label: 'AST > 250 U/L', points: 1 }
    ],
    criteria48h: [
      { id: 'ht_queda', label: 'Queda Ht > 10%', points: 1 },
      { id: 'ureia', label: 'Aumento ureia > 5 mg/dL', points: 1 },
      { id: 'calcio', label: 'Cálcio < 8 mg/dL', points: 1 },
      { id: 'pao2', label: 'PaO₂ < 60 mmHg', points: 1 },
      { id: 'deficit_base', label: 'Déficit de base > 4 mEq/L', points: 1 },
      { id: 'sequestro', label: 'Sequestro líquido > 6L', points: 1 }
    ],
    interpret: (score) => {
      const mortality = score <= 2 ? '< 1%' : score <= 5 ? '15%' : '40%';
      return {
        score,
        mortality,
        severity: score <= 2 ? 'Leve' : score <= 5 ? 'Moderada' : 'Grave',
        recommendation: score > 5
          ? '⚠️ Pancreatite grave! UTI, nutrição enteral precoce, antibióticos se necrose infectada.'
          : 'Monitorização, hidratação, analgesia, jejum até melhora clínica.',
        reference: 'Ranson JH, et al. Surg Gynecol Obstet. 1974;139:69-81'
      };
    }
  },

  'MELD': {
    type: 'direct',
    fields: [
      { name: 'bilirrubina', label: 'Bilirrubina total', unit: 'mg/dL', min: 0.3, max: 50 },
      { name: 'creatinina', label: 'Creatinina', unit: 'mg/dL', min: 0.3, max: 15 },
      { name: 'inr', label: 'INR', unit: '', min: 0.8, max: 10 },
      { name: 'dialise', label: 'Diálise nos últimos 7 dias', type: 'select', options: ['Não', 'Sim'] }
    ],
    calculate: (inputs) => {
      let bili = Math.max(1.0, inputs.bilirrubina);
      let creat = inputs.dialise === 'Sim' ? 4.0 : Math.max(1.0, inputs.creatinina);
      let inr = Math.max(1.0, inputs.inr);

      const meld = Math.round(
        9.57 * Math.log(creat) +
        3.78 * Math.log(bili) +
        11.2 * Math.log(inr) +
        6.43
      );

      const meldCapped = Math.min(40, Math.max(6, meld));

      return {
        value: meldCapped,
        unit: 'pontos',
        interpretation: meldCapped < 10 ? 'MELD baixo' : meldCapped <= 19 ? 'MELD intermediário' :
                       meldCapped <= 29 ? 'MELD alto' : 'MELD muito alto',
        mortality3meses: meldCapped < 10 ? '1,9%' : meldCapped <= 19 ? '6%' :
                        meldCapped <= 29 ? '19%' : '> 50%',
        recommendation: meldCapped >= 15
          ? `MELD ${meldCapped}: Avaliar para transplante hepático. Mortalidade em 3 meses sem transplante: ${meldCapped <= 19 ? '6%' : meldCapped <= 29 ? '19%' : '> 50%'}.`
          : 'MELD < 15: Seguimento ambulatorial. Reavaliar se descompensação.',
        reference: 'Kamath PS, et al. Hepatology. 2001;33:464-70'
      };
    }
  },

  'Child-Pugh': {
    type: 'sections',
    sections: [
      {
        name: 'Bilirrubina (mg/dL)',
        options: [
          { label: '< 2', points: 1 },
          { label: '2 - 3', points: 2 },
          { label: '> 3', points: 3 }
        ]
      },
      {
        name: 'Albumina (g/dL)',
        options: [
          { label: '> 3,5', points: 1 },
          { label: '2,8 - 3,5', points: 2 },
          { label: '< 2,8', points: 3 }
        ]
      },
      {
        name: 'INR',
        options: [
          { label: '< 1,7', points: 1 },
          { label: '1,7 - 2,3', points: 2 },
          { label: '> 2,3', points: 3 }
        ]
      },
      {
        name: 'Ascite',
        options: [
          { label: 'Ausente', points: 1 },
          { label: 'Leve (controlada com diurético)', points: 2 },
          { label: 'Moderada/Grave (refratária)', points: 3 }
        ]
      },
      {
        name: 'Encefalopatia Hepática',
        options: [
          { label: 'Ausente', points: 1 },
          { label: 'Grau I-II (leve)', points: 2 },
          { label: 'Grau III-IV (grave)', points: 3 }
        ]
      }
    ],
    interpret: (score) => {
      const classe = score <= 6 ? 'A' : score <= 9 ? 'B' : 'C';
      const mortality1ano = classe === 'A' ? '10%' : classe === 'B' ? '30%' : '80%';
      const mortality2anos = classe === 'A' ? '20%' : classe === 'B' ? '60%' : '100%';

      return {
        score,
        classe: `Child-Pugh ${classe}`,
        severity: classe === 'A' ? 'Compensada' : classe === 'B' ? 'Descompensação moderada' : 'Descompensação grave',
        mortality1ano,
        mortality2anos,
        recommendation: classe === 'C'
          ? '⚠️ Child C: Avaliar urgência para transplante hepático. Mortalidade 1 ano: 80%.'
          : classe === 'B' ? 'Child B: Considerar transplante. Otimizar tratamento compensatório.'
          : 'Child A: Seguimento ambulatorial. Evitar hepatotóxicos.',
        reference: 'Pugh RN, et al. Br J Surg. 1973;60:646-9'
      };
    }
  },

  'GRACE': {
    type: 'sections',
    description: 'Global Registry of Acute Coronary Events - Risco em SCA',
    sections: [
      {
        name: 'Idade',
        options: [
          { label: '< 40 anos', points: 0 },
          { label: '40-49 anos', points: 18 },
          { label: '50-59 anos', points: 36 },
          { label: '60-69 anos', points: 55 },
          { label: '70-79 anos', points: 73 },
          { label: '≥ 80 anos', points: 91 }
        ]
      },
      {
        name: 'Frequência Cardíaca (bpm)',
        options: [
          { label: '< 70', points: 0 },
          { label: '70-89', points: 7 },
          { label: '90-109', points: 13 },
          { label: '110-149', points: 23 },
          { label: '≥ 150', points: 36 }
        ]
      },
      {
        name: 'Pressão Arterial Sistólica (mmHg)',
        options: [
          { label: '< 80', points: 63 },
          { label: '80-99', points: 58 },
          { label: '100-119', points: 47 },
          { label: '120-139', points: 37 },
          { label: '140-159', points: 26 },
          { label: '160-199', points: 11 },
          { label: '≥ 200', points: 0 }
        ]
      },
      {
        name: 'Classe Killip',
        options: [
          { label: 'I (sem IC)', points: 0 },
          { label: 'II (estertores ou B3)', points: 21 },
          { label: 'III (edema agudo)', points: 43 },
          { label: 'IV (choque cardiogênico)', points: 64 }
        ]
      },
      {
        name: 'Creatinina (mg/dL)',
        options: [
          { label: '0-0,39', points: 2 },
          { label: '0,4-0,79', points: 5 },
          { label: '0,8-1,19', points: 8 },
          { label: '1,2-1,59', points: 11 },
          { label: '1,6-1,99', points: 14 },
          { label: '2,0-3,99', points: 23 },
          { label: '≥ 4,0', points: 31 }
        ]
      },
      {
        name: 'Parada Cardíaca na Admissão',
        options: [
          { label: 'Não', points: 0 },
          { label: 'Sim', points: 43 }
        ]
      },
      {
        name: 'Desvio do Segmento ST',
        options: [
          { label: 'Não', points: 0 },
          { label: 'Sim', points: 30 }
        ]
      },
      {
        name: 'Biomarcadores Cardíacos Elevados',
        options: [
          { label: 'Não', points: 0 },
          { label: 'Sim', points: 15 }
        ]
      }
    ],
    interpret: (score) => {
      let risk, mortalityHospital, mortality6m;

      if (score <= 108) {
        risk = 'Baixo';
        mortalityHospital = '< 1%';
        mortality6m = '< 3%';
      } else if (score <= 140) {
        risk = 'Intermediário';
        mortalityHospital = '1-3%';
        mortality6m = '3-8%';
      } else {
        risk = 'Alto';
        mortalityHospital = '> 3%';
        mortality6m = '> 8%';
      }

      return {
        score,
        risk,
        mortalityHospital,
        mortality6m,
        recommendation: score > 140
          ? '⚠️ GRACE alto risco! Estratégia invasiva precoce (cateterismo < 24h). Antiagregação dupla + anticoagulação.'
          : score > 108 ? 'GRACE intermediário. Estratégia invasiva em 24-72h. Monitorização contínua.'
          : 'GRACE baixo risco. Estratégia conservadora ou invasiva seletiva.',
        reference: 'Granger CB, et al. Arch Intern Med. 2003;163:2345-53'
      };
    }
  }
};

export default complexScores;
