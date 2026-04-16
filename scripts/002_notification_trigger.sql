-- Função para enviar notificação via webhook quando houver nova reação ou comentário
CREATE OR REPLACE FUNCTION notify_admin()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  webhook_url TEXT := 'https://carta-de-um-homem-cansado.vercel.app/api/notify';
BEGIN
  -- Construir payload baseado no tipo de operação
  IF TG_TABLE_NAME = 'reactions' THEN
    payload := jsonb_build_object(
      'type', 'reaction',
      'ip_address', NEW.ip_address,
      'user_agent', NEW.user_agent,
      'reaction_type', NEW.reaction_type,
      'created_at', NEW.created_at
    );
  ELSIF TG_TABLE_NAME = 'comments' THEN
    payload := jsonb_build_object(
      'type', 'comment',
      'ip_address', NEW.ip_address,
      'user_agent', NEW.user_agent,
      'content', NEW.content,
      'created_at', NEW.created_at
    );
  END IF;

  -- Enviar requisição HTTP assíncrona (requer pg_net extension)
  PERFORM net.http_post(
    url := webhook_url,
    body := payload,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para reações
DROP TRIGGER IF EXISTS reaction_notify_trigger ON reactions;
CREATE TRIGGER reaction_notify_trigger
  AFTER INSERT ON reactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin();

-- Trigger para comentários
DROP TRIGGER IF EXISTS comment_notify_trigger ON comments;
CREATE TRIGGER comment_notify_trigger
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin();
