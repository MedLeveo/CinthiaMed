import pkg from 'pg';
const { Pool } = pkg;

// Configuração do PostgreSQL - Supabase
// Usando Direct Connection (mais confiável)
const pool = new Pool({
  connectionString: 'postgresql://postgres:KZx24fSgcwsTkNdWaGoK@db.yupuudqizbwbgdzpzwjl.supabase.co:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Teste de conexão
pool.on('connect', () => {
  console.log('✅ Conectado ao PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado no PostgreSQL:', err);
  process.exit(-1);
});

// Função helper para executar queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executada:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Erro na query:', { text, error: error.message });
    throw error;
  }
};

// Função para inicializar o banco de dados (criar tabelas se não existirem)
const initializeDatabase = async () => {
  try {
    // Testar conexão
    await pool.query('SELECT NOW()');

    // Criar tabela conversations se não existir
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255),
        assistant_type VARCHAR(50) DEFAULT 'geral',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Criar tabela messages se não existir
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Criar tabela password_resets se não existir
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(500) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Criar índices
    await pool.query('CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON password_resets(expires_at)');

    console.log('✅ Schema do banco de dados inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar schema:', error.message);
    throw error;
  }
};

// Funções de usuário
const userQueries = {
  // Criar usuário
  createUser: async (name, email, passwordHash, googleId = null, avatarUrl = null) => {
    const text = `
      INSERT INTO users (name, email, password_hash, google_id, avatar_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, avatar_url, created_at
    `;
    const values = [name, email, passwordHash, googleId, avatarUrl];
    const res = await query(text, values);
    return res.rows[0];
  },

  // Buscar usuário por email
  findByEmail: async (email) => {
    const text = 'SELECT * FROM users WHERE email = $1 AND is_active = TRUE';
    const res = await query(text, [email]);
    return res.rows[0];
  },

  // Buscar usuário por Google ID
  findByGoogleId: async (googleId) => {
    const text = 'SELECT * FROM users WHERE google_id = $1 AND is_active = TRUE';
    const res = await query(text, [googleId]);
    return res.rows[0];
  },

  // Buscar usuário por ID
  findById: async (id) => {
    const text = 'SELECT id, name, email, avatar_url, created_at FROM users WHERE id = $1 AND is_active = TRUE';
    const res = await query(text, [id]);
    return res.rows[0];
  },

  // Atualizar último login
  updateLastLogin: async (userId) => {
    const text = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1';
    await query(text, [userId]);
  },
};

// Funções de sessão
const sessionQueries = {
  // Criar sessão
  createSession: async (userId, token, expiresAt, ipAddress = null, userAgent = null) => {
    const text = `
      INSERT INTO sessions (user_id, token, expires_at, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [userId, token, expiresAt, ipAddress, userAgent];
    const res = await query(text, values);
    return res.rows[0];
  },

  // Buscar sessão por token
  findByToken: async (token) => {
    const text = `
      SELECT s.*, u.id as user_id, u.name, u.email, u.avatar_url
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = $1 AND s.expires_at > CURRENT_TIMESTAMP AND u.is_active = TRUE
    `;
    const res = await query(text, [token]);
    return res.rows[0];
  },

  // Deletar sessão
  deleteSession: async (token) => {
    const text = 'DELETE FROM sessions WHERE token = $1';
    await query(text, [token]);
  },

  // Limpar sessões expiradas
  cleanExpiredSessions: async () => {
    const text = 'DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP';
    const res = await query(text, []);
    return res.rowCount;
  },
};

// Funções de recuperação de senha
const passwordResetQueries = {
  // Criar token de recuperação
  createResetToken: async (userId, token, expiresAt) => {
    const text = `
      INSERT INTO password_resets (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const res = await query(text, [userId, token, expiresAt]);
    return res.rows[0];
  },

  // Buscar token de recuperação
  findByToken: async (token) => {
    const text = `
      SELECT pr.*, u.id as user_id, u.email
      FROM password_resets pr
      JOIN users u ON pr.user_id = u.id
      WHERE pr.token = $1
        AND pr.expires_at > CURRENT_TIMESTAMP
        AND pr.used = FALSE
        AND u.is_active = TRUE
    `;
    const res = await query(text, [token]);
    return res.rows[0];
  },

  // Marcar token como usado
  markAsUsed: async (token) => {
    const text = 'UPDATE password_resets SET used = TRUE WHERE token = $1';
    await query(text, [token]);
  },

  // Limpar tokens expirados
  cleanExpiredTokens: async () => {
    const text = 'DELETE FROM password_resets WHERE expires_at < CURRENT_TIMESTAMP OR used = TRUE';
    const res = await query(text, []);
    return res.rowCount;
  },
};

// Funções de conversas
const conversationQueries = {
  // Criar conversa
  createConversation: async (userId, title, assistantType) => {
    const text = `
      INSERT INTO conversations (user_id, title, assistant_type)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const res = await query(text, [userId, title, assistantType]);
    return res.rows[0];
  },

  // Listar conversas do usuário
  listByUser: async (userId, limit = 50) => {
    const text = `
      SELECT * FROM conversations
      WHERE user_id = $1
      ORDER BY updated_at DESC
      LIMIT $2
    `;
    const res = await query(text, [userId, limit]);
    return res.rows;
  },

  // Adicionar mensagem
  addMessage: async (conversationId, role, content) => {
    const text = `
      INSERT INTO messages (conversation_id, role, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const res = await query(text, [conversationId, role, content]);
    return res.rows[0];
  },

  // Buscar mensagens de uma conversa
  getMessages: async (conversationId) => {
    const text = `
      SELECT * FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
    `;
    const res = await query(text, [conversationId]);
    return res.rows;
  },
};

export {
  query,
  pool,
  initializeDatabase,
  userQueries,
  sessionQueries,
  passwordResetQueries,
  conversationQueries,
};
