import React, { useState } from 'react';
import './CalculatorStyles.css';

/**
 * Calculadora de Insulina NPH
 * Baseada em protocolos do Ministério da Saúde
 */
const InsulinNPHCalculator = () => {
  const [weight, setWeight] = useState('');
  const [clinicalSituation, setClinicalSituation] = useState('basal');
  const [result, setResult] = useState(null);

  const situations = [
    {
      value: 'basal',
      label: 'Basal (dose inicial)',
      dose: 0.15,
      description: 'Para início de tratamento'
    },
    {
      value: 'resistencia',
      label: 'Resistência insulínica',
      dose: 0.25,
      description: 'Pacientes com resistência'
    },
    {
      value: 'ajuste',
      label: 'Ajuste de dose',
      dose: 0.2,
      description: 'Controle inadequado'
    },
    {
      value: 'conservador',
      label: 'Conservador (idosos)',
      dose: 0.1,
      description: 'Reduzir risco de hipoglicemia'
    }
  ];

  const calculate = () => {
    const w = parseFloat(weight);
    if (!w || w <= 0) {
      alert('Por favor, insira um peso válido');
      return;
    }

    const situation = situations.find(s => s.value === clinicalSituation);
    const totalDose = w * situation.dose;
    const morningDose = totalDose * 0.67; // 2/3 pela manhã
    const nightDose = totalDose * 0.33;   // 1/3 à noite

    setResult({
      totalDose: totalDose.toFixed(1),
      morningDose: morningDose.toFixed(1),
      nightDose: nightDose.toFixed(1),
      situation: situation
    });
  };

  const clear = () => {
    setWeight('');
    setClinicalSituation('basal');
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
          min="1"
          max="300"
        />
      </div>

      <div className="calculator-section">
        <label className="calculator-label">
          Situação Clínica
        </label>
        <select
          className="calculator-select"
          value={clinicalSituation}
          onChange={(e) => setClinicalSituation(e.target.value)}
        >
          {situations.map(s => (
            <option key={s.value} value={s.value}>
              {s.label} ({s.dose} UI/kg/dia)
            </option>
          ))}
        </select>
        <p className="calculator-hint">
          {situations.find(s => s.value === clinicalSituation)?.description}
        </p>
      </div>

      <div className="calculator-actions">
        <button onClick={calculate} className="btn-calculate">
          Calcular Dose
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
            <h4>Resultado do Cálculo</h4>
          </div>

          <div className="result-grid">
            <div className="result-item result-primary">
              <span className="result-label">Dose Total Diária</span>
              <span className="result-value">{result.totalDose} UI</span>
            </div>

            <div className="result-item">
              <span className="result-label">Dose Matinal (2/3)</span>
              <span className="result-value">{result.morningDose} UI</span>
              <span className="result-time">☀️ Antes do café</span>
            </div>

            <div className="result-item">
              <span className="result-label">Dose Noturna (1/3)</span>
              <span className="result-value">{result.nightDose} UI</span>
              <span className="result-time">🌙 Antes de dormir</span>
            </div>
          </div>

          <div className="result-info">
            <strong>⚠️ Atenção:</strong>
            <ul>
              <li>Ajustar doses conforme glicemias capilares</li>
              <li>Monitorar sinais de hipoglicemia</li>
              <li>Reavaliar doses a cada 3-7 dias</li>
            </ul>
          </div>

          <div className="result-source">
            📚 Baseado em: Protocolo Clínico e Diretrizes Terapêuticas - Diabetes Mellitus Tipo 2<br/>
            Ministério da Saúde (2024)
          </div>
        </div>
      )}
    </div>
  );
};

export default InsulinNPHCalculator;
