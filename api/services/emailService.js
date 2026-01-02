/**
 * Email Service usando SendGrid
 *
 * Configuração necessária:
 * - SENDGRID_API_KEY: API Key do SendGrid (https://app.sendgrid.com/settings/api_keys)
 * - SENDGRID_FROM_EMAIL: Email remetente verificado no SendGrid
 * - FRONTEND_URL: URL do frontend para links de verificação
 *
 * Templates personalizáveis em: api/config/emailTemplates.js
 *
 * SendGrid funciona perfeitamente com Vercel e não requer domínio próprio.
 */

import sgMail from '@sendgrid/mail';
import templates from '../config/emailTemplates.js';

// Configurar SendGrid
const initSendGrid = () => {
  const apiKey = process.env.SENDGRID_API_KEY;

  if (!apiKey || apiKey === 'sua_api_key_aqui') {
    console.warn('⚠️ SENDGRID_API_KEY não configurada - emails não serão enviados');
    return false;
  }

  sgMail.setApiKey(apiKey);
  return true;
};

// Enviar email via SendGrid
async function sendEmail({ to, subject, htmlContent, fromEmail, fromName = 'CinthiaMed' }) {
  if (!initSendGrid()) {
    console.error('❌ SendGrid não configurado');
    return null;
  }

  const from = fromEmail || process.env.SENDGRID_FROM_EMAIL || 'maycon.design16@gmail.com';

  try {
    console.log(`📧 Enviando email via SendGrid para: ${to}`);
    console.log(`📧 De: ${fromName} <${from}>`);
    console.log(`📧 Assunto: ${subject}`);

    const msg = {
      to: to,
      from: {
        email: from,
        name: fromName
      },
      subject: subject,
      html: htmlContent,
    };

    const response = await sgMail.send(msg);

    console.log('✅ Email enviado com sucesso via SendGrid!');
    console.log('📧 Status Code:', response[0].statusCode);
    console.log('📧 Message ID:', response[0].headers['x-message-id']);

    return {
      success: true,
      messageId: response[0].headers['x-message-id'],
      statusCode: response[0].statusCode
    };

  } catch (error) {
    console.error('❌ Erro ao enviar email via SendGrid:', error.message);

    if (error.response) {
      console.error('❌ [DEBUG] Status:', error.response.statusCode);
      console.error('❌ [DEBUG] Body:', error.response.body);
    }

    throw error;
  }
}

/**
 * Envia email de verificação para novo usuário
 */
