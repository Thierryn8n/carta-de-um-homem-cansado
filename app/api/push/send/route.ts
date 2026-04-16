import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import webpush from "web-push"

// Configura chaves VAPID (definir no .env)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || ""
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ""
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@example.com"

// Configura web-push se tiver chaves
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

interface PushMessage {
  title: string
  body: string
  tag?: string
  data?: Record<string, unknown>
}

// Envia notificação push para todos os subscribers
export async function POST(request: Request) {
  try {
    // Verifica se webpush está configurado
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "VAPID keys não configuradas" },
        { status: 500 }
      )
    }

    const message: PushMessage = await request.json()
    
    if (!message.title || !message.body) {
      return NextResponse.json(
        { error: "Título e corpo necessários" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Busca todas as subscriptions
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*")

    if (error) {
      console.error("Erro ao buscar subscriptions:", error)
      return NextResponse.json(
        { error: "Erro ao buscar subscribers" },
        { status: 500 }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { message: "Nenhum subscriber encontrado" },
        { status: 200 }
      )
    }

    // Envia notificação para cada subscriber
    const payload = JSON.stringify({
      title: message.title,
      body: message.body,
      tag: message.tag || "notification",
      data: message.data || {}
    })

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        }

        try {
          await webpush.sendNotification(pushSubscription, payload)
          return { endpoint: sub.endpoint, success: true }
        } catch (error) {
          // Se falhar (subscription expirada), remove do banco
          if ((error as webpush.WebPushError)?.statusCode === 410) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint)
          }
          return { endpoint: sub.endpoint, success: false, error }
        }
      })
    )

    const successful = results.filter(r => r.status === "fulfilled" && (r.value as {success: boolean}).success).length
    const failed = results.length - successful

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      total: subscriptions.length
    })
  } catch (error) {
    console.error("Erro ao enviar push:", error)
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    )
  }
}
