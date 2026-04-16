import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Remove subscription de push
export async function POST(request: Request) {
  try {
    const { endpoint } = await request.json()
    
    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint necessário" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint)

    if (error) {
      console.error("Erro ao remover subscription:", error)
      return NextResponse.json(
        { error: "Erro ao remover" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro no unsubscribe:", error)
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    )
  }
}
