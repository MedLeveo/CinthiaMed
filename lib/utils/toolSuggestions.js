/**
 * Sistema de Sugestão de Ferramentas Clínicas
 *
 * Analisa a resposta da IA e sugere ferramentas relevantes:
 * - Calculadoras médicas
 * - Fluxogramas clínicos
 * - Escores clínicos
 */

/**
 * Catálogo de ferramentas disponíveis
 */
// Ícones SVG simples e cinzas
const Icons = {
  calculator: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/><line x1="8" y1="18" x2="12" y2="18"/><circle cx="15" cy="16" r="2"/></svg>',
  flowchart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="12" y1="9" x2="12" y2="15"/></svg>',
  score: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>',
  heart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>',
  syringe: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2l4 4"/><path d="M17 7l3-3"/><path d="M19 9l-5 5-5-5"/><path d="M14 14l-2 2-6-6 2-2"/><path d="M4 12l2 2"/><path d="M8 8l4 4"/></svg>',
  droplet: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>',
  scale: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18"/><path d="M5 9l7-7 7 7"/><path d="M5 15h14"/></svg>',
  beaker: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3h6"/><path d="M10 3v7a4 4 0 01-1.172 2.828L4 18h16l-4.828-5.172A4 4 0 0114 10V3"/><line x1="6" y1="18" x2="18" y2="18"/></svg>'
};

export const TOOL_CATALOG = {
  calculators: [
    {
      id: 'insulin-nph',
      name: 'Calculadora de Insulina NPH',
      description: 'Cálculo de dose de insulina NPH baseado em peso e situação clínica',
      keywords: ['insulina', 'nph', 'diabetes', 'glicemia', 'dose'],
      icon: Icons.syringe,
      type: 'calculator'
    },
    {
      id: 'insulin-regular',
      name: 'Calculadora de Insulina Regular',
      description: 'Cálculo de dose de insulina regular humana',
      keywords: ['insulina regular', 'diabetes', 'dose', 'glicemia'],
      icon: Icons.syringe,
      type: 'calculator'
    },
    {
      id: 'glicemia',
      name: 'Calculadora de Correção Glicêmica',
      description: 'Fator de correção e dose de insulina',
      keywords: ['glicemia', 'hiperglicemia', 'correção', 'insulina'],
      icon: Icons.droplet,
      type: 'calculator'
    },
    {
      id: 'imc',
      name: 'Calculadora de IMC',
      description: 'Índice de Massa Corporal',
      keywords: ['imc', 'peso', 'obesidade', 'altura'],
      icon: Icons.scale,
      type: 'calculator'
    },
    {
      id: 'clearance-creatinina',
      name: 'Clearance de Creatinina',
      description: 'Estimativa de função renal (Cockcroft-Gault)',
      keywords: ['creatinina', 'renal', 'rim', 'tfg', 'clearance'],
      icon: Icons.beaker,
      type: 'calculator'
    }
  ],

  flowcharts: [
    {
      id: 'diabetes-tipo2-manejo',
      name: 'Fluxograma - Diabetes Tipo 2',
      description: 'Manejo da insulinoterapia no DM2',
      keywords: ['diabetes tipo 2', 'dm2', 'insulina', 'manejo', 'tratamento'],
      icon: Icons.flowchart,
      type: 'flowchart',
      source: 'Ministério da Saúde (2024)'
    },
    {
      id: 'diabetes-tipo1',
      name: 'Fluxograma - Diabetes Tipo 1',
      description: 'Diagnóstico e ajuste de doses',
      keywords: ['diabetes tipo 1', 'dm1', 'diagnóstico'],
      icon: Icons.flowchart,
      type: 'flowchart',
      source: 'Ministério da Saúde (2019)'
    },
    {
      id: 'hipertensao',
      name: 'Fluxograma - Hipertensão',
      description: 'Manejo da hipertensão arterial',
      keywords: ['hipertensão', 'pressão alta', 'has'],
      icon: Icons.flowchart,
      type: 'flowchart',
      source: 'Diretriz Brasileira de Hipertensão'
    }
  ],

  scores: [
    {
      id: 'chads-vasc',
      name: 'Escore CHA₂DS₂-VASc',
      description: 'Risco de AVC em fibrilação atrial',
      keywords: ['fibrilação atrial', 'avc', 'anticoagulação', 'chads'],
      icon: Icons.heart,
      type: 'score'
    },
    {
      id: 'wells-tvp',
      name: 'Escore de Wells (TVP)',
      description: 'Probabilidade de trombose venosa profunda',
      keywords: ['tvp', 'trombose', 'wells', 'embolia'],
      icon: Icons.score,
      type: 'score'
    },
    {
      id: 'curb65',
      name: 'Escore CURB-65',
      description: 'Gravidade de pneumonia comunitária',
      keywords: ['pneumonia', 'curb', 'pac', 'gravidade'],
      icon: Icons.score,
      type: 'score'
    },
    {
      id: 'grace',
      name: 'Escore GRACE',
      description: 'Risco em síndrome coronariana aguda',
      keywords: ['infarto', 'grace', 'sca', 'coronária'],
      icon: Icons.heart,
      type: 'score'
    }
  ]
};

/**
 * Analisa o texto e retorna ferramentas relevantes
 * @param {string} text - Texto da resposta da IA
 * @param {string} userQuery - Pergunta original do usuário
 * @returns {Array} Array de ferramentas sugeridas
 */
export function suggestTools(text, userQuery = '') {
  const combinedText = `${text} ${userQuery}`.toLowerCase();
  const suggestions = [];

  // Verificar todas as categorias
  Object.values(TOOL_CATALOG).flat().forEach(tool => {
    const matchScore = tool.keywords.reduce((score, keyword) => {
      const regex = new RegExp(keyword.toLowerCase(), 'gi');
      const matches = (combinedText.match(regex) || []).length;
      return score + matches;
    }, 0);

    if (matchScore > 0) {
      suggestions.push({
        ...tool,
        relevanceScore: matchScore
      });
    }
  });

  // Ordenar por relevância e retornar top 3
  return suggestions
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 3);
}

/**
 * Agrupa ferramentas por tipo
 */
export function groupToolsByType(tools) {
  return tools.reduce((groups, tool) => {
    const type = tool.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(tool);
    return groups;
  }, {});
}

export default {
  TOOL_CATALOG,
  suggestTools,
  groupToolsByType
};
