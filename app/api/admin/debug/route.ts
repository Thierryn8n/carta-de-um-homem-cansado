import { NextResponse } from "next/server"
import { headers } from "next/headers"

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || "thierry-admin-2025"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get("secret")

  if (secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const headersList = await headers()
  
  // Todos os headers relacionados a IP
  const ipHeaders = {
    "x-forwarded-for": headersList.get("x-forwarded-for"),
    "x-real-ip": headersList.get("x-real-ip"),
    "x-forwarded-proto": headersList.get("x-forwarded-proto"),
    "cf-connecting-ip": headersList.get("cf-connecting-ip"), // Cloudflare
    "x-client-ip": headersList.get("x-client-ip"),
  }
  
  // IP detectado
  const forwardedFor = headersList.get("x-forwarded-for")
  const realIp = headersList.get("x-real-ip")
  const detectedIP = forwardedFor?.split(",")[0] || realIp || "unknown"

  // Testa geolocalização do IP detectado
  let geoData = null
  let geoError = null
  
  if (detectedIP && detectedIP !== "unknown" && !detectedIP.startsWith("127.")) {
    try {
      const res = await fetch(`https://ipapi.co/${detectedIP}/json/`, {
        cache: "no-store"
      })
      geoData = await res.json()
      if (geoData.error) {
        geoError = geoData.error
        geoData = null
      }
    } catch (err) {
      geoError = String(err)
    }
  }

  return NextResponse.json({
    detectedIP,
    headers: ipHeaders,
    geolocation: geoData ? {
      city: geoData.city,
      region: geoData.region,
      country: geoData.country_name,
      org: geoData.org,
      timezone: geoData.timezone
    } : null,
    geoError,
    timestamp: new Date().toISOString()
  })
}
