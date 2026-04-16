import { NextResponse } from "next/server"

// Configuração de email usando Nodemailer ou Resend
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "thierryn8n@gmail.com"
const RESEND_API_KEY = process.env.RESEND_API_KEY

interface NotifyData {
  type: "visitor" | "like" | "dislike" | "comment"
  ip: string
  city?: string
  region?: string
  country?: string
  content?: string // para comentários
}

async function sendEmail(data: NotifyData) {
  const subject = `🔔 Novo ${data.type} na Carta de um Homem Cansado`

  const location = data.city
    ? `📍 Localização: ${data.city}, ${data.region} - ${data.country}`
    : "📍 Localização: Não identificada"

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">📝 Nova Atividade Detectada</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background: #f5f5f5;">
          <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Tipo:</td>
          <td style="padding: 12px; border: 1px solid #ddd;">${data.type.toUpperCase()}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">IP:</td>
          <td style="padding: 12px; border: 1px solid #ddd;">${data.ip}</td>
        </tr>
        <tr style="background: #f5f5f5;">
          <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Localização:</td>
          <td style="padding: 12px; border: 1px solid #ddd;">${location}</td>
        </tr>
        ${data.content ? `
        <tr>
          <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Comentário:</td>
          <td style="padding: 12px; border: 1px solid #ddd;">${data.content}</td>
        </tr>
        ` : ""}
      </table>
      <p style="color: #666; font-size: 12px;">
        Hora: ${new Date().toLocaleString("pt-BR")}
      </p>
    </div>
  `

  try {
    if (RESEND_API_KEY) {
      // Usa Resend se tiver API key
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "Carta <noreply@carta-de-um-homem-cansado.vercel.app>",
          to: ADMIN_EMAIL,
          subject,
          html
        })
      })
      return res.ok
    }

    // Sem serviço de email configurado - apenas log
    console.log("📧 Email notification (simulado):", { subject, html: html.substring(0, 200) })
    return true
  } catch (error) {
    console.error("Erro ao enviar email:", error)
    return false
  }
}

export async function POST(request: Request) {
  try {
    const body: NotifyData = await request.json()

    if (!body.type || !body.ip) {
      return NextResponse.json(
        { error: "Dados incompletos. Requer: type, ip" },
        { status: 400 }
      )
    }

    const sent = await sendEmail(body)

    return NextResponse.json({
      success: sent,
      message: sent ? "Notificação enviada" : "Falha ao enviar (verifique RESEND_API_KEY)"
    })
  } catch {
    return NextResponse.json(
      { error: "Erro ao processar notificação" },
      { status: 500 }
    )
  }
}
