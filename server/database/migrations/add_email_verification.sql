-- Migração: Adicionar verificação de email
-- Data: 2025-12-31
-- Descrição: Adiciona colunas para verificação de email obrigatória

-- Adicionar colunas de verificação de email
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP,
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;

-- Marcar usuários existentes como verificados (migração)
UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL OR email_verified = FALSE;

-- Usuários Google OAuth devem ser sempre verificados
UPDATE users SET email_verified = TRUE WHERE google_id IS NOT NULL;

-- Criar índice para tokens
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);

-- Comentários
COMMENT ON COLUMN users.email_verified IS 'Indica se o email do usuário foi verificado';
COMMENT ON COLUMN users.verification_token IS 'Token único para verificação de email';
COMMENT ON COLUMN users.verification_token_expires IS 'Data de expiração do token de verificação (24 horas)';
COMMENT ON COLUMN users.password_reset_token IS 'Token único para reset de senha';
COMMENT ON COLUMN users.password_reset_expires IS 'Data de expiração do token de reset (1 hora)';
