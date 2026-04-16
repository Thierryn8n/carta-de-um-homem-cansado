import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "seu-email@exemplo.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, ip_address, user_agent, content, reaction_type, created_at } = body;

    // Obter geolocalização do IP (simples, sem API externa)
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

    const { error } = await resend.emails.send({
      from: "Carta de Um Homem Cansado <onboarding@resend.dev>",
      to: ADMIN_EMAIL,
      subject,
      html,
    });

    if (error) {
      console.error("Erro ao enviar email:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erro na API:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// Função simples para obter info do IP usando ipapi.co (gratuito, 45 req/min)
async function getIPInfo(ip: string) {
  try {
    // Ignorar IPs locais
    if (ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
      return { city: "Local", region: "Local", country: "Local", org: "Rede Local" };
    }
    
    const response = await fetch(`https://ipapi.co/${ip}/json/`, { cache: "no-store" });
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
