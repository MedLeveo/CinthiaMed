import nodemailer from 'nodemailer';

// Criar transporter do Brevo (Sendinblue) SMTP
const getBrevoTransporter = () => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey || apiKey === 'sua_api_key_aqui') {
    throw new Error('BREVO_API_KEY não configurada no .env');
  }

  return nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // true para porta 465, false para outras portas
    auth: {
      user: 'maycon.design16@gmail.com', // Login SMTP do Brevo (seu email cadastrado)
      pass: apiKey, // SMTP Key (API Key) do Brevo
    },
    tls: {
      rejectUnauthorized: false // Aceitar certificados auto-assinados
    }
  });
};

export const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = getBrevoTransporter();

    console.log(`📧 Enviando email de boas-vindas para: ${email}`);

    const info = await transporter.sendMail({
      from: '"CinthiaMed" <maycon.design16@gmail.com>', // Remetente
      to: email, // Destinatário
      subject: 'Bem-vindo ao CinthiaMed!',
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
            <div class="logo">🩺</div>
            <h1>Bem-vindo ao CinthiaMed!</h1>
            <p>Olá <span class="highlight">${name}</span>,</p>
            <p>Estamos muito felizes em ter você conosco! Sua conta foi criada com sucesso.</p>

            <div class="feature-list">
              <p style="color: #e2e8f0; font-weight: 600; margin-bottom: 16px; text-align: left;">
                ✨ O que você pode fazer com o CinthiaMed:
              </p>
              <ul>
                <li>💬 Consultar informações médicas com IA</li>
                <li>🧮 Usar calculadoras médicas especializadas</li>
                <li>📚 Acessar estudos científicos do PubMed</li>
                <li>🔐 Gerenciar suas consultas com segurança</li>
              </ul>
            </div>

            <p>Comece agora e aproveite todas as funcionalidades!</p>

            <div class="footer">
              <p>Este é um email automático do CinthiaMed</p>
              <p>Por favor, não responda a este email</p>
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
    console.error('❌ Erro no serviço de email de boas-vindas:', error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const transporter = getBrevoTransporter();

    console.log(`📧 Enviando email de recuperação para: ${email}`);

    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;

    const info = await transporter.sendMail({
      from: '"CinthiaMed" <maycon.design16@gmail.com>', // Remetente
      to: email, // Destinatário
      subject: 'Recuperação de Senha - CinthiaMed',
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
            <div class="logo">🔑</div>
            <h1>Recuperação de Senha</h1>
            <p>Você solicitou a recuperação da sua senha no CinthiaMed.</p>
            <p>Clique no botão abaixo para criar uma nova senha:</p>

            <div class="button-container">
              <a href="${resetUrl}" class="button">Redefinir Senha</a>
            </div>

            <div class="info-box">
              <p><strong>⏰ Este link expira em 1 hora</strong></p>
              <p>Por motivos de segurança, este link de recuperação é válido por apenas 1 hora.</p>
            </div>

            <p style="font-size: 14px; color: #64748b;">
              Se você não solicitou a recuperação de senha, pode ignorar este email com segurança.
            </p>

            <div class="footer">
              <p>Este é um email automático do CinthiaMed</p>
              <p>Por favor, não responda a este email</p>
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
    console.error('❌ Erro no serviço de email:', error);
    throw error;
  }
};
