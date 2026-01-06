/**
 * Utilitários para download de documentos médicos
 */

import { soapToText, soapToHTML } from './soapFormatter';

/**
 * Faz download de texto como arquivo
 * @param {string} content - Conteúdo do arquivo
 * @param {string} filename - Nome do arquivo
 * @param {string} mimeType - Tipo MIME
 */
function downloadFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download de prontuário SOAP em formato TXT
 * @param {object} soapData - Dados do SOAP
 * @param {string} patientName - Nome do paciente
 */
export function downloadSOAPasTXT(soapData, patientName = 'Paciente') {
  const text = soapToText(soapData);
  const filename = `Prontuario_${patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
  downloadFile(text, filename, 'text/plain;charset=utf-8');
}

/**
 * Download de prontuário SOAP em formato HTML
 * @param {object} soapData - Dados do SOAP
 * @param {string} patientName - Nome do paciente
 */
export function downloadSOAPasHTML(soapData, patientName = 'Paciente') {
  const html = soapToHTML(soapData);
  const filename = `Prontuario_${patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
  downloadFile(html, filename, 'text/html;charset=utf-8');
}

/**
 * Download de prontuário SOAP em formato PDF (via impressão)
 * @param {object} soapData - Dados do SOAP
 */
export function downloadSOAPasPDF(soapData) {
  const html = soapToHTML(soapData);
  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();

  // Aguardar carregamento e abrir diálogo de impressão
  printWindow.onload = () => {
    printWindow.print();
  };
}

/**
 * Gera receita médica em formato texto
 * @param {object} prescriptionData
 * @returns {string}
 */
export function generatePrescription(prescriptionData) {
  const {
    patientName,
    patientAge,
    date,
    medications,
    doctorName,
    doctorCRM,
    observations
  } = prescriptionData;

  return `
╔══════════════════════════════════════════════════════════════╗
║                        RECEITA MÉDICA                        ║
╚══════════════════════════════════════════════════════════════╝

Data: ${date || new Date().toLocaleDateString('pt-BR')}

PACIENTE: ${patientName || '___________________________________'}
IDADE: ${patientAge || '____'}

────────────────────────────────────────────────────────────────
PRESCRIÇÃO:
────────────────────────────────────────────────────────────────

${medications?.map((med, index) => `
${index + 1}) ${med.name || '________________________________'}
   Posologia: ${med.dosage || '____________________________'}
   Duração: ${med.duration || '____________________________'}
   Via: ${med.route || 'Oral'}
`).join('\n') || 'Nenhuma medicação prescrita'}

────────────────────────────────────────────────────────────────
OBSERVAÇÕES:
────────────────────────────────────────────────────────────────
${observations || 'Nenhuma observação adicional.'}

────────────────────────────────────────────────────────────────

Dr(a). ${doctorName || '___________________________________'}
CRM: ${doctorCRM || '__________'}

Assinatura: _______________________________

────────────────────────────────────────────────────────────────
⚠️ AVISO IMPORTANTE:
Esta receita foi gerada com auxílio de IA. Sempre revise e assine
digitalmente ou manualmente antes de entregar ao paciente.
A responsabilidade final é do médico prescritor.
────────────────────────────────────────────────────────────────

🏥 Gerado por CinthiaMed
  `.trim();
}

/**
 * Download de receita médica
 * @param {object} prescriptionData
 */
export function downloadPrescription(prescriptionData) {
  const text = generatePrescription(prescriptionData);
  const filename = `Receita_${prescriptionData.patientName?.replace(/\s+/g, '_') || 'Paciente'}_${new Date().toISOString().split('T')[0]}.txt`;
  downloadFile(text, filename, 'text/plain;charset=utf-8');
}

/**
 * Gera pedido de exame
 * @param {object} examRequestData
 * @returns {string}
 */
