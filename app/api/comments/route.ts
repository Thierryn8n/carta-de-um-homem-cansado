import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { sendNotification } from "@/lib/email"

export async function GET() {
  const supabase = await createClient()

  const { data: comments, error } = await supabase
    .from("comments")
    .select("id, content, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ comments })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const headersList = await headers()
  
  const forwardedFor = headersList.get("x-forwarded-for")
  const realIp = headersList.get("x-real-ip")
  const ip = forwardedFor?.split(",")[0] || realIp || "unknown"
  const userAgent = headersList.get("user-agent") || "unknown"

  const { content } = await request.json()

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: "Comentário vazio" }, { status: 400 })
  }

  if (content.length > 1000) {
    return NextResponse.json({ error: "Comentário muito longo" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      content: content.trim(),
      ip_address: ip,
      user_agent: userAgent,
    })
    .select("id, content, created_at")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Envia notificação por email (não bloqueia a resposta)
  sendNotification({
    type: "comment",
    ip,
    userAgent,
    details: content.trim(),
  }).catch(console.error)

  return NextResponse.json({ comment: data })
}
