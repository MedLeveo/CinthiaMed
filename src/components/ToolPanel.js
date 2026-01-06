import React, { useState } from 'react';
import './ToolPanel.css';
import InsulinNPHCalculator from './calculators/InsulinNPHCalculator';
import InsulinRegularCalculator from './calculators/InsulinRegularCalculator';
import FlowchartViewer from './FlowchartViewer';

/**
 * Painel lateral que exibe ferramentas clínicas
 */
const ToolPanel = ({ tool, onClose }) => {
  if (!tool) return null;

  const renderToolContent = () => {
    switch (tool.id) {
      case 'insulin-nph':
        return <InsulinNPHCalculator />;

      case 'insulin-regular':
        return <InsulinRegularCalculator />;

      case 'diabetes-tipo2-manejo':
      case 'diabetes-tipo1':
      case 'hipertensao':
        return <FlowchartViewer flowchartId={tool.id} />;

      default:
        return (
          <div className="tool-coming-soon">
            <span
              className="tool-icon-large"
              dangerouslySetInnerHTML={{ __html: tool.icon }}
            />
            <h3>{tool.name}</h3>
            <p>{tool.description}</p>
            <div className="coming-soon-badge">
              Em breve
            </div>
          </div>
        );
    }
  };

  return (
    <div className="tool-panel-overlay">
      <div className="tool-panel">
        <div className="tool-panel-header">
          <div className="tool-panel-title">
            <span
              className="tool-panel-icon"
              dangerouslySetInnerHTML={{ __html: tool.icon }}
            />
            <div>
              <h3>{tool.name}</h3>
              <p>{tool.description}</p>
            </div>
          </div>
          <button
            className="tool-panel-close"
            onClick={onClose}
            type="button"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="tool-panel-content">
          {renderToolContent()}
        </div>
      </div>
    </div>
  );
};

export default ToolPanel;
