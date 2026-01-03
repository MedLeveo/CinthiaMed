/**
 * Utilitário para formatar prontuários em formato SOAP
 * SOAP = Subjetivo, Objetivo, Avaliação, Plano
 */

/**
 * Formata transcrição de consulta em formato SOAP
 * @param {string} transcript - Transcrição da consulta
 * @param {object} patientData - Dados do paciente
 * @returns {Promise<object>} - Prontuário formatado em SOAP
 */
export async function formatToSOAP(transcript, patientData = {}) {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  try {
    const response = await fetch(`${API_URL}/api/format-soap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcript,
        patientData,
      }),
    });

    if (!response.ok) {
      throw new Error('Erro ao formatar em SOAP');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erro ao formatar SOAP:', error);
    throw error;
  }
}

/**
 * Gera SOAP localmente (fallback se API falhar)
 * @param {string} transcript
 * @param {object} patientData
 * @returns {object}
 */
export function generateSOAPLocal(transcript, patientData = {}) {
  const lines = transcript.split('\n').filter(line => line.trim());

  // Tentar identificar seções automaticamente
  const subjetivo = [];
  const objetivo = [];
  const avaliacao = [];
  const plano = [];

  let currentSection = subjetivo;

  // Palavras-chave para identificar seções
  const subjective_keywords = ['queixa', 'sintoma', 'dor', 'paciente relata', 'refere'];
  const objective_keywords = ['exame', 'ausculta', 'pressão', 'temperatura', 'fc', 'fr'];
  const assessment_keywords = ['diagnóstico', 'hipótese', 'cid', 'suspeita'];
  const plan_keywords = ['prescrição', 'conduta', 'retorno', 'solicitar', 'encaminhar'];

  lines.forEach(line => {
    const lowerLine = line.toLowerCase();

    // Detectar mudança de seção
    if (subjective_keywords.some(kw => lowerLine.includes(kw))) {
      currentSection = subjetivo;
    } else if (objective_keywords.some(kw => lowerLine.includes(kw))) {
      currentSection = objetivo;
    } else if (assessment_keywords.some(kw => lowerLine.includes(kw))) {
      currentSection = avaliacao;
    } else if (plan_keywords.some(kw => lowerLine.includes(kw))) {
      currentSection = plano;
    }

    currentSection.push(line);
  });

  return {
    soap: {
      subjetivo: subjetivo.join('\n') || 'Não identificado na transcrição',
      objetivo: objetivo.join('\n') || 'Não identificado na transcrição',
      avaliacao: avaliacao.join('\n') || 'Não identificado na transcrição',
      plano: plano.join('\n') || 'Não identificado na transcrição',
    },
    patientData: {
      nome: patientData.name || 'Não informado',
      idade: patientData.age || 'Não informado',
      sexo: patientData.gender || 'Não informado',
    },
    timestamp: new Date().toLocaleString('pt-BR'),
  };
}

/**
 * Formata SOAP para texto legível
 * @param {object} soapData
 * @returns {string}
 */
export function soapToText(soapData) {
  const { soap, patientData, timestamp } = soapData;

  return `
╔══════════════════════════════════════════════════════════════╗
║                    PRONTUÁRIO MÉDICO - SOAP                  ║
╚══════════════════════════════════════════════════════════════╝

📋 DADOS DO PACIENTE
────────────────────────────────────────────────────────────────
Nome: ${patientData?.nome || 'Não informado'}
Idade: ${patientData?.idade || 'Não informado'}
Sexo: ${patientData?.sexo || 'Não informado'}
Data/Hora: ${timestamp || new Date().toLocaleString('pt-BR')}

════════════════════════════════════════════════════════════════

📝 S - SUBJETIVO (Queixa Principal e História)
────────────────────────────────────────────────────────────────
${soap.subjetivo}

════════════════════════════════════════════════════════════════

🔍 O - OBJETIVO (Exame Físico e Sinais Vitais)
────────────────────────────────────────────────────────────────
${soap.objetivo}

════════════════════════════════════════════════════════════════

💡 A - AVALIAÇÃO (Diagnóstico/Hipótese Diagnóstica)
────────────────────────────────────────────────────────────────
${soap.avaliacao}

════════════════════════════════════════════════════════════════

📌 P - PLANO (Conduta e Tratamento)
────────────────────────────────────────────────────────────────
${soap.plano}

════════════════════════════════════════════════════════════════

🏥 Gerado por CinthiaMed
Prontuário Eletrônico Inteligente
  `.trim();
}

/**
 * Gera HTML formatado do SOAP
 * @param {object} soapData
 * @returns {string}
 */
export function soapToHTML(soapData) {
  const { soap, patientData, timestamp } = soapData;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prontuário SOAP - ${patientData?.nome || 'Paciente'}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      background: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 2rem;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #667eea;
      padding-bottom: 1rem;
      margin-bottom: 2rem;
    }
    .header h1 {
      color: #2d3748;
      margin: 0;
    }
    .patient-info {
      background: #f7fafc;
      padding: 1rem;
      border-radius: 6px;
      margin-bottom: 2rem;
    }
    .patient-info p {
      margin: 0.5rem 0;
      color: #4a5568;
    }
    .soap-section {
      margin-bottom: 2rem;
    }
    .soap-section h2 {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 0.75rem 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
    }
    .soap-section .content {
      padding: 1rem;
      background: #f7fafc;
      border-radius: 6px;
      white-space: pre-wrap;
      line-height: 1.6;
      color: #2d3748;
    }
    .footer {
      text-align: center;
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
      color: #718096;
      font-size: 0.9rem;
    }
    @media print {
      body { background: white; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 Prontuário Médico - SOAP</h1>
    </div>

    <div class="patient-info">
      <p><strong>📋 Paciente:</strong> ${patientData?.nome || 'Não informado'}</p>
      <p><strong>🎂 Idade:</strong> ${patientData?.idade || 'Não informado'}</p>
      <p><strong>⚧ Sexo:</strong> ${patientData?.sexo || 'Não informado'}</p>
      <p><strong>📅 Data/Hora:</strong> ${timestamp || new Date().toLocaleString('pt-BR')}</p>
    </div>

    <div class="soap-section">
      <h2>📝 S - SUBJETIVO</h2>
      <div class="content">${soap.subjetivo}</div>
    </div>

    <div class="soap-section">
      <h2>🔍 O - OBJETIVO</h2>
      <div class="content">${soap.objetivo}</div>
    </div>

    <div class="soap-section">
      <h2>💡 A - AVALIAÇÃO</h2>
      <div class="content">${soap.avaliacao}</div>
    </div>

    <div class="soap-section">
      <h2>📌 P - PLANO</h2>
      <div class="content">${soap.plano}</div>
    </div>

    <div class="footer">
      <p>🤖 Gerado automaticamente por <strong>CinthiaMed</strong></p>
      <p>Prontuário Eletrônico Inteligente com IA</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
