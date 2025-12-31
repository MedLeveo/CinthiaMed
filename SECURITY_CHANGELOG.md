# 🔐 Changelog de Segurança - CinthiaMed

## 2025-12-31 - Auditoria e Hardening Completo

### 🎯 Objetivo
Implementar todas as medidas de segurança críticas conforme solicitado:
1. SQL Injection prevention
2. Password hashing security
3. XSS protection
4. Rate limiting (brute force protection)
5. Authorization & ownership verification
6. HTTPS enforcement
7. Environment variables security

---

### ✅ 1. SQL Injection - VERIFICADO (JÁ ESTAVA SEGURO)

**Status**: Nenhuma mudança necessária

**Verificação**: Todas as queries já utilizavam parameterized queries com placeholders `$1, $2, $3`.

**Arquivos Verificados**:
- `api/index.js` - Queries de auth e conversas
- `server/database/db.js` - Helper functions

---

### ✅ 2. Password Hashing - MELHORADO

**Mudanças**:
```diff
// api/index.js:112
- const hashedPassword = await bcrypt.hash(password, 10);
+ const hashedPassword = await bcrypt.hash(password, 12);
```

**Validações Adicionadas**:
```javascript
// api/index.js:100-102
if (password.length < 8) {
  return res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres' });
}
```

**Arquivo**: [api/index.js](api/index.js:100-112)

---

### ✅ 3. XSS Protection - IMPLEMENTADO

**Pacote Instalado**:
```bash
npm install rehype-sanitize
```

**Implementação Frontend**:
```diff
// src/CinthiaMed.js
+ import rehypeSanitize from 'rehype-sanitize';

<ReactMarkdown
  remarkPlugins={[remarkMath]}
- rehypePlugins={[rehypeKatex]}
+ rehypePlugins={[rehypeKatex, rehypeSanitize]}
>
  {msg.content}
</ReactMarkdown>
```

**Arquivo**: [src/CinthiaMed.js](src/CinthiaMed.js)

---

### ✅ 4. Rate Limiting - IMPLEMENTADO

**Pacote Instalado**:
```bash
npm install express-rate-limit
```

**Limiters Criados**:

#### Login Limiter (5 tentativas / 15 min)
```javascript
// api/index.js:38-45
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true
});

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  // ...
});
```

#### Register Limiter (3 contas / hora)
```javascript
// api/index.js:47-54
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3
});

app.post('/api/auth/register', registerLimiter, async (req, res) => {
  // ...
});
```

#### API General Limiter (100 req / min)
```javascript
// api/index.js:56-63
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100
});

app.use('/api', apiLimiter);
```

**Arquivo**: [api/index.js](api/index.js:38-83)

---

### ✅ 5. Authorization & Ownership - IMPLEMENTADO

#### A. Middleware de Autenticação Criado

```javascript
// api/index.js:65-80
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    req.user = decoded; // { userId, email }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};
```

#### B. Rotas Protegidas com authMiddleware

```diff
// Chat endpoint
- app.post('/api/chat', async (req, res) => {
+ app.post('/api/chat', authMiddleware, async (req, res) => {

// Medical record endpoint
- app.post('/api/medical-record', async (req, res) => {
+ app.post('/api/medical-record', authMiddleware, async (req, res) => {

// Process consultation endpoint
- app.post('/api/medical-record/process-consultation', async (req, res) => {
+ app.post('/api/medical-record/process-consultation', authMiddleware, async (req, res) => {
```

#### C. Verificação de Ownership nas Conversas

```javascript
// api/index.js:242-264
if (conversationId) {
  const conversationResult = await pool.query(
    'SELECT * FROM conversations WHERE id = $1',
    [conversationId]
  );

  if (conversationResult.rows.length === 0) {
    return res.status(404).json({ error: 'Conversa não encontrada' });
  }

  const conversation = conversationResult.rows[0];

  // ✅ VERIFICAÇÃO DE OWNERSHIP CRÍTICA
  if (conversation.user_id !== userId) {
    return res.status(403).json({
      error: 'Acesso negado: esta conversa não pertence a você'
    });
  }
}
```

#### D. Novos Endpoints com Ownership

**Listar Conversas do Usuário**:
```javascript
// api/index.js:472-493
app.get('/api/conversations', authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  const conversations = await conversationQueries.listByUser(userId, limit);
  // Retorna APENAS conversas do usuário
});
```

**Buscar Conversa Específica**:
```javascript
// api/index.js:495-541
app.get('/api/conversations/:conversationId', authMiddleware, async (req, res) => {
  // Verifica ownership antes de retornar
  if (conversation.user_id !== userId) {
    return res.status(403).json({ error: 'Acesso negado' });
  }
});
```

