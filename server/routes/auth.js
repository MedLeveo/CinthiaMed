import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import crypto from 'crypto';
import { query, userQueries, sessionQueries, passwordResetQueries } from '../database/db.js';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../services/emailService.js';

const router = express.Router();

// Chave secreta para JWT (em produção, use variável de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'cinthiamed_super_secret_key_2024';
const JWT_EXPIRATION = '7d'; // Token expira em 7 dias

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const session = await sessionQueries.findByToken(token);

    if (!session) {
      return res.status(403).json({ error: 'Token inválido ou expirado' });
    }

    req.user = {
      id: session.user_id,
      email: session.email,
      name: session.name,
      avatar_url: session.avatar_url,
    };

    next();
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Rota de registro (cadastro)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validações
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
    }

    // Verificar se email já existe
    const existingUser = await userQueries.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Este email já está cadastrado' });
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

    // Criar usuário
    const user = await userQueries.createUser(name, email, passwordHash);

    // Criar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    // Salvar sessão no banco
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

    await sessionQueries.createSession(
      user.id,
      token,
      expiresAt,
      req.ip,
      req.headers['user-agent']
    );

    // Atualizar último login
    await userQueries.updateLastLogin(user.id);

    // Enviar email de boas-vindas (não bloquear cadastro se falhar)
    try {
      await sendWelcomeEmail(email, name);
    } catch (emailError) {
      console.error('❌ Erro ao enviar email de boas-vindas, mas usuário foi criado:', emailError);
      // Continuar - não falhar o cadastro se o email falhar
    }

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ error: 'Erro ao criar conta' });
  }
});

// Rota de login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validações
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário
    const user = await userQueries.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Verificar senha
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Esta conta usa login social. Use "Continuar com Google"' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Criar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    // Salvar sessão no banco
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

    await sessionQueries.createSession(
      user.id,
      token,
      expiresAt,
      req.ip,
      req.headers['user-agent']
    );

    // Atualizar último login
    await userQueries.updateLastLogin(user.id);

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Rota de logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      await sessionQueries.deleteSession(token);
    }

    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    res.status(500).json({ error: 'Erro ao fazer logout' });
  }
});

// Rota para verificar se o token é válido
router.get('/verify', authenticateToken, async (req, res) => {
  res.json({
    valid: true,
    user: req.user,
  });
});

// Rota para obter dados do usuário autenticado
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await userQueries.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
  }
});

// Limpar sessões expiradas (executar periodicamente)
router.post('/clean-sessions', async (req, res) => {
  try {
    const count = await sessionQueries.cleanExpiredSessions();
    res.json({ message: `${count} sessões expiradas removidas` });
  } catch (error) {
    console.error('Erro ao limpar sessões:', error);
    res.status(500).json({ error: 'Erro ao limpar sessões' });
  }
});

// ============================================
// ROTAS DE RECUPERAÇÃO DE SENHA
// ============================================

// POST /api/auth/forgot-password - Solicitar recuperação de senha
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    // Buscar usuário por email
    const user = await userQueries.findByEmail(email);

    // Sempre retornar sucesso (segurança: não revelar se email existe)
    if (!user) {
      return res.json({ message: 'Se o email existir, um link de recuperação foi enviado' });
    }

    // Verificar se é conta Google (não tem senha)
    if (!user.password_hash) {
      return res.json({ message: 'Se o email existir, um link de recuperação foi enviado' });
    }

    // Gerar token seguro
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Token expira em 1 hora (usar UTC para evitar problemas de timezone)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora em milissegundos

    // Salvar token no banco
    await passwordResetQueries.createResetToken(user.id, resetToken, expiresAt);

    // Enviar email com link de recuperação
    try {
      await sendPasswordResetEmail(email, resetToken);
    } catch (emailError) {
      console.error('❌ Erro ao enviar email, mas token foi criado:', emailError);
      // Continuar mesmo se o email falhar (token ainda é válido)
    }

    // Log no console para desenvolvimento
    console.log(`🔐 Link de recuperação gerado para ${email}:`);
    console.log(`http://localhost:3000/reset-password?token=${resetToken}`);

    res.json({ message: 'Email de recuperação enviado com sucesso' });
  } catch (error) {
    console.error('Erro ao processar recuperação de senha:', error);
    res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
});

// POST /api/auth/reset-password - Redefinir senha com token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    // Validações
    if (!token || !password) {
      return res.status(400).json({ error: 'Token e senha são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
    }

    // Validar token
    const resetRecord = await passwordResetQueries.findByToken(token);

    if (!resetRecord) {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    // Hash da nova senha
    const passwordHash = await bcrypt.hash(password, 10);

    // Atualizar senha do usuário
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, resetRecord.user_id]
    );

    // Marcar token como usado
    await passwordResetQueries.markAsUsed(token);

    // Invalidar todas as sessões do usuário (logout de todos os dispositivos)
    await query('DELETE FROM sessions WHERE user_id = $1', [resetRecord.user_id]);

    console.log(`✅ Senha redefinida com sucesso para usuário ID: ${resetRecord.user_id}`);

    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
});

// ============================================
// ROTAS DO GOOGLE OAUTH
// ============================================

// GET /api/auth/google - Iniciar autenticação com Google
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// GET /api/auth/google/callback - Callback do Google OAuth
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: 'http://localhost:3000',
    session: false
  }),
  async (req, res) => {
    try {
      const user = req.user;

      // Gerar token JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
      );

      // Criar sessão no banco
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

      await sessionQueries.createSession(
        user.id,
        token,
        expiresAt,
        req.ip,
        req.headers['user-agent']
      );

      // Atualizar último login
      await userQueries.updateLastLogin(user.id);

      // Redirecionar para o frontend com o token
      res.redirect(`http://localhost:3000?token=${token}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}`);
    } catch (error) {
      console.error('Erro no callback do Google:', error);
      res.redirect('http://localhost:3000?error=authentication_failed');
    }
  }
);

export { router, authenticateToken };
