-- ============================================================================
-- MIGRAÇÃO: Sistema de Verificação de Email
-- Data: 2025-12-31
-- Descrição: Adiciona verificação de email obrigatória para novos usuários
--
-- INSTRUÇÕES:
-- 1. Acesse seu projeto no Supabase
-- 2. Vá em "SQL Editor"
-- 3. Cole este código e clique em "Run"
-- ============================================================================

-- Adicionar colunas de verificação de email
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP,
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;

-- Garantir que os tokens sejam únicos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'users_verification_token_key'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_verification_token_key UNIQUE (verification_token);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'users_password_reset_token_key'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_password_reset_token_key UNIQUE (password_reset_token);
    END IF;
END $$;

-- Marcar usuários EXISTENTES como verificados (migração retroativa)
-- Importante: novos usuários terão email_verified = FALSE por padrão
UPDATE users
SET email_verified = TRUE
WHERE email_verified = FALSE OR email_verified IS NULL;

-- Usuários que fazem login via Google OAuth devem ser sempre verificados
UPDATE users
SET email_verified = TRUE
WHERE google_id IS NOT NULL;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token)
WHERE verification_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token)
WHERE password_reset_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- Comentários para documentação
COMMENT ON COLUMN users.email_verified IS 'Indica se o email do usuário foi verificado';
COMMENT ON COLUMN users.verification_token IS 'Token único para verificação de email (SHA-256)';
COMMENT ON COLUMN users.verification_token_expires IS 'Data de expiração do token de verificação (24 horas)';
COMMENT ON COLUMN users.password_reset_token IS 'Token único para reset de senha (SHA-256)';
COMMENT ON COLUMN users.password_reset_expires IS 'Data de expiração do token de reset (1 hora)';

-- Verificar se tudo foi criado corretamente
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users
AND column_name IN (
    'email_verified',
    'verification_token',
    'verification_token_expires',
    'password_reset_token',
    'password_reset_expires'
)
ORDER BY column_name;

-- Resultado esperado: 5 colunas listadas
