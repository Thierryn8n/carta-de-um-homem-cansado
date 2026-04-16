-- Tabela de visitantes (para rastrear IPs)
CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de reações (likes/dislikes)
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ip_address)
);

-- Tabela de comentários "anônimos" (mas com IP rastreado)
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_visitors_ip ON visitors(ip_address);
CREATE INDEX IF NOT EXISTS idx_reactions_ip ON reactions(ip_address);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- RLS desabilitado para permitir acesso público (anônimo)
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir inserção e leitura pública
CREATE POLICY "Allow public insert on visitors" ON visitors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on visitors" ON visitors FOR SELECT USING (true);

CREATE POLICY "Allow public insert on reactions" ON reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on reactions" ON reactions FOR SELECT USING (true);
CREATE POLICY "Allow public update on reactions" ON reactions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on reactions" ON reactions FOR DELETE USING (true);

CREATE POLICY "Allow public insert on comments" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on comments" ON comments FOR SELECT USING (true);
