import React, { useState, useEffect } from 'react';
import { directCalculators, scoringTools, validateValue } from '../utils/clinicalScores';
import { complexScores } from '../utils/complexScores';

/**
 * Componente universal para cálculo de escores clínicos
 * Suporta: calculadoras diretas, checklists, escores step-by-step
 */
const ScoreCalculator = ({ scoreName, onBack }) => {
  const [inputs, setInputs] = useState({});
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Carregar histórico do localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('scoreHistory');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed);
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      }
    }
  }, []);

  // Salvar no histórico
  const saveToHistory = (calculationResult) => {
    const historyItem = {
      id: Date.now(),
      scoreName,
      inputs: { ...inputs },
      result: calculationResult,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleString('pt-BR')
    };

    const updatedHistory = [historyItem, ...history].slice(0, 50); // Máximo 50 itens
    setHistory(updatedHistory);
    localStorage.setItem('scoreHistory', JSON.stringify(updatedHistory));
  };

  // Carregar cálculo do histórico
  const loadFromHistory = (historyItem) => {
    setInputs(historyItem.inputs);
    setResult(historyItem.result);
    setCurrentStep(0);
    setShowHistory(false);
  };

  // Excluir item do histórico
  const deleteHistoryItem = (id) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('scoreHistory', JSON.stringify(updatedHistory));
  };

  // Exportar para PDF (texto formatado)
  const exportToPDF = () => {
    if (!result) return;

    const content = generatePDFContent();

    // Criar elemento temporário para download
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${scoreName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Gerar conteúdo do relatório
  const generatePDFContent = () => {
    const lines = [];
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push(`           CINTHIAMED - RELATÓRIO DE ESCORE CLÍNICO`);
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('');
    lines.push(`Escore: ${scoreName}`);
    lines.push(`Data: ${new Date().toLocaleString('pt-BR')}`);
    lines.push('');
    lines.push('───────────────────────────────────────────────────────────');
    lines.push('DADOS INSERIDOS:');
    lines.push('───────────────────────────────────────────────────────────');

    // Listar inputs
    Object.entries(inputs).forEach(([key, value]) => {
      lines.push(`  • ${key}: ${value}`);
    });

    lines.push('');
    lines.push('───────────────────────────────────────────────────────────');
    lines.push('RESULTADO:');
    lines.push('───────────────────────────────────────────────────────────');

    if (result.value) {
      lines.push(`  Valor: ${result.value} ${result.unit || ''}`);
    }
    if (result.score !== undefined) {
      lines.push(`  Pontuação: ${result.score} pontos`);
    }
    if (result.interpretation) {
      lines.push(`  Interpretação: ${result.interpretation}`);
    }
    if (result.severity) {
      lines.push(`  Gravidade: ${result.severity}`);
    }
    if (result.risk) {
      lines.push(`  Risco: ${result.risk}`);
    }
    if (result.mortality) {
      lines.push(`  Mortalidade: ${result.mortality}`);
    }
    if (result.classe) {
      lines.push(`  Classificação: ${result.classe}`);
    }

    lines.push('');
    lines.push('───────────────────────────────────────────────────────────');
    lines.push('RECOMENDAÇÃO CLÍNICA:');
    lines.push('───────────────────────────────────────────────────────────');
    if (result.description) {
      lines.push(result.description);
      lines.push('');
    }
    if (result.recommendation) {
      lines.push(result.recommendation);
    }

    lines.push('');
    lines.push('───────────────────────────────────────────────────────────');
    lines.push('REFERÊNCIA CIENTÍFICA:');
    lines.push('───────────────────────────────────────────────────────────');
    if (result.reference) {
      lines.push(result.reference);
    }

    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('⚠️  AVISO MÉDICO-LEGAL');
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('Este cálculo é uma ferramenta auxiliar para decisão clínica');
    lines.push('e NÃO substitui o julgamento médico profissional. Sempre');
    lines.push('considere o quadro clínico completo do paciente.');
    lines.push('');
    lines.push('Gerado por: CinthiaMed IA');
    lines.push(`Data de geração: ${new Date().toLocaleString('pt-BR')}`);
    lines.push('═══════════════════════════════════════════════════════════');

    return lines.join('\n');
  };

  // Determinar qual tipo de escore é
  const scoreData = directCalculators[scoreName] || scoringTools[scoreName] || complexScores[scoreName];

  if (!scoreData) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
        <p>Escore "{scoreName}" não implementado ainda.</p>
        <button onClick={onBack} style={{
          marginTop: '16px',
          padding: '10px 20px',
          backgroundColor: '#8b5cf6',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer'
        }}>
          Voltar
        </button>
      </div>
    );
  }

  // Renderizar campo de input numérico
  const renderNumericInput = (field) => (
    <div key={field.name} style={{ marginBottom: '20px' }}>
      <label style={{
        display: 'block',
        marginBottom: '8px',
        fontSize: '14px',
        fontWeight: '500',
        color: '#e2e8f0'
      }}>
        {field.label} {field.unit && <span style={{ color: '#64748b' }}>({field.unit})</span>}
      </label>
      <input
        type="number"
        value={inputs[field.name] || ''}
        onChange={(e) => {
          const value = parseFloat(e.target.value);
          setInputs({ ...inputs, [field.name]: value });

          // Validar
          if (!isNaN(value)) {
            const error = validateValue(value, field.min, field.max, field.label);
            setErrors({ ...errors, [field.name]: error });
          }
        }}
        step="0.1"
        placeholder={`${field.min} - ${field.max}`}
        style={{
          width: '100%',
          padding: '12px 16px',
          backgroundColor: '#0f172a',
          border: `1px solid ${errors[field.name] ? '#ef4444' : '#2a3142'}`,
          borderRadius: '10px',
          color: '#e2e8f0',
          fontSize: '15px',
          fontFamily: "'Outfit', sans-serif"
        }}
      />
      {errors[field.name] && (
        <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px' }}>
          {errors[field.name]}
        </p>
      )}
    </div>
  );

  // Renderizar campo de seleção
  const renderSelectInput = (field) => (
    <div key={field.name} style={{ marginBottom: '20px' }}>
      <label style={{
        display: 'block',
        marginBottom: '8px',
        fontSize: '14px',
        fontWeight: '500',
        color: '#e2e8f0'
      }}>
        {field.label}
      </label>
      <select
        value={inputs[field.name] || ''}
        onChange={(e) => setInputs({ ...inputs, [field.name]: e.target.value })}
        style={{
          width: '100%',
          padding: '12px 16px',
          backgroundColor: '#0f172a',
          border: '1px solid #2a3142',
          borderRadius: '10px',
          color: '#e2e8f0',
          fontSize: '15px',
          fontFamily: "'Outfit', sans-serif"
        }}
      >
        <option value="">Selecione...</option>
        {field.options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );

  // Renderizar checkbox para escores de pontuação
  const renderChecklistItem = (item) => (
    <label key={item.id} style={{
      display: 'flex',
      alignItems: 'flex-start',
      padding: '12px 16px',
      backgroundColor: inputs[item.id] ? 'rgba(139, 92, 246, 0.1)' : '#0f172a',
      border: `1px solid ${inputs[item.id] ? '#8b5cf6' : '#2a3142'}`,
      borderRadius: '10px',
      marginBottom: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }}>
      <input
        type="checkbox"
        checked={inputs[item.id] || false}
        onChange={(e) => setInputs({ ...inputs, [item.id]: e.target.checked })}
        style={{ marginRight: '12px', marginTop: '4px', cursor: 'pointer' }}
      />
      <div style={{ flex: 1 }}>
        <span style={{ color: '#e2e8f0', fontSize: '14px' }}>{item.label}</span>
        <span style={{
          color: '#8b5cf6',
          fontSize: '13px',
          fontWeight: '600',
          marginLeft: '8px'
        }}>
          +{item.points} pt{item.points > 1 ? 's' : ''}
        </span>
      </div>
    </label>
  );

  // Renderizar seção step-by-step
  const renderStepByStepSection = (section, index) => {
    const isCurrentSection = index === currentStep;

    if (!isCurrentSection) return null;

    return (
      <div key={index} style={{ marginBottom: '24px' }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#8b5cf6',
          marginBottom: '8px'
        }}>
          {section.name}
        </h3>
        {section.info && (
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
            {section.info}
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {section.options.map(option => (
            <label key={option.points} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              backgroundColor: inputs[`section_${index}`] === option.points ? 'rgba(139, 92, 246, 0.1)' : '#0f172a',
              border: `1px solid ${inputs[`section_${index}`] === option.points ? '#8b5cf6' : '#2a3142'}`,
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <input
                type="radio"
                name={`section_${index}`}
                checked={inputs[`section_${index}`] === option.points}
                onChange={() => setInputs({ ...inputs, [`section_${index}`]: option.points })}
                style={{ marginRight: '12px', cursor: 'pointer' }}
              />
              <span style={{ flex: 1, color: '#e2e8f0', fontSize: '14px' }}>
                {option.label}
              </span>
              <span style={{ color: '#8b5cf6', fontSize: '13px', fontWeight: '600' }}>
                {option.points} pt{option.points !== 1 ? 's' : ''}
              </span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  // Calcular resultado baseado no tipo
  const calculateResult = () => {
    try {
      if (scoreData.type === 'direct') {
        // Validar todos os campos preenchidos
        const allFieldsFilled = scoreData.fields.every(field => inputs[field.name] !== undefined && inputs[field.name] !== '');
        if (!allFieldsFilled) {
          alert('Por favor, preencha todos os campos.');
          return;
        }

        // Validar erros
        const hasErrors = Object.values(errors).some(e => e !== null);
        if (hasErrors) {
          alert('Corrija os erros antes de calcular.');
          return;
        }

        const calculatedResult = scoreData.calculate(inputs);
        setResult(calculatedResult);
        saveToHistory(calculatedResult);
      } else if (scoreData.type === 'checklist' || scoreData.type === 'mixed') {
        // Somar pontos dos itens selecionados
        let totalScore = 0;
        scoreData.items.forEach(item => {
          if (inputs[item.id]) totalScore += item.points;
        });

        const interpretation = scoreData.interpret(totalScore);
        setResult(interpretation);
        saveToHistory(interpretation);
      } else if (scoreData.type === 'stepbystep' || scoreData.type === 'sections') {
        // Somar pontos de todas as seções
        let totalScore = 0;
        scoreData.sections.forEach((section, index) => {
          const points = inputs[`section_${index}`];
          if (points !== undefined) totalScore += points;
        });

        const interpretation = scoreData.interpret(totalScore);
        setResult(interpretation);
        saveToHistory(interpretation);
      }
    } catch (error) {
      console.error('Erro ao calcular:', error);
      alert('Erro ao calcular o escore. Verifique os dados inseridos.');
    }
  };

  // Renderizar formulário baseado no tipo
  const renderForm = () => {
    if (scoreData.type === 'direct') {
      return (
        <div>
          {scoreData.fields.map(field =>
            field.type === 'select' ? renderSelectInput(field) : renderNumericInput(field)
          )}
          <button
            onClick={calculateResult}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginTop: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8b5cf6'}
          >
            Calcular
          </button>
        </div>
      );
    }

    if (scoreData.type === 'checklist' || scoreData.type === 'mixed') {
      const selectedCount = Object.values(inputs).filter(v => v === true).length;
      const totalPoints = scoreData.items.reduce((sum, item) =>
        inputs[item.id] ? sum + item.points : sum, 0
      );

      return (
        <div>
          <div style={{
            padding: '16px',
            backgroundColor: '#0f172a',
            borderRadius: '10px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>
              {selectedCount} item{selectedCount !== 1 ? 's' : ''} selecionado{selectedCount !== 1 ? 's' : ''}
            </span>
            <span style={{ color: '#8b5cf6', fontSize: '18px', fontWeight: '600' }}>
              {totalPoints} pontos
            </span>
          </div>
          {scoreData.items.map(renderChecklistItem)}
          <button
            onClick={calculateResult}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginTop: '8px'
            }}
          >
            Interpretar
          </button>
        </div>
      );
    }

    if (scoreData.type === 'stepbystep' || scoreData.type === 'sections') {
      const totalSections = scoreData.sections.length;
      const progress = ((currentStep + 1) / totalSections) * 100;

      return (
        <div>
          {/* Progress bar */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                Etapa {currentStep + 1} de {totalSections}
              </span>
              <span style={{ color: '#8b5cf6', fontSize: '13px', fontWeight: '600' }}>
                {progress.toFixed(0)}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '6px',
              backgroundColor: '#1e293b',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: '#8b5cf6',
                transition: 'width 0.3s'
              }} />
            </div>
          </div>

          {/* Renderizar seção atual */}
          {scoreData.sections.map((section, index) =>
            renderStepByStepSection(section, index)
          )}

          {/* Botões de navegação */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#1e293b',
                  color: '#94a3b8',
                  border: '1px solid #2a3142',
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}
              >
                Anterior
              </button>
            )}
            {currentStep < totalSections - 1 ? (
              <button
                onClick={() => {
                  if (inputs[`section_${currentStep}`] === undefined) {
                    alert('Selecione uma opção antes de continuar.');
                    return;
                  }
                  setCurrentStep(currentStep + 1);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Próximo
              </button>
            ) : (
              <button
                onClick={calculateResult}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Calcular Resultado
              </button>
            )}
          </div>
        </div>
      );
    }
  };

  // Renderizar resultado
  const renderResult = () => {
    if (!result) return null;

    return (
      <div style={{
        backgroundColor: '#0f172a',
        border: '2px solid #8b5cf6',
        borderRadius: '16px',
        padding: '24px',
        marginTop: '24px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
          </svg>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#e2e8f0',
            margin: 0
          }}>
            Resultado
          </h3>
        </div>

        {/* Valor/Score */}
        {result.value && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>Valor</p>
            <p style={{ color: '#e2e8f0', fontSize: '24px', fontWeight: '600', margin: 0 }}>
              {result.value} {result.unit || ''}
            </p>
          </div>
        )}

        {result.score !== undefined && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>Pontuação</p>
            <p style={{ color: '#e2e8f0', fontSize: '32px', fontWeight: '700', margin: 0 }}>
              {result.score} pontos
            </p>
          </div>
        )}

        {/* Interpretação */}
        {result.interpretation && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderRadius: '10px',
            marginBottom: '16px'
          }}>
            <p style={{ color: '#a78bfa', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>
              Interpretação
            </p>
            <p style={{ color: '#e2e8f0', fontSize: '15px', margin: 0 }}>
              {result.interpretation}
            </p>
          </div>
        )}

        {/* Descrição */}
        {result.description && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>
              {result.description}
            </p>
          </div>
        )}

        {/* Recomendação */}
        {result.recommendation && (
          <div style={{
            padding: '16px',
            backgroundColor: '#1e293b',
            borderLeft: '4px solid #10b981',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <p style={{ color: '#10b981', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Recomendação Clínica
            </p>
            <p style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              {result.recommendation}
            </p>
          </div>
        )}

        {/* Dados adicionais */}
        {result.risk && (
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Risco: </span>
            <span style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: '600' }}>{result.risk}</span>
          </div>
        )}
        {result.probability && (
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Probabilidade: </span>
            <span style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: '600' }}>{result.probability}</span>
          </div>
        )}
        {result.mortality && (
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Mortalidade: </span>
            <span style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: '600' }}>{result.mortality}</span>
          </div>
        )}

        {/* Referência */}
        {result.reference && (
          <div style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid #2a3142'
          }}>
            <p style={{ color: '#64748b', fontSize: '12px', fontStyle: 'italic' }}>
              📚 Referência: {result.reference}
            </p>
          </div>
        )}

        {/* Botões de ação */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button
            onClick={exportToPDF}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            Exportar
          </button>
          <button
            onClick={() => {
              setResult(null);
              setInputs({});
              setCurrentStep(0);
            }}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#1e293b',
              color: '#94a3b8',
              border: '1px solid #2a3142',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Novo Cálculo
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Header Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        {/* Back Button */}
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: 'transparent',
            border: '1px solid #2a3142',
            borderRadius: '10px',
            color: '#94a3b8',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: "'Outfit', sans-serif",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#8b5cf6';
            e.currentTarget.style.color = '#8b5cf6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#2a3142';
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Voltar
        </button>

        {/* History Button */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: showHistory ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
            border: `1px solid ${showHistory ? '#8b5cf6' : '#2a3142'}`,
            borderRadius: '10px',
            color: showHistory ? '#8b5cf6' : '#94a3b8',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: "'Outfit', sans-serif",
          }}
          onMouseEnter={(e) => {
            if (!showHistory) {
              e.currentTarget.style.borderColor = '#8b5cf6';
              e.currentTarget.style.color = '#8b5cf6';
            }
          }}
          onMouseLeave={(e) => {
            if (!showHistory) {
              e.currentTarget.style.borderColor = '#2a3142';
              e.currentTarget.style.color = '#94a3b8';
            }
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Histórico ({history.filter(h => h.scoreName === scoreName).length})
        </button>
      </div>

      {/* Score Title */}
      <h2 style={{
        fontSize: '28px',
        fontWeight: '600',
        color: '#e2e8f0',
        marginBottom: '32px',
      }}>
        {scoreName}
      </h2>

      {/* History Panel */}
      {showHistory && (
        <div style={{
          backgroundColor: '#1a1f2e',
          border: '1px solid #2a3142',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '24px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#e2e8f0',
              margin: 0,
            }}>
              📋 Histórico de Cálculos - {scoreName}
            </h3>
            {history.filter(h => h.scoreName === scoreName).length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Deseja excluir todo o histórico deste escore?')) {
                    const updatedHistory = history.filter(h => h.scoreName !== scoreName);
                    setHistory(updatedHistory);
                    localStorage.setItem('scoreHistory', JSON.stringify(updatedHistory));
                  }
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'transparent',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Limpar Histórico
              </button>
            )}
          </div>

          {history.filter(h => h.scoreName === scoreName).length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#64748b',
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 16px' }}>
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p style={{ margin: 0, fontSize: '15px' }}>Nenhum cálculo realizado ainda</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>Os cálculos que você fizer serão salvos aqui automaticamente</p>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxHeight: '400px',
              overflowY: 'auto',
            }}>
              {history
                .filter(h => h.scoreName === scoreName)
                .map((item) => (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #2a3142',
                      borderRadius: '12px',
                      padding: '16px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#8b5cf6';
                      e.currentTarget.style.backgroundColor = '#1a1f2e';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#2a3142';
                      e.currentTarget.style.backgroundColor = '#0f172a';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '12px',
                    }}>
                      <div>
                        <p style={{
                          margin: 0,
                          fontSize: '14px',
                          color: '#94a3b8',
                        }}>
                          {item.date}
                        </p>
                        <p style={{
                          margin: '4px 0 0 0',
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#e2e8f0',
                        }}>
                          Resultado: {item.result.score !== undefined ? `${item.result.score} pontos` : item.result.value}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => loadFromHistory(item)}
                          style={{
                            padding: '8px 14px',
                            backgroundColor: '#8b5cf6',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#7c3aed';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#8b5cf6';
                          }}
                        >
                          Carregar
                        </button>
                        <button
                          onClick={() => deleteHistoryItem(item.id)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: 'transparent',
                            border: '1px solid #ef4444',
                            borderRadius: '8px',
                            color: '#ef4444',
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>

                    {/* Preview of inputs */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      marginTop: '8px',
                    }}>
                      {Object.entries(item.inputs).slice(0, 3).map(([key, value]) => (
                        <span
                          key={key}
                          style={{
                            padding: '4px 10px',
                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: '#a78bfa',
                          }}
                        >
                          {key}: {typeof value === 'number' ? value.toFixed(1) : value}
                        </span>
                      ))}
                      {Object.keys(item.inputs).length > 3 && (
                        <span style={{
                          padding: '4px 10px',
                          fontSize: '12px',
                          color: '#64748b',
                        }}>
                          +{Object.keys(item.inputs).length - 3} mais
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Score Form */}
      <div style={{
        backgroundColor: '#1a1f2e',
        border: '1px solid #2a3142',
        borderRadius: '20px',
        padding: '32px',
      }}>
        {renderForm()}
      </div>

      {/* Result */}
      {renderResult()}
    </div>
  );
};

export default ScoreCalculator;
