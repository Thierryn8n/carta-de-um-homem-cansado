-- Adicionar coluna user_agent à tabela reactions (trigger notify_admin precisa)
ALTER TABLE reactions ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Atualizar script de criação para incluir user_agent
COMMENT ON COLUMN reactions.user_agent IS 'User agent do visitante para identificação do dispositivo';
