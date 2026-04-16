import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

// Chave secreta para acessar os dados de IP
// Defina ADMIN_SECRET_KEY nas variáveis de ambiente
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || "thierry-admin-2025"

interface GeoData {
  city?: string
  region?: string
  country?: string
  country_name?: string
  latitude?: number
  longitude?: number
}

// Cache simples para geolocalização (evita rate limit)
const geoCache = new Map<string, GeoData>()

async function getGeoLocation(ip: string): Promise<GeoData | null> {
  // Ignora IPs locais
  if (ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return { city: "Local", region: "Local", country: "Local" }
  }

  // Verifica cache
  if (geoCache.has(ip)) {
    return geoCache.get(ip)!
  }

  try {
    // ipapi.co é gratuito (45 req/min)
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 3600 } // cache por 1 hora
    })

    if (!res.ok) return null

    const data = await res.json()
    const geo: GeoData = {
      city: data.city,
      region: data.region,
      country: data.country_name,
      latitude: data.latitude,
      longitude: data.longitude
    }

    geoCache.set(ip, geo)
    return geo
  } catch {
    return null
  }
}

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

  // Adiciona geolocalização aos dados
  const visitorsWithGeo = await Promise.all(
    (visitors || []).map(async (v) => ({
      ...v,
      geo: await getGeoLocation(v.ip_address)
    }))
  )

  const reactionsWithGeo = await Promise.all(
    (reactions || []).map(async (r) => ({
      ...r,
      geo: await getGeoLocation(r.ip_address)
    }))
  )

  const commentsWithGeo = await Promise.all(
    (comments || []).map(async (c) => ({
      ...c,
      geo: await getGeoLocation(c.ip_address)
    }))
  )

  return NextResponse.json({
    visitors: visitorsWithGeo,
    reactions: reactionsWithGeo,
    comments: commentsWithGeo,
    stats: {
      totalVisitors: visitors?.length || 0,
      totalLikes: reactions?.filter((r) => r.reaction_type === "like").length || 0,
      totalDislikes: reactions?.filter((r) => r.reaction_type === "dislike").length || 0,
      totalComments: comments?.length || 0,
    },
  })
}
