import React from 'react';
import './FlowchartViewer.css';

/**
 * Visualizador de Fluxogramas Clínicos
 */
const FlowchartViewer = ({ flowchartId }) => {
  // Mapeamento de fluxogramas
  const flowcharts = {
    'diabetes-tipo2-manejo': {
      title: 'Diabetes Mellitus Tipo 2 - Manejo da Insulinoterapia',
      source: 'Ministério da Saúde (2024)',
      imageUrl: '/flowcharts/dm2-insulinoterapia.png', // Será adicionada
      description: 'Algoritmo para início e ajuste de insulina no DM2'
    },
    'diabetes-tipo1': {
      title: 'Diabetes Mellitus Tipo 1 - Diagnóstico e Ajuste',
      source: 'Ministério da Saúde (2019)',
      imageUrl: '/flowcharts/dm1-diagnostico.png',
      description: 'Fluxo de diagnóstico e ajuste de doses'
    },
    'hipertensao': {
      title: 'Hipertensão Arterial Sistêmica',
      source: 'Diretriz Brasileira de Hipertensão',
      imageUrl: '/flowcharts/hipertensao-manejo.png',
      description: 'Algoritmo de tratamento da HAS'
    }
  };

  const chart = flowcharts[flowchartId];

  if (!chart) {
    return (
      <div className="flowchart-not-found">
        <p>Fluxograma não encontrado</p>
      </div>
    );
  }

  return (
    <div className="flowchart-viewer">
      <div className="flowchart-info">
        <h4>{chart.title}</h4>
        <p>{chart.description}</p>
        <span className="flowchart-source">📚 {chart.source}</span>
      </div>

      <div className="flowchart-placeholder">
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
          <rect x="10" y="10" width="80" height="20" rx="4" fill="#8b5cf6" opacity="0.3"/>
          <rect x="10" y="40" width="80" height="20" rx="4" fill="#3b82f6" opacity="0.3"/>
          <rect x="10" y="70" width="80" height="20" rx="4" fill="#10b981" opacity="0.3"/>
          <path d="M50 30 L50 40" stroke="#94a3b8" strokeWidth="2"/>
          <path d="M50 60 L50 70" stroke="#94a3b8" strokeWidth="2"/>
        </svg>
        <p>Fluxograma ilustrativo</p>
        <small>As imagens de fluxogramas serão adicionadas em breve</small>
      </div>

      <div className="flowchart-actions">
        <button className="btn-download" disabled>
          📥 Baixar PDF (em breve)
        </button>
        <button className="btn-print" disabled>
          🖨️ Imprimir (em breve)
        </button>
      </div>

      <div className="flowchart-reference">
        <strong>Como usar este fluxograma:</strong>
        <ol>
          <li>Identifique a situação clínica do paciente</li>
          <li>Siga as setas de decisão de acordo com os critérios</li>
          <li>Aplique a conduta recomendada</li>
          <li>Reavalie periodicamente conforme indicado</li>
        </ol>
      </div>
    </div>
  );
};

export default FlowchartViewer;
