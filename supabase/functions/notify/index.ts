// Edge Function alternativa (caso o trigger SQL não funcione)
// Para deploy: supabase functions deploy notify

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { type, ip_address, user_agent, content, reaction_type, created_at } = await req.json();
  
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "seu-email@exemplo.com";
  
  // Obter geolocalização do IP
  const ipInfo = await getIPInfo(ip_address);
  
  const subject = type === "reaction" 
    ? `Nova reação: ${reaction_type === "like" ? "👍 Like" : "👎 Dislike"}` 
    : "💬 Novo comentário";

  const html = `
    <h2>${type === "reaction" ? "Nova Reação" : "Novo Comentário"}</h2>
    <hr>
    <p><strong>IP:</strong> ${ip_address}</p>
    <p><strong>Localização:</strong> ${ipInfo.city}, ${ipInfo.region}, ${ipInfo.country}</p>
    <p><strong>Provedor:</strong> ${ipInfo.org || "N/A"}</p>
    <p><strong>User Agent:</strong> ${user_agent || "N/A"}</p>
    <p><strong>Data:</strong> ${new Date(created_at).toLocaleString("pt-BR")}</p>
    <hr>
    ${type === "comment" ? `<p><strong>Comentário:</strong></p><blockquote>${content}</blockquote>` : ""}
    ${type === "reaction" ? `<p><strong>Tipo:</strong> ${reaction_type === "like" ? "👍 Like" : "👎 Dislike"}</p>` : ""}
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Carta de Um Homem Cansado <onboarding@resend.dev>",
      to: ADMIN_EMAIL,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("Erro ao enviar email:", error);
    return new Response(JSON.stringify({ error }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});

async function getIPInfo(ip: string) {
  try {
    if (ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
      return { city: "Local", region: "Local", country: "Local", org: "Rede Local" };
    }
    
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();
    
    return {
      city: data.city || "Desconhecido",
      region: data.region || "Desconhecido",
      country: data.country_name || data.country || "Desconhecido",
      org: data.org || data.asn || "Desconhecido",
    };
  } catch {
    return { city: "Desconhecido", region: "Desconhecido", country: "Desconhecido", org: "Desconhecido" };
  }
}
