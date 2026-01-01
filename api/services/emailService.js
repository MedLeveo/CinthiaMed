/**
 * Email Service usando Brevo (Sendinblue) SMTP
 *
 * Configuração necessária:
 * - BREVO_API_KEY: SMTP Key do Brevo
 * - FRONTEND_URL: URL do frontend para links de recuperação
 *
 * Templates personalizáveis em: api/config/emailTemplates.js
 */

const nodemailer = require('nodemailer');
const templates = require('../config/emailTemplates');

// Criar transporter do Brevo (Sendinblue) SMTP
const getBrevoTransporter = () => {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey || apiKey === 'sua_api_key_aqui') {
    console.warn('⚠️ BREVO_API_KEY não configurada - emails não serão enviados');
    return null;
  }

  return nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: 'maycon.design16@gmail.com', // Login SMTP do Brevo
      pass: apiKey, // SMTP Key (API Key) do Brevo
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Envia email de verificação para novo usuário
 */
async function sendVerificationEmail(email, name, verificationToken) {
  try {
    const transporter = getBrevoTransporter();

    if (!transporter) {
      console.log('⚠️ Email de verificação não enviado (BREVO_API_KEY não configurada)');
      return null;
    }

    console.log(`📧 Enviando email de verificação para: ${email}`);

    const frontendUrl = process.env.FRONTEND_URL || 'https://cinthiamed.vercel.app';
    const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    const tpl = templates.emailVerification;
    const cfg = templates.config;

    const info = await transporter.sendMail({
      from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
      to: email,
      subject: tpl.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%);
              margin: 0;
              padding: 40px 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: linear-gradient(145deg, #1a1f2e 0%, #16213e 100%);
              border-radius: 24px;
              padding: 48px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
              border: 1px solid #2a3142;
            }
            .logo {
              width: 80px;
              height: 80px;
              margin: 0 auto 20px;
              background: linear-gradient(135deg, #8b5cf6, #ec4899);
              border-radius: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 36px;
              box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
            }
            h1 {
              color: #e2e8f0;
              font-size: 28px;
              font-weight: 700;
              margin: 0 0 16px 0;
              text-align: center;
            }
            p {
              color: #94a3b8;
              font-size: 16px;
              line-height: 1.6;
              margin: 0 0 24px 0;
              text-align: center;
            }
            .highlight {
              color: #8b5cf6;
              font-weight: 600;
            }
            .button {
              display: inline-block;
              padding: 16px 32px;
              background: linear-gradient(135deg, #8b5cf6, #ec4899);
              color: #ffffff;
              text-decoration: none;
              border-radius: 12px;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
              margin: 20px 0;
            }
            .button-container {
              text-align: center;
            }
            .info-box {
              background: rgba(139, 92, 246, 0.1);
              border: 1px solid rgba(139, 92, 246, 0.3);
              border-radius: 12px;
              padding: 20px;
              margin: 24px 0;
            }
            .info-box p {
              color: #a78bfa;
              font-size: 14px;
              margin: 0;
              text-align: left;
            }
            .footer {
              color: #64748b;
              font-size: 12px;
              text-align: center;
              margin-top: 32px;
              padding-top: 24px;
              border-top: 1px solid #2a3142;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">${tpl.logoEmoji}</div>
            <h1>${tpl.title}</h1>
            <p>${tpl.greeting(name)}</p>
            <p>${tpl.intro}</p>
            <p>${tpl.instructions}</p>

            <div class="button-container">
              <a href="${verifyUrl}" class="button">${tpl.buttonText}</a>
            </div>

            <div class="info-box">
              <p><strong>${tpl.expirationWarning.title}</strong></p>
              <p>${tpl.expirationWarning.description}</p>
            </div>

            <p style="font-size: 14px; color: #64748b;">
              ${tpl.securityNote}
            </p>

            <div class="footer">
              <p>${tpl.footer.line1}</p>
              <p>${tpl.footer.line2}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log('✅ Email de verificação enviado com sucesso para:', email);
    console.log('📧 Message ID:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Erro ao enviar email de verificação:', error);
    // Não lançar erro - falha no email não deve impedir cadastro
    return null;
  }
}

/**
 * Envia email de boas-vindas (após verificação)
 */
async function sendWelcomeEmail(email, name) {
  try {
    const transporter = getBrevoTransporter();

    if (!transporter) {
      console.log('⚠️ Email de boas-vindas não enviado (BREVO_API_KEY não configurada)');
      return null;
    }

    console.log(`📧 Enviando email de boas-vindas para: ${email}`);

    const tpl = templates.welcome;
    const cfg = templates.config;

    const info = await transporter.sendMail({
      from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
      to: email,
      subject: tpl.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%);
              margin: 0;
              padding: 40px 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: linear-gradient(145deg, #1a1f2e 0%, #16213e 100%);
              border-radius: 24px;
              padding: 48px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
              border: 1px solid #2a3142;
            }
            .logo {
              width: 80px;
              height: 80px;
              margin: 0 auto 20px;
              background: linear-gradient(135deg, #8b5cf6, #ec4899);
              border-radius: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 36px;
              box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
            }
            h1 {
              color: #e2e8f0;
              font-size: 28px;
              font-weight: 700;
              margin: 0 0 16px 0;
              text-align: center;
            }
            p {
              color: #94a3b8;
              font-size: 16px;
              line-height: 1.6;
              margin: 0 0 24px 0;
              text-align: center;
            }
            .highlight {
              color: #8b5cf6;
              font-weight: 600;
            }
            .feature-list {
              background: rgba(139, 92, 246, 0.1);
              border: 1px solid rgba(139, 92, 246, 0.3);
              border-radius: 12px;
              padding: 24px;
              margin: 24px 0;
            }
            .feature-list ul {
              list-style: none;
              padding: 0;
              margin: 0;
            }
            .feature-list li {
              color: #e2e8f0;
              font-size: 15px;
              padding: 12px 0;
              border-bottom: 1px solid rgba(139, 92, 246, 0.2);
            }
            .feature-list li:last-child {
              border-bottom: none;
            }
            .button {
              display: inline-block;
              padding: 16px 32px;
              background: linear-gradient(135deg, #8b5cf6, #ec4899);
              color: #ffffff;
              text-decoration: none;
              border-radius: 12px;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
              margin: 20px 0;
            }
            .button-container {
              text-align: center;
            }
            .footer {
              color: #64748b;
              font-size: 12px;
              text-align: center;
              margin-top: 32px;
              padding-top: 24px;
              border-top: 1px solid #2a3142;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">${tpl.logoEmoji}</div>
            <h1>${tpl.title}</h1>
            <p>${tpl.greeting(name)}</p>
            <p>${tpl.intro}</p>

            <div class="feature-list">
              <p style="color: #e2e8f0; font-weight: 600; margin-bottom: 16px; text-align: left;">
                ${tpl.featuresTitle}
              </p>
              <ul>
                ${tpl.features.map(feature => `<li>${feature}</li>`).join('\n                ')}
              </ul>
            </div>

            <p>${tpl.closing}</p>

            <div class="button-container">
              <a href="${process.env.FRONTEND_URL || 'https://cinthiamed.vercel.app'}" class="button">${tpl.buttonText}</a>
            </div>

            <div class="footer">
              <p>${tpl.footer.line1}</p>
              <p>${tpl.footer.line2}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log('✅ Email de boas-vindas enviado com sucesso para:', email);
    console.log('📧 Message ID:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Erro ao enviar email de boas-vindas:', error);
    // Não lançar erro - falha no email não deve impedir cadastro
    return null;
  }
}

/**
 * Envia email de recuperação de senha
 */
async function sendPasswordResetEmail(email, resetToken) {
  try {
    const transporter = getBrevoTransporter();

    if (!transporter) {
      console.log('⚠️ Email de recuperação não enviado (BREVO_API_KEY não configurada)');
      return null;
    }

    console.log(`📧 Enviando email de recuperação para: ${email}`);

    const frontendUrl = process.env.FRONTEND_URL || 'https://cinthiamed.vercel.app';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const tpl = templates.passwordReset;
    const cfg = templates.config;

    const info = await transporter.sendMail({
      from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
      to: email,
      subject: tpl.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%);
              margin: 0;
              padding: 40px 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: linear-gradient(145deg, #1a1f2e 0%, #16213e 100%);
              border-radius: 24px;
              padding: 48px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
              border: 1px solid #2a3142;
            }
            .logo {
              width: 80px;
              height: 80px;
              margin: 0 auto 20px;
              background: linear-gradient(135deg, #8b5cf6, #ec4899);
              border-radius: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 36px;
              box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
            }
            h1 {
              color: #e2e8f0;
              font-size: 28px;
              font-weight: 700;
              margin: 0 0 16px 0;
              text-align: center;
            }
            p {
              color: #94a3b8;
              font-size: 16px;
              line-height: 1.6;
              margin: 0 0 24px 0;
              text-align: center;
            }
            .button {
              display: inline-block;
              padding: 16px 32px;
              background: linear-gradient(135deg, #8b5cf6, #ec4899);
              color: #ffffff;
              text-decoration: none;
              border-radius: 12px;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
              margin: 20px 0;
            }
            .button-container {
              text-align: center;
            }
            .info-box {
              background: rgba(139, 92, 246, 0.1);
              border: 1px solid rgba(139, 92, 246, 0.3);
              border-radius: 12px;
              padding: 20px;
              margin: 24px 0;
            }
            .info-box p {
              color: #a78bfa;
              font-size: 14px;
              margin: 0;
              text-align: left;
            }
            .footer {
              color: #64748b;
              font-size: 12px;
              text-align: center;
              margin-top: 32px;
              padding-top: 24px;
              border-top: 1px solid #2a3142;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">${tpl.logoEmoji}</div>
            <h1>${tpl.title}</h1>
            <p>${tpl.intro}</p>
            <p>${tpl.instructions}</p>

            <div class="button-container">
              <a href="${resetUrl}" class="button">${tpl.buttonText}</a>
            </div>

            <div class="info-box">
              <p><strong>${tpl.expirationWarning.title}</strong></p>
              <p>${tpl.expirationWarning.description}</p>
            </div>

            <p style="font-size: 14px; color: #64748b;">
              ${tpl.securityNote}
            </p>

            <div class="footer">
              <p>${tpl.footer.line1}</p>
              <p>${tpl.footer.line2}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log('✅ Email de recuperação enviado com sucesso para:', email);
    console.log('📧 Message ID:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Erro ao enviar email de recuperação:', error);
    throw error; // Recuperação de senha deve falhar se email não for enviado
  }
}

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail
};
