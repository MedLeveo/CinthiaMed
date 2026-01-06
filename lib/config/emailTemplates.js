/**
 * Templates de Email - CinthiaMed
 *
 * Aqui você pode personalizar todos os textos e conteúdos dos emails enviados.
 *
 * IMPORTANTE:
 * - Use HTML para formatação
 * - As variáveis dinâmicas são: ${name}, ${verifyUrl}, ${resetUrl}, ${loginUrl}
 * - Mantenha a estrutura do CSS para design consistente
 */

export default {
  /**
   * Configurações globais de email
   */
  config: {
    fromName: 'CinthiaMed',
    fromEmail: 'maycon.design16@gmail.com',
    supportEmail: 'suporte@cinthiamed.com'
  },

  /**
   * Template: Email de Verificação (enviado no cadastro)
   * Usuário precisa clicar no link para verificar o email
   */
  emailVerification: {
    subject: 'Confirme seu email - CinthiaMed',

    title: 'Confirme seu email',
    logoEmoji: 'C',

    greeting: (name) => `Olá <span class="highlight">${name}</span>,`,

    intro: 'Obrigado por se cadastrar no CinthiaMed! Para começar a usar a plataforma, você precisa confirmar seu endereço de email.',

    instructions: 'Clique no botão abaixo para verificar sua conta:',

    buttonText: 'Verificar meu email',

    expirationWarning: {
      title: '⏰ Este link expira em 24 horas',
      description: 'Por segurança, este link de verificação é válido por 24 horas.'
    },

    securityNote: 'Se você não criou uma conta no CinthiaMed, pode ignorar este email com segurança.',

    footer: {
      line1: 'Este é um email automático do CinthiaMed',
      line2: 'Dúvidas? Entre em contato: suporte@cinthiamed.com'
    }
  },

  /**
   * Template: Email de Boas-Vindas (enviado após verificação)
   * Enviado quando o usuário VERIFICA o email com sucesso
   */
  welcome: {
    subject: 'Bem-vindo ao CinthiaMed! 🎉',

    title: 'Bem-vindo ao CinthiaMed!',
    logoEmoji: 'C',

    greeting: (name) => `Olá <span class="highlight">${name}</span>,`,

    intro: 'Sua conta foi verificada com sucesso! Agora você tem acesso completo à plataforma.',

    featuresTitle: '✨ O que você pode fazer com o CinthiaMed:',

    features: [
      '💬 Consultar informações médicas com IA baseada em evidências científicas',
      '📚 Acessar estudos de múltiplas fontes (PubMed, SciELO, Semantic Scholar, ClinicalTrials)',
      '🧮 Usar calculadoras médicas e escores clínicos especializados',
      '👶 Calcular doses pediátricas com segurança (exige peso do paciente)',
      '📝 Gravar consultas no formato S.O.A.P (Subjetivo, Objetivo, Avaliação, Plano)',
      '🏥 Encontrar ensaios clínicos em andamento',
      '🔐 Gerenciar suas consultas com total segurança, privacidade e compliance LGPD'
    ],

    closing: 'Clique no botão abaixo para começar:',

    buttonText: 'Acessar a CinthiaMed',

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

    title: 'Recuperação de Senha',
    logoEmoji: 'C',

    intro: 'Você solicitou a recuperação da sua senha no CinthiaMed.',
    instructions: 'Clique no botão abaixo para criar uma nova senha:',

    buttonText: 'Redefinir Senha',

    expirationWarning: {
      title: '⏰ Este link expira em 1 hora',
      description: 'Por motivos de segurança, este link de recuperação é válido por apenas 1 hora.'
    },

    securityNote: 'Se você não solicitou a recuperação de senha, pode ignorar este email com segurança.',

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
