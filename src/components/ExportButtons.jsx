import React, { useState } from 'react';
import {
  downloadSOAPasTXT,
  downloadSOAPasHTML,
  downloadSOAPasPDF,
  downloadPrescription,
  downloadExamRequest,
  downloadMedicalCertificate
} from '../utils/documentDownload';
import './ExportButtons.css';

const ExportButtons = ({ soapData, patientData, onExportTypeSelect }) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportType, setExportType] = useState(null);

  const handleSOAPExport = (format) => {
    const patientName = patientData?.nome || patientData?.name || 'Paciente';

    switch (format) {
      case 'txt':
        downloadSOAPasTXT(soapData, patientName);
        break;
      case 'html':
        downloadSOAPasHTML(soapData, patientName);
        break;
      case 'pdf':
        downloadSOAPasPDF(soapData);
        break;
      default:
        break;
    }

    setShowExportMenu(false);
  };

  const handleOtherExport = (type) => {
    setExportType(type);
    if (onExportTypeSelect) {
      onExportTypeSelect(type);
    }
  };

  return (
    <div className="export-buttons-container">
      <div className="export-section">
        <h3>Exportar Prontuário SOAP</h3>
        <div className="button-group">
          <button
            className="export-btn btn-txt"
            onClick={() => handleSOAPExport('txt')}
            title="Download como arquivo de texto"
          >
            TXT
          </button>

          <button
            className="export-btn btn-html"
            onClick={() => handleSOAPExport('html')}
            title="Download como HTML (pode abrir no navegador)"
          >
            HTML
          </button>

          <button
            className="export-btn btn-pdf"
            onClick={() => handleSOAPExport('pdf')}
            title="Imprimir/Salvar como PDF"
          >
            PDF
          </button>
        </div>
      </div>

      <div className="export-section">
        <h3>Gerar Outros Documentos</h3>
        <div className="button-group">
          <button
            className="export-btn btn-prescription"
            onClick={() => handleOtherExport('prescription')}
            title="Gerar receita médica"
          >
            Receita
          </button>

          <button
            className="export-btn btn-exam"
            onClick={() => handleOtherExport('exam')}
            title="Gerar pedido de exame"
          >
            Pedido de Exame
          </button>

          <button
            className="export-btn btn-certificate"
            onClick={() => handleOtherExport('certificate')}
            title="Gerar atestado médico"
          >
            Atestado
          </button>
        </div>
      </div>

      <div className="disclaimer">
        <p>
          <strong>Importante:</strong> Todos os documentos gerados são auxiliados por IA
          e baseados em evidências científicas. Sempre revise, assine e valide antes de
          entregar ao paciente. A responsabilidade final é do profissional médico.
        </p>
      </div>
    </div>
  );
};

export default ExportButtons;
