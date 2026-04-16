import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  const supabase = await createClient()
  const headersList = await headers()
  
  // Obtém o IP real do visitante
  const forwardedFor = headersList.get("x-forwarded-for")
  const realIp = headersList.get("x-real-ip")
  const ip = forwardedFor?.split(",")[0] || realIp || "unknown"
  const userAgent = headersList.get("user-agent") || "unknown"

  // Registra o visitante
  const { error } = await supabase.from("visitors").insert({
    ip_address: ip,
    user_agent: userAgent,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ip, success: true })
}

export async function GET() {
  const headersList = await headers()
  const forwardedFor = headersList.get("x-forwarded-for")
  const realIp = headersList.get("x-real-ip")
  const ip = forwardedFor?.split(",")[0] || realIp || "unknown"
  
  return NextResponse.json({ ip })
}