async function sendVerificationEmail(email, name, verificationToken) {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'https://cinthiamed.vercel.app';
    const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    const tpl = templates.emailVerification;
    const cfg = templates.config;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%); margin: 0; padding: 40px 20px; }
          .container { max-width: 600px; margin: 0 auto; background: linear-gradient(145deg, #1a1f2e 0%, #16213e 100%); border-radius: 24px; padding: 48px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); border: 1px solid #2a3142; }
          .logo { width: 80px; height: 80px; margin: 0 auto 20px; background: linear-gradient(135deg, #8b5cf6, #ec4899); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 36px; box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3); }
          h1 { color: #e2e8f0; font-size: 28px; font-weight: 700; margin: 0 0 16px 0; text-align: center; }
          p { color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center; }
          .highlight { color: #a78bfa; font-weight: 600; }
          .button-container { text-align: center; margin: 32px 0; }
          .button { display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #8b5cf6, #ec4899); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4); }
          .info-box { background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 20px; margin: 24px 0; }
          .info-box p { font-size: 14px; margin: 0; color: #a78bfa; }
          .footer { border-top: 1px solid #2a3142; padding-top: 24px; margin-top: 32px; text-align: center; }
          .footer p { font-size: 12px; color: #64748b; margin: 4px 0; }
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
          <p style="font-size: 14px; color: #64748b;">${tpl.securityNote}</p>
          <div class="footer">
            <p>${tpl.footer.line1}</p>
            <p>${tpl.footer.line2}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await sendEmail({
      to: email,
      subject: tpl.subject,
      htmlContent: htmlContent,
      fromEmail: cfg.fromEmail,
      fromName: cfg.fromName
    });

  } catch (error) {
    console.error('❌ Erro ao enviar email de verificação:', error.message);
    // Não lançar erro - falha no email não deve impedir cadastro
    return null;
  }
}

/**
 * Envia email de boas-vindas (após verificação)
 */
async function sendWelcomeEmail(email, name) {
  try {
    const tpl = templates.welcome;
    const cfg = templates.config;
    const frontendUrl = process.env.FRONTEND_URL || 'https://cinthiamed.vercel.app';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%); margin: 0; padding: 40px 20px; }
          .container { max-width: 600px; margin: 0 auto; background: linear-gradient(145deg, #1a1f2e 0%, #16213e 100%); border-radius: 24px; padding: 48px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); border: 1px solid #2a3142; }
          .logo { width: 80px; height: 80px; margin: 0 auto 20px; background: linear-gradient(135deg, #8b5cf6, #ec4899); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 36px; box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3); }
          h1 { color: #e2e8f0; font-size: 28px; font-weight: 700; margin: 0 0 16px 0; text-align: center; }
          p { color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center; }
          .button-container { text-align: center; margin: 32px 0; }
          .button { display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #8b5cf6, #ec4899); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4); }
          .footer { border-top: 1px solid #2a3142; padding-top: 24px; margin-top: 32px; text-align: center; }
          .footer p { font-size: 12px; color: #64748b; margin: 4px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">${tpl.logoEmoji}</div>
          <h1>${tpl.title}</h1>
          <p>${tpl.greeting(name)}</p>
          <p>${tpl.intro}</p>
          <p>${tpl.closing}</p>
          <div class="button-container">
            <a href="${frontendUrl}" class="button">${tpl.buttonText}</a>
          </div>
          <div class="footer">
            <p>${tpl.footer.line1}</p>
            <p>${tpl.footer.line2}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await sendEmail({
      to: email,
      subject: tpl.subject,
      htmlContent: htmlContent,
      fromEmail: cfg.fromEmail,
      fromName: cfg.fromName
    });

  } catch (error) {
    console.error('❌ Erro ao enviar email de boas-vindas:', error.message);
    return null;
  }
}

/**
 * Envia email de recuperação de senha
 */
async function sendPasswordResetEmail(email, resetToken) {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'https://cinthiamed.vercel.app';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const tpl = templates.passwordReset;
    const cfg = templates.config;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%); margin: 0; padding: 40px 20px; }
          .container { max-width: 600px; margin: 0 auto; background: linear-gradient(145deg, #1a1f2e 0%, #16213e 100%); border-radius: 24px; padding: 48px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); border: 1px solid #2a3142; }
          .logo { width: 80px; height: 80px; margin: 0 auto 20px; background: linear-gradient(135deg, #8b5cf6, #ec4899); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 36px; box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3); }
          h1 { color: #e2e8f0; font-size: 28px; font-weight: 700; margin: 0 0 16px 0; text-align: center; }
          p { color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center; }
          .button-container { text-align: center; margin: 32px 0; }
          .button { display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #8b5cf6, #ec4899); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4); }
          .info-box { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 20px; margin: 24px 0; }
          .info-box p { font-size: 14px; margin: 0; color: #fca5a5; }
          .footer { border-top: 1px solid #2a3142; padding-top: 24px; margin-top: 32px; text-align: center; }
          .footer p { font-size: 12px; color: #64748b; margin: 4px 0; }
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
          <p style="font-size: 14px; color: #64748b;">${tpl.securityNote}</p>
          <div class="footer">
            <p>${tpl.footer.line1}</p>
            <p>${tpl.footer.line2}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await sendEmail({
      to: email,
      subject: tpl.subject,
      htmlContent: htmlContent,
      fromEmail: cfg.fromEmail,
      fromName: cfg.fromName
    });

  } catch (error) {
    console.error('❌ Erro ao enviar email de recuperação de senha:', error.message);
    throw error; // Recuperação de senha deve falhar se email não for enviado
  }
}

export {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail
};
