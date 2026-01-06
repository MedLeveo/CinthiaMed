import React from 'react';
import './ToolSuggestions.css';

/**
 * Componente que exibe sugestões de ferramentas clínicas
 * abaixo das respostas do chat
 */
const ToolSuggestions = ({ tools, onToolSelect }) => {
  if (!tools || tools.length === 0) {
    return null;
  }

  const getTypeLabel = (type) => {
    const labels = {
      calculator: 'Calculadora',
      flowchart: 'Fluxograma',
      score: 'Escore Clínico'
    };
    return labels[type] || type;
  };

  return (
    <div className="tool-suggestions">
      <div className="tool-suggestions-header">
        <h4>Recursos recomendados</h4>
      </div>

      <div className="tool-cards-container">
        {tools.map((tool) => (
          <button
            key={tool.id}
            className="tool-card"
            onClick={() => onToolSelect(tool)}
          >
            <span
              className="tool-icon"
              dangerouslySetInnerHTML={{ __html: tool.icon }}
            />

            <div className="tool-card-content">
              <div className="tool-card-main">
                <h5 className="tool-name">
                  {tool.name}
                </h5>
                <span className="tool-type-badge">
                  {getTypeLabel(tool.type).toUpperCase()}
                </span>
              </div>
              <p className="tool-description">
                {tool.description}
              </p>
            </div>

            <svg className="tool-arrow" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7 14L11 10L7 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ToolSuggestions;
