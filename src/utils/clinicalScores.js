/**
 * Sistema de Escores Clínicos e Calculadoras Médicas
 * Implementa validação, cálculo e interpretação baseados em evidências
 */

// ============================================
// 1. CALCULADORAS DE FÓRMULAS DIRETAS
// ============================================

export const directCalculators = {
  'Ânion Gap': {
    type: 'direct',
    fields: [
      { name: 'sodio', label: 'Sódio (Na)', unit: 'mEq/L', min: 120, max: 160 },
      { name: 'cloro', label: 'Cloro (Cl)', unit: 'mEq/L', min: 80, max: 120 },
      { name: 'bicarbonato', label: 'Bicarbonato (HCO₃)', unit: 'mEq/L', min: 10, max: 40 }
    ],
    calculate: (inputs) => {
      const gap = inputs.sodio - (inputs.cloro + inputs.bicarbonato);
      return {
        value: gap.toFixed(1),
        unit: 'mEq/L',
        interpretation: gap < 8 ? 'Baixo' : gap <= 12 ? 'Normal' : gap <= 16 ? 'Aumentado' : 'Muito aumentado',
        description: gap > 12
          ? 'Considerar acidose metabólica com ânion gap elevado (cetoacidose, acidose láctica, insuficiência renal, intoxicações)'
          : 'Ânion gap normal',
        reference: 'Kraut JA, Madias NE. N Engl J Med. 2014;371:2309-19'
      };
    }
  },

  'Osmolalidade': {
    type: 'direct',
    fields: [
      { name: 'sodio', label: 'Sódio (Na)', unit: 'mEq/L', min: 120, max: 160 },
      { name: 'glicose', label: 'Glicose', unit: 'mg/dL', min: 40, max: 600 },
      { name: 'ureia', label: 'Ureia', unit: 'mg/dL', min: 10, max: 200 }
    ],
    calculate: (inputs) => {
      const osm = (2 * inputs.sodio) + (inputs.glicose / 18) + (inputs.ureia / 6);
      return {
        value: osm.toFixed(1),
        unit: 'mOsm/kg',
        interpretation: osm < 275 ? 'Hiposmolar' : osm <= 295 ? 'Normal' : 'Hiperosmolar',
        description: osm > 295
          ? 'Hiperosmolaridade pode indicar desidratação, hiperglicemia ou hipernatremia'
          : osm < 275 ? 'Hipo-osmolaridade pode indicar SIADH, polidipsia ou hiponatremia' : 'Osmolalidade sérica normal',
        reference: 'Rasouli M. Clin Biochem. 2016;49(4-5):442-4'
      };
    }
  },

  'Depuração Creatinina': {
    type: 'direct',
    fields: [
      { name: 'idade', label: 'Idade', unit: 'anos', min: 18, max: 120 },
      { name: 'peso', label: 'Peso', unit: 'kg', min: 30, max: 200 },
      { name: 'creatinina', label: 'Creatinina', unit: 'mg/dL', min: 0.3, max: 15 },
      { name: 'sexo', label: 'Sexo', type: 'select', options: ['Masculino', 'Feminino'] }
    ],
    calculate: (inputs) => {
      let clearance = ((140 - inputs.idade) * inputs.peso) / (72 * inputs.creatinina);
      if (inputs.sexo === 'Feminino') clearance *= 0.85;

      return {
        value: clearance.toFixed(1),
        unit: 'mL/min',
        interpretation: clearance >= 90 ? 'Normal' : clearance >= 60 ? 'Leve redução' :
                       clearance >= 30 ? 'Moderada redução' : 'Grave redução',
        description: clearance < 60
          ? `Função renal reduzida (estágio ${clearance >= 30 ? '3' : '4-5'}). Considerar ajuste de doses de medicamentos.`
          : 'Função renal preservada',
        reference: 'Cockcroft DW, Gault MH. Nephron. 1976;16(1):31-41'
      };
    }
  },

  'MDRD': {
    type: 'direct',
    fields: [
      { name: 'creatinina', label: 'Creatinina', unit: 'mg/dL', min: 0.3, max: 15 },
      { name: 'idade', label: 'Idade', unit: 'anos', min: 18, max: 120 },
      { name: 'sexo', label: 'Sexo', type: 'select', options: ['Masculino', 'Feminino'] },
      { name: 'raca', label: 'Raça', type: 'select', options: ['Negra', 'Não-negra'] }
    ],
    calculate: (inputs) => {
      let tfg = 175 * Math.pow(inputs.creatinina, -1.154) * Math.pow(inputs.idade, -0.203);
      if (inputs.sexo === 'Feminino') tfg *= 0.742;
      if (inputs.raca === 'Negra') tfg *= 1.212;

      return {
        value: tfg.toFixed(1),
        unit: 'mL/min/1.73m²',
        interpretation: tfg >= 90 ? 'Normal (G1)' : tfg >= 60 ? 'Leve redução (G2)' :
                       tfg >= 45 ? 'Moderada redução (G3a)' : tfg >= 30 ? 'Moderada-grave (G3b)' :
                       tfg >= 15 ? 'Grave redução (G4)' : 'Falência renal (G5)',
        description: tfg < 60
          ? 'Doença renal crônica. Investigar causas, monitorar progressão e ajustar medicações.'
          : 'Taxa de filtração glomerular normal',
        reference: 'Levey AS, et al. Ann Intern Med. 1999;461-70'
      };
    }
  },

  'Déficit Água Livre': {
    type: 'direct',
    fields: [
      { name: 'sodio', label: 'Sódio atual', unit: 'mEq/L', min: 120, max: 180 },
      { name: 'peso', label: 'Peso', unit: 'kg', min: 30, max: 200 },
      { name: 'sexo', label: 'Sexo', type: 'select', options: ['Masculino', 'Feminino'] }
    ],
    calculate: (inputs) => {
      const fator = inputs.sexo === 'Masculino' ? 0.6 : 0.5;
      const deficit = fator * inputs.peso * ((inputs.sodio / 140) - 1);

      return {
        value: Math.abs(deficit).toFixed(1),
        unit: 'L',
        interpretation: deficit > 0 ? 'Déficit de água' : deficit < 0 ? 'Excesso de água' : 'Normal',
        description: deficit > 0
          ? `Déficit de ${Math.abs(deficit).toFixed(1)}L. Repor em 24-48h com SF 0,45% ou soro glicosado 5%. Correção máxima: 10-12 mEq/L/dia.`
          : deficit < 0 ? `Excesso de ${Math.abs(deficit).toFixed(1)}L. Restrição hídrica.` : 'Água corporal adequada',
        reference: 'Adrogue HJ, Madias NE. N Engl J Med. 2000;342:1493-9'
      };
    }
  },

  'Correção de Cálcio': {
    type: 'direct',
    fields: [
      { name: 'calcio', label: 'Cálcio total', unit: 'mg/dL', min: 5, max: 15 },
      { name: 'albumina', label: 'Albumina', unit: 'g/dL', min: 1.5, max: 5.5 }
    ],
    calculate: (inputs) => {
      const calcioCorrigido = inputs.calcio + (0.8 * (4.0 - inputs.albumina));

      return {
        value: calcioCorrigido.toFixed(1),
        unit: 'mg/dL',
        interpretation: calcioCorrigido < 8.5 ? 'Hipocalcemia' : calcioCorrigido <= 10.5 ? 'Normal' : 'Hipercalcemia',
        description: calcioCorrigido < 8.5
          ? 'Hipocalcemia corrigida. Investigar hipoparatireoidismo, deficiência de vitamina D, hipomagnesemia.'
          : calcioCorrigido > 10.5 ? 'Hipercalcemia corrigida. Investigar hiperparatireoidismo, malignidade, intoxicação por vitamina D.'
          : 'Cálcio corrigido normal',
        reference: 'Payne RB, et al. Br Med J. 1973;4:643-6'
      };
    }
  },

  'Correção de Sódio': {
    type: 'direct',
    fields: [
      { name: 'sodio', label: 'Sódio medido', unit: 'mEq/L', min: 120, max: 160 },
      { name: 'glicose', label: 'Glicose', unit: 'mg/dL', min: 40, max: 600 }
    ],
    calculate: (inputs) => {
      const sodioCorrigido = inputs.sodio + (0.016 * (inputs.glicose - 100));

      return {
        value: sodioCorrigido.toFixed(1),
        unit: 'mEq/L',
        interpretation: sodioCorrigido < 135 ? 'Hiponatremia' : sodioCorrigido <= 145 ? 'Normal' : 'Hipernatremia',
        description: inputs.glicose > 200
          ? `Hiperglicemia causa pseudohiponatremia. Sódio corrigido: ${sodioCorrigido.toFixed(1)} mEq/L`
          : 'Sódio corrigido pela glicemia',
        reference: 'Katz MA. N Engl J Med. 1973;289:843-4'
      };
    }
  },

  'IMC e ASC': {
    type: 'direct',
    fields: [
      { name: 'peso', label: 'Peso', unit: 'kg', min: 20, max: 300 },
      { name: 'altura', label: 'Altura', unit: 'cm', min: 100, max: 250 }
    ],
    calculate: (inputs) => {
      const alturaM = inputs.altura / 100;
      const imc = inputs.peso / (alturaM * alturaM);
      const asc = Math.sqrt((inputs.altura * inputs.peso) / 3600);

      let classificacao = '';
      if (imc < 18.5) classificacao = 'Baixo peso';
      else if (imc < 25) classificacao = 'Peso normal';
      else if (imc < 30) classificacao = 'Sobrepeso';
      else if (imc < 35) classificacao = 'Obesidade Grau I';
      else if (imc < 40) classificacao = 'Obesidade Grau II';
      else classificacao = 'Obesidade Grau III';

      return {
        value: `IMC: ${imc.toFixed(1)} | ASC: ${asc.toFixed(2)}`,
        unit: 'kg/m² | m²',
        interpretation: classificacao,
        description: `IMC ${imc.toFixed(1)} kg/m² (${classificacao}). Área de superfície corporal (Mosteller): ${asc.toFixed(2)} m²`,
        reference: 'WHO. BMI Classification. 2004; Mosteller RD. N Engl J Med. 1987;317:1098'
      };
    }
  },

  'QTc': {
    type: 'direct',
    fields: [
      { name: 'qt', label: 'Intervalo QT', unit: 'ms', min: 200, max: 700 },
      { name: 'fc', label: 'Frequência Cardíaca', unit: 'bpm', min: 30, max: 250 }
    ],
    calculate: (inputs) => {
      const rr = 60 / inputs.fc;
      const qtc = inputs.qt / Math.sqrt(rr);

      return {
        value: qtc.toFixed(0),
        unit: 'ms',
        interpretation: qtc < 340 ? 'Curto' : qtc <= 440 ? 'Normal' : qtc <= 500 ? 'Prolongado' : 'Muito prolongado',
        description: qtc > 500
          ? '⚠️ QTc muito prolongado! Alto risco de Torsades de Pointes. Avaliar causas (medicamentos, distúrbios eletrolíticos) e considerar monitorização.'
          : qtc > 440 ? 'QTc prolongado. Revisar medicações (antiarrítmicos, antipsicóticos, antibióticos) e eletrólitos.'
          : 'QTc normal',
        reference: 'Bazett HC. Heart. 1920;7:353-70'
      };
    }
  },

  'PAM': {
    type: 'direct',
    fields: [
      { name: 'sistolica', label: 'PA Sistólica', unit: 'mmHg', min: 60, max: 250 },
      { name: 'diastolica', label: 'PA Diastólica', unit: 'mmHg', min: 30, max: 150 }
    ],
    calculate: (inputs) => {
      const pam = (inputs.sistolica + 2 * inputs.diastolica) / 3;

      return {
        value: pam.toFixed(0),
        unit: 'mmHg',
        interpretation: pam < 65 ? 'Baixa (risco de hipoperfusão)' : pam <= 100 ? 'Normal' : 'Elevada',
        description: pam < 65
          ? '⚠️ PAM < 65 mmHg. Risco de hipoperfusão orgânica. Meta em sepse: PAM ≥ 65 mmHg.'
          : pam > 100 ? 'PAM elevada. Avaliar hipertensão e necessidade de controle.' : 'Pressão arterial média normal',
        reference: 'Rhodes A, et al. Intensive Care Med. 2017;43:304-77'
      };
    }
  },

  'Índice de Choque': {
    type: 'direct',
    fields: [
      { name: 'fc', label: 'Frequência Cardíaca', unit: 'bpm', min: 30, max: 250 },
      { name: 'pas', label: 'PA Sistólica', unit: 'mmHg', min: 60, max: 250 }
    ],
    calculate: (inputs) => {
      const indice = inputs.fc / inputs.pas;

      return {
        value: indice.toFixed(2),
        unit: '',
        interpretation: indice < 0.6 ? 'Normal' : indice <= 0.9 ? 'Leve instabilidade' :
                       indice <= 1.3 ? 'Moderada instabilidade' : 'Grave instabilidade',
        description: indice > 0.9
          ? `⚠️ Índice de choque ${indice.toFixed(2)}. Sugere hipovolemia/choque. Considerar ressuscitação volêmica agressiva.`
          : 'Índice de choque normal. Estabilidade hemodinâmica.',
        reference: 'Allgöwer M, Burri C. Dtsch Med Wochenschr. 1967;92:1947-50'
      };
    }
  },

  'Peso Corporal Ideal': {
    type: 'direct',
    fields: [
      { name: 'altura', label: 'Altura', unit: 'cm', min: 100, max: 250 },
      { name: 'sexo', label: 'Sexo', type: 'select', options: ['Masculino', 'Feminino'] }
    ],
    calculate: (inputs) => {
      const pci = inputs.sexo === 'Masculino'
        ? 50 + 0.91 * (inputs.altura - 152.4)
        : 45.5 + 0.91 * (inputs.altura - 152.4);

      return {
        value: pci.toFixed(1),
        unit: 'kg',
        interpretation: 'Peso corporal ideal calculado',
        description: `Peso corporal ideal (fórmula de Devine): ${pci.toFixed(1)} kg. Usado para cálculo de doses de medicamentos e volume corrente na ventilação mecânica.`,
        reference: 'Devine BJ. Drug Intell Clin Pharm. 1974;8:650-5'
      };
    }
  }
};