**Deletar Conversa**:
```javascript
// api/index.js:543-588
app.delete('/api/conversations/:conversationId', authMiddleware, async (req, res) => {
  // Verifica ownership antes de deletar
  if (conversation.user_id !== userId) {
    return res.status(403).json({ error: 'Acesso negado' });
  }
});
```

#### E. Migração: In-Memory Cache → Database

**Antes**:
```javascript
// ❌ Cache em memória (não persiste, sem ownership)
const conversationCache = new Map();
conversationCache.set(newConversationId, conversationHistory);
```

**Depois**:
```javascript
// ✅ Database com ownership tracking
const conversation = await conversationQueries.createConversation(
  userId,           // ✅ Vincula ao usuário
  title,
  assistantType
);

await conversationQueries.addMessage(conversation.id, 'user', message);
await conversationQueries.addMessage(conversation.id, 'assistant', response);
```

**Arquivo**: [api/index.js](api/index.js:226-588)

---

### ✅ 6. Database Schema - ATUALIZADO

**Tabelas Criadas**:

```javascript
// server/database/db.js:46-67
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  assistant_type VARCHAR(50) DEFAULT 'geral',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Índices de Performance**:
```sql
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

**Arquivo**: [server/database/db.js](server/database/db.js:40-95)

---

### ✅ 7. CORS Security - MELHORADO

```diff
// api/index.js:27-33
app.use(cors({
- origin: true,
+ origin: process.env.FRONTEND_URL || 'https://cinthiamed.vercel.app',
  credentials: true,
+ methods: ['GET', 'POST', 'PUT', 'DELETE'],
+ allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Arquivo**: [api/index.js](api/index.js:27-33)

---

### ✅ 8. HTTPS & Environment Variables - VERIFICADO

**Status**: Já estava seguro

- ✅ Vercel fornece HTTPS automático
- ✅ `.env` no `.gitignore`
- ✅ Nenhuma chave hardcoded
- ✅ Variáveis configuradas no Vercel Dashboard

---

## 📦 Dependências Adicionadas

```json
{
  "dependencies": {
    "express-rate-limit": "^8.2.1",
    "rehype-sanitize": "^6.0.0"
  }
}
```

---

## 🔒 Resumo de Segurança

| Vulnerabilidade       | Status Antes | Status Depois | Ação                          |
|-----------------------|--------------|---------------|-------------------------------|
| SQL Injection         | ✅ Seguro    | ✅ Seguro     | Nenhuma (já usava params)     |
| Weak Password Hash    | ⚠️ 10 rounds | ✅ 12 rounds  | Aumentado + validação         |
| XSS                   | ⚠️ Parcial   | ✅ Protegido  | rehype-sanitize instalado     |
| Brute Force           | ❌ Vulnerável| ✅ Protegido  | Rate limiters implementados   |
| Missing Auth          | ⚠️ Parcial   | ✅ Completo   | authMiddleware em todas rotas |
| Broken Access Control | ❌ Vulnerável| ✅ Protegido  | Ownership verification        |
| HTTPS                 | ✅ Ativo     | ✅ Ativo      | Vercel automático             |
| Exposed Secrets       | ✅ Seguro    | ✅ Seguro     | .env gitignored               |
| Open CORS             | ⚠️ Muito aberto | ✅ Restrito | Origin específica          |

---

## 🚀 Próximos Passos (Recomendações)

### Curto Prazo:
- [ ] Adicionar testes de segurança automatizados
- [ ] Implementar rate limiting no endpoint de chat (prevenir abuso de API do OpenAI)
- [ ] Adicionar logs de tentativas de acesso não autorizado
- [ ] Implementar refresh tokens (além do JWT de 24h)

### Médio Prazo:
- [ ] Audit de dependências com `npm audit` / Snyk
- [ ] Implementar Content Security Policy (CSP)
- [ ] Adicionar 2FA (Two-Factor Authentication)
- [ ] Encryption at rest para mensagens sensíveis

### Longo Prazo:
- [ ] Penetration testing profissional
- [ ] Compliance LGPD/GDPR review
- [ ] Bug bounty program
- [ ] Security monitoring (Sentry, LogRocket)

---

## 📝 Arquivos Modificados

1. ✅ `api/index.js` - Backend principal (auth, rate limiting, ownership)
2. ✅ `server/database/db.js` - Schema de conversations/messages
3. ✅ `src/CinthiaMed.js` - XSS protection no frontend
4. ✅ `package.json` - Novas dependências de segurança
5. ✅ `SECURITY.md` - Documentação completa (novo)
6. ✅ `SECURITY_CHANGELOG.md` - Este arquivo (novo)

---

**Auditoria Realizada Por**: Claude Code Security Review
**Data**: 2025-12-31
**Status**: ✅ COMPLETO - Todas as 7 verificações implementadas
