import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

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
  try {
    const supabase = await createClient()
    const headersList = await headers()
    
    const forwardedFor = headersList.get("x-forwarded-for")
    const realIp = headersList.get("x-real-ip")
    const ip = forwardedFor?.split(",")[0] || realIp || "unknown"
    const userAgent = headersList.get("user-agent") || "unknown"

    const body = await request.json().catch(() => ({}))
    const { type } = body

    console.log("[Reactions API] Received:", { type, ip, userAgent: userAgent?.substring(0, 50) })

    if (!type || !["like", "dislike"].includes(type)) {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 })
    }

    // Verifica se já existe uma reação deste IP
    const { data: existingReaction, error: selectError } = await supabase
      .from("reactions")
      .select("id, reaction_type")
      .eq("ip_address", ip)
      .single()

    if (selectError && selectError.code !== "PGRST116") {
      console.error("[Reactions API] Select error:", selectError)
    }

    if (existingReaction) {
      if (existingReaction.reaction_type === type) {
        // Remove a reação se clicar no mesmo botão
        const { error: deleteError } = await supabase.from("reactions").delete().eq("ip_address", ip)
        if (deleteError) {
          console.error("[Reactions API] Delete error:", deleteError)
          return NextResponse.json({ error: deleteError.message }, { status: 500 })
        }
        return NextResponse.json({ action: "removed" })
      } else {
        // Atualiza para o novo tipo
        const { error: updateError } = await supabase
          .from("reactions")
          .update({ reaction_type: type })
          .eq("ip_address", ip)
        if (updateError) {
          console.error("[Reactions API] Update error:", updateError)
          return NextResponse.json({ error: updateError.message }, { status: 500 })
        }
        return NextResponse.json({ action: "updated", type })
      }
    }

    // Cria nova reação (tenta com user_agent, se falhar tenta sem)
    let insertError = await supabase.from("reactions").insert({
      ip_address: ip,
      reaction_type: type,
      user_agent: userAgent,
    }).then(r => r.error)

    // Se erro é coluna não encontrada, tenta sem user_agent
    if (insertError && insertError.message?.includes("user_agent")) {
      console.log("[Reactions API] user_agent column not found, inserting without it")
      insertError = await supabase.from("reactions").insert({
        ip_address: ip,
        reaction_type: type,
      }).then(r => r.error)
    }

    if (insertError) {
      console.error("[Reactions API] Insert error:", insertError)
      return NextResponse.json({ error: insertError.message, details: insertError }, { status: 500 })
    }

    return NextResponse.json({ action: "created", type })
  } catch (err) {
    console.error("[Reactions API] Unexpected error:", err)
    return NextResponse.json({ error: "Internal server error", details: String(err) }, { status: 500 })
  }
}
