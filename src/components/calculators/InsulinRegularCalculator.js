import React, { useState } from 'react';
import './CalculatorStyles.css';

/**
 * Calculadora de Insulina Regular Humana
 * Doses para controle glicêmico
 */
const InsulinRegularCalculator = () => {
  const [weight, setWeight] = useState('');
  const [currentGlycemia, setCurrentGlycemia] = useState('');
  const [targetGlycemia, setTargetGlycemia] = useState('100');
  const [sensitivity, setSensitivity] = useState('50');
  const [result, setResult] = useState(null);

  const sensitivities = [
    { value: '30', label: 'Alta resistência (30 mg/dL por UI)' },
    { value: '40', label: 'Moderada resistência (40 mg/dL por UI)' },
    { value: '50', label: 'Sensibilidade normal (50 mg/dL por UI)' },
    { value: '60', label: 'Alta sensibilidade (60 mg/dL por UI)' }
  ];

  const calculate = () => {
    const glycemia = parseFloat(currentGlycemia);
    const target = parseFloat(targetGlycemia);
    const sens = parseFloat(sensitivity);
    const w = parseFloat(weight);

    if (!glycemia || !target || !sens || !w) {
      alert('Preencha todos os campos');
      return;
    }

    if (glycemia < target) {
      alert('Glicemia atual está abaixo do alvo. Não administrar insulina de correção.');
      return;
    }

    // Fator de correção: (Glicemia Atual - Glicemia Alvo) / Sensibilidade
    const correctionDose = (glycemia - target) / sens;
    const roundedDose = Math.round(correctionDose * 2) / 2; // Arredondar para 0.5 UI

    setResult({
      correctionDose: roundedDose.toFixed(1),
      glycemiaGap: (glycemia - target).toFixed(0),
      sensitivity: sens,
      interpretation: getInterpretation(roundedDose, glycemia)
    });
  };

  const getInterpretation = (dose, glycemia) => {
    if (dose < 2) return 'Correção mínima necessária';
    if (dose < 5) return 'Correção moderada';
    if (dose < 10) return 'Correção significativa - reavaliar em 2h';
    return 'Correção alta - monitorar de perto';
  };

  const clear = () => {
    setWeight('');
    setCurrentGlycemia('');
    setTargetGlycemia('100');
    setSensitivity('50');
    setResult(null);
  };

  return (
    <div className="calculator-container">
      <div className="calculator-section">
        <label className="calculator-label">
          Peso do Paciente (kg)
        </label>
        <input
          type="number"
          className="calculator-input"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="Ex: 70"
        />
      </div>

      <div className="calculator-section">
        <label className="calculator-label">
          Glicemia Atual (mg/dL)
        </label>
        <input
          type="number"
          className="calculator-input"
          value={currentGlycemia}
          onChange={(e) => setCurrentGlycemia(e.target.value)}
          placeholder="Ex: 250"
        />
      </div>

      <div className="calculator-section">
        <label className="calculator-label">
          Glicemia Alvo (mg/dL)
        </label>
        <input
          type="number"
          className="calculator-input"
          value={targetGlycemia}
          onChange={(e) => setTargetGlycemia(e.target.value)}
        />
      </div>

      <div className="calculator-section">
        <label className="calculator-label">
          Fator de Sensibilidade
        </label>
        <select
          className="calculator-select"
          value={sensitivity}
          onChange={(e) => setSensitivity(e.target.value)}
        >
          {sensitivities.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <p className="calculator-hint">
          Quanto a glicemia reduz por 1 UI de insulina
        </p>
      </div>

      <div className="calculator-actions">
        <button onClick={calculate} className="btn-calculate">
          Calcular Correção
        </button>
        <button onClick={clear} className="btn-clear">
          Limpar
        </button>
      </div>

      {result && (
        <div className="calculator-result">
          <div className="result-header">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#10b981" strokeWidth="2"/>
            </svg>
            <h4>Dose de Correção</h4>
          </div>

          <div className="result-grid">
            <div className="result-item result-primary">
              <span className="result-label">Insulina Regular</span>
              <span className="result-value">{result.correctionDose} UI</span>
              <span className="result-time">💉 Subcutânea</span>
            </div>

            <div className="result-item">
              <span className="result-label">Excesso Glicêmico</span>
              <span className="result-value">{result.glycemiaGap} mg/dL</span>
            </div>

            <div className="result-item">
              <span className="result-label">Interpretação</span>
              <span className="result-value" style={{ fontSize: '1rem' }}>
                {result.interpretation}
              </span>
            </div>
          </div>

          <div className="result-info">
            <strong>⚠️ Orientações:</strong>
            <ul>
              <li>Reavaliar glicemia após 2-4 horas</li>
              <li>Pico de ação: 2-3 horas</li>
              <li>Duração: 5-7 horas</li>
              <li>Administrar 30-45 min antes das refeições</li>
            </ul>
          </div>

          <div className="result-source">
            📚 Baseado em: Fórmula de Correção Glicêmica (Regra 1500/1800)<br/>
            Sociedade Brasileira de Diabetes (2024)
          </div>
        </div>
      )}
    </div>
  );
};

export default InsulinRegularCalculator;
