import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Salva subscription de push no banco
export async function POST(request: Request) {
  try {
    const subscription = await request.json()
    
    if (!subscription.endpoint) {
      return NextResponse.json(
        { error: "Subscription inválida" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Salva/atualiza subscription
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert({
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh,
        auth: subscription.keys?.auth,
        created_at: new Date().toISOString()
      }, {
        onConflict: "endpoint"
      })

    if (error) {
      console.error("Erro ao salvar subscription:", error)
      return NextResponse.json(
        { error: "Erro ao salvar" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro na subscription:", error)
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    )
  }
}
