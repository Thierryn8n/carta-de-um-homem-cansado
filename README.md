# Carta de Um Homem Cansado

## Notificações por Email

O projeto envia notificações automáticas por email quando alguém:
- ✅ Entra no site (visita)
- 👍 Dá like
- 👎 Dá dislike
- 💬 Comenta

### Configuração do Email

1. Crie uma conta gratuita em [Resend.com](https://resend.com) (3.000 emails/mês grátis)
2. Gere uma API Key em "API Keys"
3. Adicione ao `.env`:

```
RESEND_API_KEY=re_sua_chave_aqui
ADMIN_EMAIL=seu-email@exemplo.com
```

4. Verifique seu domínio em Resend (obrigatório para produção)

### Como funciona

- **API Route:** `/api/notify` recebe webhooks do Supabase
- **Geolocalização:** IP é convertido em cidade/estado/país automaticamente
- **Email enviado com:**
  - IP do visitante
  - Localização geográfica (cidade, estado, país)
  - Provedor de internet
  - User Agent (navegador/dispositivo)
  - Data/hora
  - Conteúdo do comentário (se aplicável)

### Setup do Banco (Supabase)

Execute o script SQL em `scripts/002_notification_trigger.sql` no SQL Editor do Supabase para ativar os triggers de notificação.

### Ambiente de Desenvolvimento

```bash
pnpm install
pnpm dev
```
