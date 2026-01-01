/**
 * Templates de Email - CinthiaMed
 *
 * Aqui você pode personalizar todos os textos e conteúdos dos emails enviados.
 *
 * IMPORTANTE:
 * - Use HTML para formatação
 * - As variáveis dinâmicas são: ${name}, ${resetUrl}
 * - Mantenha a estrutura do CSS para design consistente
 */

module.exports = {
  /**
   * Configurações globais de email
   */
  config: {
    fromName: 'CinthiaMed',
    fromEmail: 'maycon.design16@gmail.com',
    supportEmail: 'suporte@cinthiamed.com'
  },

  /**
   * Template: Email de Boas-Vindas
   * Enviado quando um novo usuário se cadastra
   */
  welcome: {
    subject: 'Bem-vindo ao CinthiaMed!',

    // Título principal
    title: 'Bem-vindo ao CinthiaMed!',

    // Emoji do logo (opcional: pode usar emoji ou imagem)
    logoEmoji: '🩺',

    // Mensagem de saudação
    greeting: (name) => `Olá <span class="highlight">${name}</span>,`,

    // Parágrafo introdutório
    intro: 'Estamos muito felizes em ter você conosco! Sua conta foi criada com sucesso.',

    // Título da seção de funcionalidades
    featuresTitle: '✨ O que você pode fazer com o CinthiaMed:',

    // Lista de funcionalidades (cada item é um <li>)
    features: [
      '💬 Consultar informações médicas com IA baseada em evidências científicas',
      '📚 Acessar estudos de múltiplas fontes (PubMed, SciELO, Semantic Scholar, ClinicalTrials)',
      '🧮 Usar calculadoras médicas e escores clínicos especializados',
      '👶 Calcular doses pediátricas com segurança (exige peso do paciente)',
      '📝 Gravar consultas no formato S.O.A.P (Subjetivo, Objetivo, Avaliação, Plano)',
      '🏥 Encontrar ensaios clínicos em andamento',
      '🔐 Gerenciar suas consultas com total segurança, privacidade e compliance LGPD'
    ],

    // Mensagem de encerramento
    closing: 'Comece agora e aproveite todas as funcionalidades!',

    // Rodapé
    footer: {
      line1: 'Este é um email automático do CinthiaMed',
      line2: 'Dúvidas? Entre em contato: suporte@cinthiamed.com'
    }
  },

  /**
   * Template: Email de Recuperação de Senha
   * Enviado quando usuário solicita redefinição de senha
   */
  passwordReset: {
    subject: 'Recuperação de Senha - CinthiaMed',

    // Título principal
    title: 'Recuperação de Senha',

    // Emoji do logo
    logoEmoji: '🔑',

    // Mensagens
    intro: 'Você solicitou a recuperação da sua senha no CinthiaMed.',
    instructions: 'Clique no botão abaixo para criar uma nova senha:',

    // Texto do botão
    buttonText: 'Redefinir Senha',

    // Aviso de expiração
    expirationWarning: {
      title: '⏰ Este link expira em 1 hora',
      description: 'Por motivos de segurança, este link de recuperação é válido por apenas 1 hora.'
    },

    // Aviso de segurança
    securityNote: 'Se você não solicitou a recuperação de senha, pode ignorar este email com segurança.',

    // Rodapé
    footer: {
      line1: 'Este é um email automático do CinthiaMed',
      line2: 'Dúvidas? Entre em contato: suporte@cinthiamed.com'
    }
  },

  /**
   * Estilos CSS globais para todos os emails
   * Você pode modificar cores, fontes, etc.
   */
  styles: {
    // Cores principais
    colors: {
      primary: '#8b5cf6',      // Roxo
      secondary: '#ec4899',    // Rosa
      background: '#1e293b',   // Azul escuro
      cardBg: '#1a1f2e',      // Cinza escuro
      textPrimary: '#e2e8f0', // Branco/cinza claro
      textSecondary: '#94a3b8', // Cinza médio
      textTertiary: '#64748b',  // Cinza
      border: '#2a3142',       // Borda cinza
      highlight: '#a78bfa'     // Roxo claro
    },

    // Fontes
    fonts: {
      primary: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }
  }
};
