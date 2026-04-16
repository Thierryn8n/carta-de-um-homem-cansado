import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export type NotificationType = "like" | "dislike" | "comment" | "visit"

export interface NotificationData {
  type: NotificationType
  ip: string
  location?: string
  details?: string
  userAgent?: string
}

export async function getLocationFromIP(ip: string): Promise<string> {
  try {
    // Remove prefixos comuns de IP local
    const cleanIP = ip.replace(/^::ffff:/, "")
    
    // Não buscar location para IPs locais
    if (cleanIP === "127.0.0.1" || cleanIP === "localhost" || cleanIP.startsWith("192.168.")) {
      return "Local/DEV"
    }
    
    const res = await fetch(`https://ipapi.co/${cleanIP}/json/`, { 
      signal: AbortSignal.timeout(3000) 
    })
    const data = await res.json()
    
    if (data.error) return "Localização não disponível"
    
    const parts = [
      data.city,
      data.region,
      data.country_name,
    ].filter(Boolean)
    
    return parts.join(", ") || "Localização não disponível"
  } catch {
    return "Localização não disponível"
  }
}

export async function sendNotification(data: NotificationData) {
  const to = process.env.NOTIFICATION_EMAIL
  if (!to) {
    console.log("NOTIFICATION_EMAIL não configurado, email não enviado")
    return
  }

  const subjectMap: Record<NotificationType, string> = {
    like: "👍 Nova curtida no site",
    dislike: "👎 Novo dislike no site",
    comment: "💬 Novo comentário no site",
    visit: "👤 Nova visita no site",
  }

  const location = data.location || await getLocationFromIP(data.ip)
  const time = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #333; margin-top: 0;">${subjectMap[data.type]}</h2>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">📍 IP:</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-family: monospace;">${data.ip}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">🌍 Local:</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${location}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">🕐 Horário:</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${time}</td>
        </tr>
        ${data.userAgent ? `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">🖥️ Navegador:</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 12px; word-break: break-all;">${data.userAgent}</td>
        </tr>
        ` : ""}
        ${data.details ? `
        <tr>
          <td style="padding: 10px; font-weight: bold; vertical-align: top;">📝 Detalhes:</td>
          <td style="padding: 10px; white-space: pre-wrap;">${data.details}</td>
        </tr>
        ` : ""}
      </table>
      
      <p style="margin-top: 20px; font-size: 12px; color: #666; text-align: center;">
        Carta de um Homem Cansado - Notificação automática
      </p>
    </div>
  `

  try {
    await transporter.sendMail({
      from: `"Carta de um Homem Cansado" <${process.env.SMTP_USER}>`,
      to,
      subject: subjectMap[data.type],
      html,
    })
    console.log(`✅ Email enviado: ${data.type} de ${data.ip}`)
  } catch (error) {
    console.error("❌ Erro ao enviar email:", error)
  }
}
