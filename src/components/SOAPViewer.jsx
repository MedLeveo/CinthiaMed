import React from 'react';
import ExportButtons from './ExportButtons';
import './SOAPViewer.css';

const SOAPViewer = ({ soapData, patientData, onExportTypeSelect }) => {
  if (!soapData || !soapData.soap) {
    return (
      <div className="soap-viewer-empty">
        <p>Nenhum prontuário SOAP disponível.</p>
      </div>
    );
  }

  const { soap } = soapData;

  return (
    <div className="soap-viewer">
      <div className="soap-header">
        <h2>Prontuário SOAP</h2>
        <div className="soap-patient-info">
          <p><strong>Paciente:</strong> {patientData?.nome || patientData?.name || 'Não informado'}</p>
          <p><strong>Idade:</strong> {patientData?.idade || patientData?.age || 'Não informado'}</p>
          <p><strong>Sexo:</strong> {patientData?.sexo || patientData?.gender || 'Não informado'}</p>
          <p><strong>Data:</strong> {soapData.timestamp || new Date().toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <div className="soap-content">
        <div className="soap-section subjetivo">
          <div className="soap-section-header">
            <h3>S - SUBJETIVO</h3>
            <span className="soap-badge">Queixa Principal e História</span>
          </div>
          <div className="soap-section-content">
            {soap.subjetivo || 'Não identificado na transcrição'}
          </div>
        </div>

        <div className="soap-section objetivo">
          <div className="soap-section-header">
            <h3>O - OBJETIVO</h3>
            <span className="soap-badge">Exame Físico e Sinais Vitais</span>
          </div>
          <div className="soap-section-content">
            {soap.objetivo || 'Não identificado na transcrição'}
          </div>
        </div>

        <div className="soap-section avaliacao">
          <div className="soap-section-header">
            <h3>A - AVALIAÇÃO</h3>
            <span className="soap-badge">Diagnóstico / Hipótese Diagnóstica</span>
          </div>
          <div className="soap-section-content">
            {soap.avaliacao || 'Não identificado na transcrição'}
          </div>
        </div>

        <div className="soap-section plano">
          <div className="soap-section-header">
            <h3>P - PLANO</h3>
            <span className="soap-badge">Conduta e Tratamento</span>
          </div>
          <div className="soap-section-content">
            {soap.plano || 'Não identificado na transcrição'}
          </div>
        </div>
      </div>

      <ExportButtons
        soapData={soapData}
        patientData={patientData}
        onExportTypeSelect={onExportTypeSelect}
      />

      <div className="soap-footer">
        <p className="ai-disclaimer">
          Este prontuário foi estruturado automaticamente com auxílio de Inteligência Artificial
          baseada em evidências científicas. Sempre revise e valide as informações antes de finalizar.
        </p>
      </div>
    </div>
  );
};

export default SOAPViewer;
