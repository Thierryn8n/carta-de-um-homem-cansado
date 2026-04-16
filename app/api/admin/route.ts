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

// Função para limpar IP (remove IPv6 prefix, etc)
function cleanIP(ip: string): string {
  // Remove IPv6 prefix se existir
  if (ip.includes(":")) {
    // IPv6 ou IPv4 mapeado em IPv6 (::ffff:127.0.0.1)
    const ipv4Match = ip.match(/::ffff:(\d+\.\d+\.\d+\.\d+)/)
    if (ipv4Match) return ipv4Match[1]
    return ip // retorna IPv6 puro
  }
  return ip
}

async function getGeoLocation(ip: string): Promise<GeoData | null> {
  const cleanIp = cleanIP(ip)
  
  // Ignora IPs locais/inválidos
  if (cleanIp === "127.0.0.1" || 
      cleanIp === "unknown" || 
      cleanIp.startsWith("192.168.") || 
      cleanIp.startsWith("10.") ||
      cleanIp.startsWith("172.16.") ||
      cleanIp.startsWith("::1")) {
    return { city: "🔄 Local/Rede Interna", region: "N/A", country: "N/A" }
  }

  // Verifica cache
  if (geoCache.has(cleanIp)) {
    return geoCache.get(cleanIp)!
  }

  try {
    // ipapi.co é gratuito (45 req/min) - sem user-agent para evitar bloqueio
    const res = await fetch(`https://ipapi.co/${cleanIp}/json/`, {
      next: { revalidate: 3600 }
    })

    if (!res.ok) {
      console.log(`Geo API error for IP ${cleanIp}: ${res.status}`)
      return null
    }

    const data = await res.json()
    
    // Verifica se a resposta tem erro
    if (data.error || !data.city) {
      console.log(`Geo data error for IP ${cleanIp}:`, data)
      return null
    }
    
    const geo: GeoData = {
      city: data.city,
      region: data.region,
      country: data.country_name,
      latitude: data.latitude,
      longitude: data.longitude
    }

    geoCache.set(cleanIp, geo)
    return geo
  } catch (err) {
    console.error(`Geo location error for IP ${cleanIp}:`, err)
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