// ============================================
// 2. ESCORES DE PONTUAÇÃO (CHECKLISTS)
// ============================================

export const scoringTools = {
  'CURB-65': {
    type: 'checklist',
    items: [
      { id: 'confusao', label: 'Confusão mental', points: 1 },
      { id: 'ureia', label: 'Ureia > 19 mg/dL (ou > 7 mmol/L)', points: 1 },
      { id: 'respiracao', label: 'Frequência respiratória ≥ 30 ipm', points: 1 },
      { id: 'pressao', label: 'PA Sistólica < 90 mmHg OU Diastólica ≤ 60 mmHg', points: 1 },
      { id: 'idade', label: 'Idade ≥ 65 anos', points: 1 }
    ],
    interpret: (score) => {
      const interpretations = [
        { range: [0, 0], risk: 'Baixo risco', mortality: '0,7%', recommendation: 'Considerar tratamento ambulatorial' },
        { range: [1, 1], risk: 'Baixo risco', mortality: '2,1%', recommendation: 'Considerar tratamento ambulatorial ou internação breve' },
        { range: [2, 2], risk: 'Risco moderado', mortality: '9,2%', recommendation: 'Internação hospitalar recomendada' },
        { range: [3, 5], risk: 'Alto risco', mortality: '14-40%', recommendation: 'Internação hospitalar urgente, considerar UTI' }
      ];
      const result = interpretations.find(i => score >= i.range[0] && score <= i.range[1]);
      return {
        score,
        ...result,
        reference: 'Lim WS, et al. Thorax. 2003;58:377-82'
      };
    }
  },

  'Wells TVP': {
    type: 'checklist',
    items: [
      { id: 'cancer', label: 'Câncer ativo (tratamento em curso ou nos últimos 6 meses)', points: 1 },
      { id: 'paralisia', label: 'Paralisia, paresia ou imobilização recente de MMII', points: 1 },
      { id: 'acamado', label: 'Acamado > 3 dias ou cirurgia de grande porte < 12 semanas', points: 1 },
      { id: 'dor', label: 'Dor localizada ao longo do sistema venoso profundo', points: 1 },
      { id: 'inchaco', label: 'Inchaço de toda a perna', points: 1 },
      { id: 'panturrilha', label: 'Panturrilha > 3 cm comparada à assintomática', points: 1 },
      { id: 'edema', label: 'Edema depressível (cacifo)', points: 1 },
      { id: 'veias', label: 'Veias colaterais superficiais', points: 1 },
      { id: 'alternativo', label: 'Diagnóstico alternativo tão ou mais provável', points: -2 }
    ],
    interpret: (score) => {
      if (score <= 0) return {
        score, risk: 'Baixo', probability: '5%',
        recommendation: 'D-dímero. Se negativo, TVP improvável',
        reference: 'Wells PS, et al. Lancet. 1997;350:1795-8'
      };
      if (score <= 2) return {
        score, risk: 'Moderado', probability: '17%',
        recommendation: 'D-dímero. Se positivo, realizar ultrassom Doppler',
        reference: 'Wells PS, et al. Lancet. 1997;350:1795-8'
      };
      return {
        score, risk: 'Alto', probability: '53%',
        recommendation: 'Ultrassom Doppler de MMII imediato',
        reference: 'Wells PS, et al. Lancet. 1997;350:1795-8'
      };
    }
  },

  'Wells TEP': {
    type: 'checklist',
    items: [
      { id: 'taquicardia', label: 'Frequência cardíaca > 100 bpm', points: 1.5 },
      { id: 'cirurgia', label: 'Cirurgia ou imobilização nas últimas 4 semanas', points: 1.5 },
      { id: 'previo', label: 'TEP ou TVP prévios', points: 1.5 },
      { id: 'hemoptise', label: 'Hemoptise', points: 1 },
      { id: 'cancer', label: 'Câncer (ativo ou tratado nos últimos 6 meses)', points: 1 },
      { id: 'sinais_tvp', label: 'Sinais clínicos de TVP', points: 3 },
      { id: 'provavel', label: 'TEP mais provável que diagnóstico alternativo', points: 3 }
    ],
    interpret: (score) => {
      if (score < 2) return {
        score, risk: 'Baixo (TEP improvável)', probability: '1,3%',
        recommendation: 'D-dímero. Se negativo, TEP excluído. Se positivo, AngioTC',
        reference: 'Wells PS, et al. Ann Intern Med. 2001;135:98-107'
      };
      if (score <= 6) return {
        score, risk: 'Moderado (TEP improvável)', probability: '16%',
        recommendation: 'D-dímero. Se positivo, AngioTC. Considerar anticoagulação empírica',
        reference: 'Wells PS, et al. Ann Intern Med. 2001;135:98-107'
      };
      return {
        score, risk: 'Alto (TEP provável)', probability: '38%',
        recommendation: 'AngioTC imediata. Considerar anticoagulação empírica',
        reference: 'Wells PS, et al. Ann Intern Med. 2001;135:98-107'
      };
    }
  },

  'CHA₂DS₂-VASc': {
    type: 'checklist',
    items: [
      { id: 'ic', label: 'Insuficiência Cardíaca / Disfunção VE', points: 1 },
      { id: 'has', label: 'Hipertensão Arterial', points: 1 },
      { id: 'idade75', label: 'Idade ≥ 75 anos', points: 2 },
      { id: 'dm', label: 'Diabetes Mellitus', points: 1 },
      { id: 'avc', label: 'AVC / AIT / Tromboembolismo prévio', points: 2 },
      { id: 'vascular', label: 'Doença vascular (IAM, DAP, placa aórtica)', points: 1 },
      { id: 'idade65', label: 'Idade 65-74 anos', points: 1 },
      { id: 'feminino', label: 'Sexo feminino', points: 1 }
    ],
    interpret: (score) => {
      const risks = [
        { score: 0, risk: '0%/ano', recommendation: 'Sem anticoagulação (ou AAS)' },
        { score: 1, risk: '1,3%/ano', recommendation: 'Considerar anticoagulação oral (preferir DOACs)' },
        { score: 2, risk: '2,2%/ano', recommendation: 'Anticoagulação oral recomendada' },
        { score: 3, risk: '3,2%/ano', recommendation: 'Anticoagulação oral fortemente recomendada' },
        { score: 4, risk: '4,0%/ano', recommendation: 'Anticoagulação oral fortemente recomendada' },
        { score: 5, risk: '6,7%/ano', recommendation: 'Anticoagulação oral fortemente recomendada' },
        { score: 6, risk: '9,8%/ano', recommendation: 'Anticoagulação oral fortemente recomendada' },
        { score: 7, risk: '9,6%/ano', recommendation: 'Anticoagulação oral fortemente recomendada' },
        { score: 8, risk: '12,5%/ano', recommendation: 'Anticoagulação oral fortemente recomendada' },
        { score: 9, risk: '15,2%/ano', recommendation: 'Anticoagulação oral fortemente recomendada' }
      ];
      const result = risks.find(r => r.score === score) || risks[risks.length - 1];
      return {
        score,
        strokeRisk: result.risk,
        recommendation: result.recommendation,
        reference: 'Lip GY, et al. Chest. 2010;137:263-72'
      };
    }
  },

  'HEART': {
    type: 'sections',
    sections: [
      {
        name: 'História',
        options: [
          { label: 'Baixo risco', points: 0 },
          { label: 'Risco moderado', points: 1 },
          { label: 'Alto risco', points: 2 }
        ]
      },
      {
        name: 'ECG',
        options: [
          { label: 'Normal', points: 0 },
          { label: 'Alterações inespecíficas', points: 1 },
          { label: 'Alterações significativas (inversão T, supra/infra ST)', points: 2 }
        ]
      },
      {
        name: 'Idade',
        options: [
          { label: '< 45 anos', points: 0 },
          { label: '45-64 anos', points: 1 },
          { label: '≥ 65 anos', points: 2 }
        ]
      },
      {
        name: 'Fatores de Risco',
        options: [
          { label: 'Nenhum', points: 0 },
          { label: '1-2 fatores (HAS, DM, tabagismo, dislipidemia, história familiar)', points: 1 },
          { label: '≥ 3 fatores ou aterosclerose conhecida', points: 2 }
        ]
      },
      {
        name: 'Troponina',
        options: [
          { label: 'Normal', points: 0 },
          { label: '1-2x limite superior', points: 1 },
          { label: '> 2x limite superior', points: 2 }
        ]
      }
    ],
    interpret: (score) => {
      if (score <= 3) return {
        score, risk: 'Baixo', mace: '1,7%',
        recommendation: 'Alta segura. Seguimento ambulatorial',
        reference: 'Six AJ, et al. Neth Heart J. 2008;16:191-6'
      };
      if (score <= 6) return {
        score, risk: 'Moderado', mace: '12-17%',
        recommendation: 'Observação, troponina seriada, teste de provocação',
        reference: 'Six AJ, et al. Neth Heart J. 2008;16:191-6'
      };
      return {
        score, risk: 'Alto', mace: '50-65%',
        recommendation: 'Internação, cardiologia, considerar cateterismo',
        reference: 'Six AJ, et al. Neth Heart J. 2008;16:191-6'
      };
    }
  },

  'qSOFA': {
    type: 'checklist',
    items: [
      { id: 'fr', label: 'Frequência respiratória ≥ 22 ipm', points: 1 },
      { id: 'mental', label: 'Alteração do estado mental (Glasgow < 15)', points: 1 },
      { id: 'pas', label: 'Pressão arterial sistólica ≤ 100 mmHg', points: 1 }
    ],
    interpret: (score) => {
      if (score >= 2) return {
        score, risk: 'Alto risco de disfunção orgânica',
        mortality: '10-40%',
        recommendation: '⚠️ Suspeita de sepse! Avaliar SOFA completo, coletar lactato e culturas, iniciar antibióticos em 1h e ressuscitação volêmica.',
        reference: 'Singer M, et al. JAMA. 2016;315:801-10'
      };
      return {
        score, risk: 'Baixo risco',
        mortality: '< 3%',
        recommendation: 'qSOFA negativo. Sepse menos provável, mas manter vigilância.',
        reference: 'Singer M, et al. JAMA. 2016;315:801-10'
      };
    }
  },

  'Alvarado': {
    type: 'mixed',
    items: [
      { id: 'migracao', label: 'Dor migratória para FID', points: 1, type: 'checkbox' },
      { id: 'anorexia', label: 'Anorexia', points: 1, type: 'checkbox' },
      { id: 'nausea', label: 'Náusea/vômito', points: 1, type: 'checkbox' },
      { id: 'dor_qid', label: 'Dor no quadrante inferior direito', points: 2, type: 'checkbox' },
      { id: 'descompressao', label: 'Descompressão dolorosa', points: 1, type: 'checkbox' },
      { id: 'febre', label: 'Febre (> 37,5°C)', points: 1, type: 'checkbox' },
      { id: 'leucocitose', label: 'Leucocitose (> 10.000/mm³)', points: 2, type: 'checkbox' },
      { id: 'desvio', label: 'Desvio à esquerda (> 75% neutrófilos)', points: 1, type: 'checkbox' }
    ],
    interpret: (score) => {
      if (score <= 4) return {
        score, risk: 'Baixa probabilidade', probability: '5-25%',
        recommendation: 'Apendicite improvável. Observação ou alta com orientações de retorno.',
        reference: 'Alvarado A. Ann Emerg Med. 1986;15:557-64'
      };
      if (score <= 6) return {
        score, risk: 'Probabilidade intermediária', probability: '50%',
        recommendation: 'Realizar ultrassom ou TC de abdome. Considerar observação.',
        reference: 'Alvarado A. Ann Emerg Med. 1986;15:557-64'
      };
      return {
        score, risk: 'Alta probabilidade', probability: '75-95%',
        recommendation: 'Provável apendicite. Cirurgia geral, TC pré-operatória.',
        reference: 'Alvarado A. Ann Emerg Med. 1986;15:557-64'
      };
    }
  }
};

// Função auxiliar para validar valores biológicos
export const validateValue = (value, min, max, label) => {
  if (value < min || value > max) {
    return `⚠️ Valor de ${label} fora da faixa esperada (${min}-${max}). Verifique o dado inserido.`;
  }
  return null;
};
