import React, { useState } from 'react';
import './ExamReader.css';

const ExamReader = ({ onAnalysisComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Verificar se é imagem
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione uma imagem (JPG, PNG, etc.)');
      return;
    }

    // Verificar tamanho (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Imagem muito grande! Máximo: 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const analyzeExam = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Usar o preview que já está em base64
      const base64Image = preview;

      const apiUrl = process.env.REACT_APP_API_URL || window.location.origin;

      const response = await fetch(`${apiUrl}/api/analyze-exam`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao analisar exame');
      }

      const result = await response.json();
      setAnalysis(result);

      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err) {
      console.error('Erro na análise:', err);
      setError(err.message || 'Erro ao analisar exame. Verifique sua conexão.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setPreview(null);
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="exam-reader">
      <div className="exam-reader-header">
        <h2>Leitor de Exames</h2>
        <p>Envie uma foto do exame para análise automática</p>
      </div>

      {!preview ? (
        <div className="upload-area">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            id="exam-upload"
            style={{ display: 'none' }}
          />
          <label htmlFor="exam-upload" className="upload-button">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Clique para selecionar imagem</span>
            <small>ou arraste aqui (JPG, PNG - máx 10MB)</small>
          </label>
        </div>
      ) : (
        <div className="exam-preview-container">
          <div className="exam-preview">
            <img src={preview} alt="Preview do exame" />
            <button className="remove-image" onClick={resetUpload} title="Remover imagem">
              ✕
            </button>
          </div>

          {!analysis && (
            <button
              className="analyze-button"
              onClick={analyzeExam}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <span className="spinner"></span>
                  Analisando exame...
                </>
              ) : (
                <>
                  Analisar Exame
                </>
              )}
            </button>
          )}

          {analysis && (
            <div className="analysis-result">
              <div className="result-header">
                <h3>Análise Concluída</h3>
                <button className="btn-secondary" onClick={resetUpload}>
                  Analisar Outro Exame
                </button>
              </div>

              <div className="result-content">
                <div className="result-section">
                  <h4>Tipo de Exame</h4>
                  <p>{analysis.examType || 'Não identificado'}</p>
                </div>

                {analysis.findings && analysis.findings.length > 0 && (
                  <div className="result-section">
                    <h4>Achados Principais</h4>
                    <ul>
                      {analysis.findings.map((finding, index) => (
                        <li key={index}>
                          <span className={`finding-badge ${finding.severity || 'normal'}`}>
                            {finding.severity === 'abnormal' ? '!' : '✓'}
                          </span>
                          <strong>{finding.parameter}:</strong> {finding.value}
                          {finding.reference && <small> (Referência: {finding.reference})</small>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.summary && (
                  <div className="result-section">
                    <h4>Resumo</h4>
                    <p>{analysis.summary}</p>
                  </div>
                )}

                {analysis.recommendations && (
                  <div className="result-section">
                    <h4>Recomendações</h4>
                    <p>{analysis.recommendations}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};

export default ExamReader;
