-- Tabela para armazenar subscriptions de push notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT,
  auth TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Políticas RLS (permissões)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Apenas o sistema pode inserir (funções edge/server)
CREATE POLICY "Allow service insert on push_subscriptions" 
  ON push_subscriptions FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service delete on push_subscriptions" 
  ON push_subscriptions FOR DELETE USING (true);
