import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

// Chave secreta para acessar os dados de IP
// Defina ADMIN_SECRET_KEY nas variáveis de ambiente
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || "thierry-admin-2025"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get("secret")

  if (secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const supabase = await createClient()

  // Busca todos os visitantes com IPs
  const { data: visitors } = await supabase
    .from("visitors")
    .select("*")
    .order("created_at", { ascending: false })

  // Busca todas as reações com IPs
  const { data: reactions } = await supabase
    .from("reactions")
    .select("*")
    .order("created_at", { ascending: false })

  // Busca todos os comentários com IPs
  const { data: comments } = await supabase
    .from("comments")
    .select("*")
    .order("created_at", { ascending: false })

  return NextResponse.json({
    visitors: visitors || [],
    reactions: reactions || [],
    comments: comments || [],
    stats: {
      totalVisitors: visitors?.length || 0,
      totalLikes: reactions?.filter((r) => r.reaction_type === "like").length || 0,
      totalDislikes: reactions?.filter((r) => r.reaction_type === "dislike").length || 0,
      totalComments: comments?.length || 0,
    },
  })
}