export function generateExamRequest(examRequestData) {
  const {
    patientName,
    patientAge,
    patientGender,
    date,
    exams,
    clinicalIndication,
    doctorName,
    doctorCRM
  } = examRequestData;

  return `
╔══════════════════════════════════════════════════════════════╗
║                    SOLICITAÇÃO DE EXAMES                     ║
╚══════════════════════════════════════════════════════════════╝

Data: ${date || new Date().toLocaleDateString('pt-BR')}

DADOS DO PACIENTE:
────────────────────────────────────────────────────────────────
Nome: ${patientName || '___________________________________'}
Idade: ${patientAge || '____'} anos
Sexo: ${patientGender || '____'}

────────────────────────────────────────────────────────────────
EXAMES SOLICITADOS:
────────────────────────────────────────────────────────────────

${exams?.map((exam, index) => `
${index + 1}) ${exam.name || exam}
   ${exam.urgency === 'urgent' ? '🔴 URGENTE' : ''}
   ${exam.observation ? `   Obs: ${exam.observation}` : ''}
`).join('\n') || 'Nenhum exame solicitado'}

────────────────────────────────────────────────────────────────
INDICAÇÃO CLÍNICA / JUSTIFICATIVA:
────────────────────────────────────────────────────────────────
${clinicalIndication || 'Não especificada'}

────────────────────────────────────────────────────────────────

Dr(a). ${doctorName || '___________________________________'}
CRM: ${doctorCRM || '__________'}

Assinatura: _______________________________

────────────────────────────────────────────────────────────────
⚠️ AVISO IMPORTANTE:
Este pedido foi gerado com auxílio de IA baseado em evidências
científicas. Sempre revise antes de entregar ao paciente.
────────────────────────────────────────────────────────────────

🏥 Gerado por CinthiaMed
  `.trim();
}

/**
 * Download de pedido de exame
 * @param {object} examRequestData
 */
export function downloadExamRequest(examRequestData) {
  const text = generateExamRequest(examRequestData);
  const filename = `Pedido_Exame_${examRequestData.patientName?.replace(/\s+/g, '_') || 'Paciente'}_${new Date().toISOString().split('T')[0]}.txt`;
  downloadFile(text, filename, 'text/plain;charset=utf-8');
}

/**
 * Gera atestado médico
 * @param {object} certificateData
 * @returns {string}
 */
export function generateMedicalCertificate(certificateData) {
  const {
    patientName,
    days,
    startDate,
    cid,
    doctorName,
    doctorCRM
  } = certificateData;

  const start = new Date(startDate || Date.now());
  const end = new Date(start);
  end.setDate(end.getDate() + (parseInt(days) || 1));

  return `
╔══════════════════════════════════════════════════════════════╗
║                      ATESTADO MÉDICO                         ║
╚══════════════════════════════════════════════════════════════╝

Atesto, para os devidos fins, que o(a) paciente:

${patientName || '___________________________________'}

Necessita se afastar de suas atividades por motivo de saúde
pelo período de ${days || '___'} dia(s).

Período: ${start.toLocaleDateString('pt-BR')} até ${end.toLocaleDateString('pt-BR')}

${cid ? `CID-10: ${cid}` : ''}

────────────────────────────────────────────────────────────────

${new Date().toLocaleDateString('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric'
})}

Dr(a). ${doctorName || '___________________________________'}
CRM: ${doctorCRM || '__________'}

Assinatura: _______________________________

────────────────────────────────────────────────────────────────
⚠️ AVISO IMPORTANTE:
Este atestado foi gerado com auxílio de IA. Sempre revise,
assine e carimbe antes de entregar ao paciente.
────────────────────────────────────────────────────────────────

🏥 Gerado por CinthiaMed
  `.trim();
}

/**
 * Download de atestado médico
 * @param {object} certificateData
 */
export function downloadMedicalCertificate(certificateData) {
  const text = generateMedicalCertificate(certificateData);
  const filename = `Atestado_${certificateData.patientName?.replace(/\s+/g, '_') || 'Paciente'}_${new Date().toISOString().split('T')[0]}.txt`;
  downloadFile(text, filename, 'text/plain;charset=utf-8');
}

/**
 * Exporta dados como JSON
 * @param {object} data
 * @param {string} filename
 */
export function exportAsJSON(data, filename = 'export') {
  const json = JSON.stringify(data, null, 2);
  const file = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
  downloadFile(json, file, 'application/json');
}
