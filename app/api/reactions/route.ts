import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { sendNotification } from "@/lib/email"

export async function GET() {
  const supabase = await createClient()
  const headersList = await headers()
  
  const forwardedFor = headersList.get("x-forwarded-for")
  const realIp = headersList.get("x-real-ip")
  const ip = forwardedFor?.split(",")[0] || realIp || "unknown"

  // Conta likes e dislikes
  const { data: likes } = await supabase
    .from("reactions")
    .select("id", { count: "exact" })
    .eq("reaction_type", "like")

  const { data: dislikes } = await supabase
    .from("reactions")
    .select("id", { count: "exact" })
    .eq("reaction_type", "dislike")

  // Verifica se o usuário atual já reagiu
  const { data: userReaction } = await supabase
    .from("reactions")
    .select("reaction_type")
    .eq("ip_address", ip)
    .single()

  return NextResponse.json({
    likes: likes?.length || 0,
    dislikes: dislikes?.length || 0,
    userReaction: userReaction?.reaction_type || null,
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const headersList = await headers()
  
  const forwardedFor = headersList.get("x-forwarded-for")
  const realIp = headersList.get("x-real-ip")
  const ip = forwardedFor?.split(",")[0] || realIp || "unknown"

  const { type } = await request.json()

  if (!["like", "dislike"].includes(type)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 })
  }

  // Verifica se já existe uma reação deste IP
  const { data: existingReaction } = await supabase
    .from("reactions")
    .select("id, reaction_type")
    .eq("ip_address", ip)
    .single()

  if (existingReaction) {
    if (existingReaction.reaction_type === type) {
      // Remove a reação se clicar no mesmo botão
      await supabase.from("reactions").delete().eq("ip_address", ip)
      return NextResponse.json({ action: "removed" })
    } else {
      // Atualiza para o novo tipo
      await supabase
        .from("reactions")
        .update({ reaction_type: type })
        .eq("ip_address", ip)
      return NextResponse.json({ action: "updated", type })
    }
  }

  // Cria nova reação
  const { error } = await supabase.from("reactions").insert({
    ip_address: ip,
    reaction_type: type,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Envia notificação por email (não bloqueia a resposta)
  sendNotification({
    type: type as "like" | "dislike",
    ip,
    userAgent: headersList.get("user-agent") || undefined,
  }).catch(console.error)

  return NextResponse.json({ action: "created", type })
}
