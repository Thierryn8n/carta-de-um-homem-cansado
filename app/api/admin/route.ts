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
  street?: string
  neighborhood?: string
  zip?: string
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

// Timeout wrapper para fetch
async function fetchWithTimeout(url: string, timeout = 5000): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, { 
      signal: controller.signal,
      next: { revalidate: 3600 }
    })
    clearTimeout(id)
    return response
  } catch (error) {
    clearTimeout(id)
    throw error
  }
}

async function getGeoLocation(ip: string): Promise<GeoData | null> {
  const cleanIp = cleanIP(ip)
  
  console.log(`[Geo] Processando IP: ${cleanIp}`)
  
  // Ignora IPs locais/inválidos
  if (cleanIp === "127.0.0.1" || 
      cleanIp === "unknown" || 
      cleanIp.startsWith("192.168.") || 
      cleanIp.startsWith("10.") ||
      cleanIp.startsWith("172.16.") ||
      cleanIp.startsWith("::1")) {
    console.log(`[Geo] IP local ignorado: ${cleanIp}`)
    return { city: "🔄 Local/Rede Interna", region: "N/A", country: "N/A" }
  }

  // Verifica cache
  if (geoCache.has(cleanIp)) {
    console.log(`[Geo] Cache hit: ${cleanIp}`)
    return geoCache.get(cleanIp)!
  }

  // Tenta primeira API: ipapi.co
  try {
    console.log(`[Geo] Tentando ipapi.co para ${cleanIp}`)
    const res = await fetchWithTimeout(`https://ipapi.co/${cleanIp}/json/`, 3000)

    if (!res.ok) {
      console.log(`[Geo] ipapi.co erro ${res.status} para ${cleanIp}`)
      throw new Error(`HTTP ${res.status}`)
    }

    const data = await res.json()
    
    if (data.error) {
      console.log(`[Geo] ipapi.co retornou erro:`, data.error)
      throw new Error(data.error)
    }
    
    const geo: GeoData = {
      city: data.city || "Cidade Desconhecida",
      region: data.region || data.region_code || "",
      country: data.country_name || data.country || "País Desconhecido",
      latitude: data.latitude,
      longitude: data.longitude,
      street: data.street || data.road || undefined,
      neighborhood: data.suburb || data.neighbourhood || data.neighborhood || undefined,
      zip: data.postal || data.zip || undefined
    }

    console.log(`[Geo] Sucesso ipapi.co: ${geo.city}, ${geo.country}`)
    geoCache.set(cleanIp, geo)
    return geo
    
  } catch (err) {
    console.log(`[Geo] ipapi.co falhou: ${err}`)
  }

  // Fallback: ip-api.com (também gratuito, 45 req/min)
  try {
    console.log(`[Geo] Tentando ip-api.com para ${cleanIp}`)
    const res = await fetchWithTimeout(`http://ip-api.com/json/${cleanIp}?fields=status,message,city,regionName,country,lat,lon,zip,`, 3000)

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const data = await res.json()
    
    if (data.status === "fail") {
      console.log(`[Geo] ip-api.com falhou:`, data.message)
      throw new Error(data.message)
    }
    
    const geo: GeoData = {
      city: data.city || "Cidade Desconhecida",
      region: data.regionName || "",
      country: data.country || "País Desconhecido",
      latitude: data.lat,
      longitude: data.lon,
      zip: data.zip || undefined
    }

    console.log(`[Geo] Sucesso ip-api.com: ${geo.city}, ${geo.country}`)
    geoCache.set(cleanIp, geo)
    return geo
    
  } catch (err) {
    console.log(`[Geo] ip-api.com também falhou: ${err}`)
  }

  // Último fallback: retorna desconhecido mas não fica carregando
  console.log(`[Geo] Todas APIs falharam para ${cleanIp}`)
  const fallbackGeo: GeoData = {
    city: "❓ Desconhecido",
    region: "",
    country: "Não foi possível localizar"
  }
  geoCache.set(cleanIp, fallbackGeo)
  return fallbackGeo
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
