"use client"

import { useState, useEffect } from "react"
import { Eye, Heart, HeartCrack, MessageCircle, Users, Shield, RefreshCw, MapPin, Bell, BellOff, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNotifications } from "@/hooks/use-notifications"
import { MapModal } from "@/components/map-modal"

// Componente de luz de debug no canto
function DebugLight({ status, message }: { status: "idle" | "loading" | "error" | "success"; message?: string }) {
  const colors = {
    idle: "bg-gray-400",
    loading: "bg-yellow-400 animate-pulse",
    error: "bg-red-500 animate-bounce",
    success: "bg-green-500"
  }
  
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <span className="text-xs text-muted-foreground hidden sm:inline">{message || status}</span>
      <div className={`w-4 h-4 rounded-full ${colors[status]} shadow-lg border-2 border-white`} title={message || status} />
    </div>
  )
}

interface GeoData {
  city?: string
  region?: string
  country?: string
  latitude?: number
  longitude?: number
  street?: string
  neighborhood?: string
  zip?: string
}

interface Visitor {
  id: string
  ip_address: string
  user_agent: string
  created_at: string
  geo?: GeoData
}

interface Reaction {
  id: string
  ip_address: string
  reaction_type: "like" | "dislike"
  created_at: string
  user_agent?: string
  geo?: GeoData
}

interface Comment {
  id: string
  content: string
  ip_address: string
  user_agent: string
  created_at: string
  geo?: GeoData
}

interface AdminData {
  visitors: Visitor[]
  reactions: Reaction[]
  comments: Comment[]
  stats: {
    totalVisitors: number
    totalLikes: number
    totalDislikes: number
    totalComments: number
  }
}

export default function AdminPage() {
  const [secret, setSecret] = useState("")
  const [authenticated, setAuthenticated] = useState(false)
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"visitors" | "reactions" | "comments">("visitors")
  const [selectedGeo, setSelectedGeo] = useState<{geo: GeoData | undefined, ip: string} | null>(null)
  const [isMapOpen, setIsMapOpen] = useState(false)
  
  const { 
    isSupported, 
    permission, 
    isSubscribed, 
    subscribe, 
    unsubscribe, 
    testNotification 
  } = useNotifications()

  function openMap(geo: GeoData | undefined, ip: string) {
    setSelectedGeo({ geo, ip })
    setIsMapOpen(true)
  }

  async function fetchData() {
    if (!secret) return
    setLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/admin?secret=${encodeURIComponent(secret)}`)
      if (!res.ok) {
        setError("Chave inválida")
        setAuthenticated(false)
        return
      }
      const json = await res.json()
      setData(json)
      setAuthenticated(true)
    } catch {
      setError("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString("pt-BR")
  }

  // Mapeia códigos Samsung para nomes amigáveis
  function getSamsungModelName(code: string): string {
    const samsungModels: Record<string, string> = {
      // Galaxy S Series
      "SM-S918": "Galaxy S23 Ultra",
      "SM-S916": "Galaxy S23+",
      "SM-S911": "Galaxy S23",
      "SM-S908": "Galaxy S22 Ultra",
      "SM-S906": "Galaxy S22+",
      "SM-S901": "Galaxy S22",
      "SM-G998": "Galaxy S21 Ultra",
      "SM-G996": "Galaxy S21+",
      "SM-G991": "Galaxy S21",
      "SM-G988": "Galaxy S20 Ultra",
      "SM-G986": "Galaxy S20+",
      "SM-G981": "Galaxy S20",
      "SM-G975": "Galaxy S10+",
      "SM-G973": "Galaxy S10",
      "SM-G970": "Galaxy S10e",
      "SM-G965": "Galaxy S9+",
      "SM-G960": "Galaxy S9",
      "SM-G955": "Galaxy S8+",
      "SM-G950": "Galaxy S8",
      // Galaxy A Series
      "SM-A155": "Galaxy A15",
      "SM-A156": "Galaxy A15 5G",
      "SM-A145": "Galaxy A14",
      "SM-A146": "Galaxy A14 5G",
      "SM-A135": "Galaxy A13",
      "SM-A136": "Galaxy A13 5G",
      "SM-A255": "Galaxy A25",
      "SM-A256": "Galaxy A25 5G",
      "SM-A346": "Galaxy A34",
      "SM-A356": "Galaxy A35",
      "SM-A546": "Galaxy A54",
      "SM-A556": "Galaxy A55",
      "SM-A528": "Galaxy A52s",
      "SM-A525": "Galaxy A52",
      "SM-A526": "Galaxy A52 5G",
      "SM-A515": "Galaxy A51",
      "SM-A516": "Galaxy A51 5G",
      "SM-A715": "Galaxy A71",
      "SM-A716": "Galaxy A71 5G",
      "SM-A725": "Galaxy A72",
      "SM-A736": "Galaxy A73",
      // Galaxy M Series
      "SM-M146": "Galaxy M14",
      "SM-M156": "Galaxy M15",
      "SM-M236": "Galaxy M23",
      "SM-M346": "Galaxy M34",
      "SM-M556": "Galaxy M55",
      // Galaxy Note Series
      "SM-N986": "Galaxy Note 20 Ultra",
      "SM-N981": "Galaxy Note 20",
      "SM-N976": "Galaxy Note 10+",
      "SM-N971": "Galaxy Note 10",
      "SM-N960": "Galaxy Note 9",
      "SM-N950": "Galaxy Note 8",
      // Galaxy Z Fold/Flip
      "SM-F956": "Galaxy Z Fold 6",
      "SM-F946": "Galaxy Z Fold 5",
      "SM-F936": "Galaxy Z Fold 4",
      "SM-F926": "Galaxy Z Fold 3",
      "SM-F916": "Galaxy Z Fold 2",
      "SM-F900": "Galaxy Fold",
      "SM-F741": "Galaxy Z Flip 6",
      "SM-F731": "Galaxy Z Flip 5",
      "SM-F721": "Galaxy Z Flip 4",
      "SM-F711": "Galaxy Z Flip 3",
      "SM-F707": "Galaxy Z Flip 5G",
      "SM-F700": "Galaxy Z Flip",
      // Galaxy Tab Series
      "SM-X910": "Galaxy Tab S9 Ultra",
      "SM-X916": "Galaxy Tab S9+",
      "SM-X910": "Galaxy Tab S9",
      "SM-X810": "Galaxy Tab S8 Ultra",
      "SM-X806": "Galaxy Tab S8+",
      "SM-X700": "Galaxy Tab S8",
      // Older Models (GT series)
      "GT-I950": "Galaxy S4",
      "GT-I930": "Galaxy S3",
      "GT-I919": "Galaxy S4 Mini",
      "GT-I910": "Galaxy S2",
      "GT-I900": "Galaxy S",
      "GT-N800": "Galaxy Note 10.1",
      "GT-N710": "Galaxy Note 2",
      "GT-N700": "Galaxy Note",
      "GT-P310": "Galaxy Tab 2 7.0",
      "GT-P510": "Galaxy Tab 2 10.1",
    }
    
    // Tenta encontrar match exato ou parcial
    const upperCode = code.toUpperCase()
    
    // Match exato primeiro
    if (samsungModels[upperCode]) {
      return samsungModels[upperCode]
    }
    
    // Match parcial (código base sem a última letra)
    const baseCode = upperCode.replace(/[A-Z]$/, "")
    if (samsungModels[baseCode]) {
      return samsungModels[baseCode]
    }
    
    // Match por prefixo (primeiros 6 chars)
    const prefix6 = upperCode.substring(0, 6)
    for (const [modelCode, name] of Object.entries(samsungModels)) {
      if (modelCode.startsWith(prefix6)) {
        return name
      }
    }
    
    // Se não achou, retorna o código original
    return upperCode
  }

  // Extrai nome amigável do dispositivo do User Agent
  function parseDevice(userAgent: string): { device: string; os: string; browser: string; model?: string } {
    const ua = userAgent.toLowerCase()
    const uaOriginal = userAgent
    
    let device = "💻 Desktop"
    let os = "Sistema Desconhecido"
    let browser = "Navegador Desconhecido"
    let model: string | undefined
    
    // Detectar OS
    if (ua.includes("windows")) os = "Windows"
    else if (ua.includes("macintosh") || ua.includes("mac os")) os = "macOS"
    else if (ua.includes("linux")) os = "Linux"
    else if (ua.includes("android")) os = "Android"
    else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) os = "iOS"
    
    // Detectar dispositivo móvel com modelo
    if (ua.includes("iphone")) {
      device = "📱 iPhone"
      // Tentar extrair modelo do iPhone de várias formas
      // Alguns UAs podem ter hints sobre o modelo
      const modelMatch = uaOriginal.match(/iPhone\s*\(?([^)]+)\)?/i)
      if (modelMatch) {
        model = modelMatch[1]
      }
      // Tentar detectar por versão do iOS (aproximado)
      const iosMatch = ua.match(/cpu iphone os (\d+)[_\.]?(\d*)/)
      if (iosMatch) {
        const major = parseInt(iosMatch[1])
        const minor = iosMatch[2] ? parseInt(iosMatch[2]) : 0
        const iosVersion = `${major}.${minor || "x"}`
        
        // Heurística aproximada baseada na versão do iOS
        if (major >= 16) model = model || "iPhone 14/15 series (iOS 16+)"
        else if (major === 15) model = model || "iPhone 12/13 series (iOS 15)"
        else if (major === 14) model = model || "iPhone 11/12 series (iOS 14)"
        else if (major === 13) model = model || "iPhone XS/11 series (iOS 13)"
        else if (major <= 12) model = model || `iPhone (iOS ${iosVersion})`
      }
    }
    else if (ua.includes("ipad")) {
      device = "📱 iPad"
      const ipadMatch = uaOriginal.match(/iPad\s*\(?([^)]+)\)?/i)
      if (ipadMatch) model = ipadMatch[1]
    }
    else if (ua.includes("android")) {
      if (ua.includes("mobile")) device = "📱 Android"
      else device = "📱 Android Tablet"
      
      // Tentar extrair modelo - várias estratégias
      let samsungCode: string | undefined
      
      // Samsung - múltiplos padrões
      // Padrão 1: samsung-sm-g973b ou samsung sm-g973b
      const samsungMatch = ua.match(/samsung[-\s]?([^;)\s]+)/)
      if (samsungMatch) samsungCode = samsungMatch[1].toUpperCase()
      
      // Padrão 2: SM-G973B (formato padrão Samsung)
      if (!samsungCode) {
        const smMatch = ua.match(/(sm-[a-z]?\d{3}[a-z]?)/i)
        if (smMatch) samsungCode = smMatch[1].toUpperCase()
      }
      
      // Padrão 3: GT-I9500 (modelos antigos Galaxy)
      if (!samsungCode) {
        const gtMatch = ua.match(/(gt-[i|n|s]\d{4}[a-z]?)/i)
        if (gtMatch) samsungCode = gtMatch[1].toUpperCase()
      }
      
      // Padrão 4: SGH-T999 (modelos mais antigos)
      if (!samsungCode) {
        const sghMatch = ua.match(/(sgh-[a-z]\d{3,4})/i)
        if (sghMatch) samsungCode = sghMatch[1].toUpperCase()
      }
      
      // Padrão 5: SCG06 (modelos japoneses)
      if (!samsungCode) {
        const scgMatch = ua.match(/(sc[g|h|v]\d{2}[a-z]?)/i)
        if (scgMatch) samsungCode = scgMatch[1].toUpperCase()
      }
      
      // Converter código Samsung para nome amigável
      if (samsungCode) {
        model = getSamsungModelName(samsungCode)
      }
      
      // Xiaomi/Redmi/Poco
      const xiaomiMatch = ua.match(/xiaomi|redmi|poco/i)
      if (xiaomiMatch && !model) {
        const miMatch = ua.match(/(mi\s*\d+|redmi\s*[^;)\s]+|poco\s*[^;)\s]+)/i)
        if (miMatch) model = miMatch[1].toUpperCase()
      }
      
      // Motorola
      const motoMatch = ua.match(/motorola|mot-|moto/i)
      if (motoMatch && !model) {
        const modelExtract = ua.match(/(moto\s*[^;)\s]+|xt\d+|moto\s*g\d*)/i)
        if (modelExtract) model = modelExtract[1].toUpperCase()
      }
      
      // LG
      const lgMatch = ua.match(/lg[-\s]?([^;)\s]+)/i)
      if (lgMatch && !model) model = lgMatch[1].toUpperCase()
      
      // OnePlus
      const oneplusMatch = ua.match(/oneplus\s*([^;)\s]+)/i)
      if (oneplusMatch && !model) model = "ONEPLUS " + oneplusMatch[1]
      
      // Google Pixel
      const pixelMatch = ua.match(/pixel\s*(\d*[a-z]*)/i)
      if (pixelMatch && !model) model = "PIXEL " + pixelMatch[1].toUpperCase()
      
      // Huawei
      const huaweiMatch = ua.match(/huawei|honor/i)
      if (huaweiMatch && !model) {
        const hwModel = ua.match(/(ane|bnd|clt|ele|eml|evr|hlk|hma|ine|jkm|jsn|lld|lya|mar|par|sea|spn|sne|tah|vce|vog|vtr|wkg)/i)
        if (hwModel) model = "HUAWEI " + hwModel[1].toUpperCase()
      }
      
      // Generic Android device model from Build/
      const buildMatch = ua.match(/build\/([^;)\s]+)/i)
      if (buildMatch && !model) {
        // Filtrar nomes genéricos
        const buildModel = buildMatch[1]
        if (!buildModel.match(/^(android|sdk|generic|unknown)/i)) {
          model = buildModel.toUpperCase()
        }
      }
    }
    else if (ua.includes("windows phone")) device = "📱 Windows Phone"
    else if (ua.includes("blackberry")) device = "📱 BlackBerry"
    
    // Detectar navegador
    if (ua.includes("chrome") && !ua.includes("edg") && !ua.includes("opr")) browser = "Chrome"
    else if (ua.includes("firefox")) browser = "Firefox"
    else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari"
    else if (ua.includes("edg")) browser = "Edge"
    else if (ua.includes("opera") || ua.includes("opr")) browser = "Opera"
    
    return { device, os, browser, model }
  }

  // Gera link do Google Maps com coordenadas ou cidade
  function getMapLink(geo?: GeoData): string {
    if (!geo) return "#"
    if (geo.latitude && geo.longitude) {
      return `https://www.google.com/maps?q=${geo.latitude},${geo.longitude}`
    }
    if (geo.city) {
      return `https://www.google.com/maps/search/${encodeURIComponent(geo.city + " " + (geo.country || ""))}`
    }
    return "#"
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <DebugLight status={loading ? "loading" : error ? "error" : "idle"} message={error || (loading ? "Carregando..." : "Aguardando")} />
        <div className="w-full max-w-md bg-card border border-border rounded-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-serif">Painel Administrativo</h1>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            Digite a chave secreta para visualizar os IPs dos visitantes e comentários.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); fetchData(); }}>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Chave secreta..."
              className="w-full bg-input border border-border rounded-sm px-4 py-3 mb-4 focus:outline-none focus:ring-1 focus:ring-primary"
            />

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded p-3 mb-4">
                <p className="text-destructive text-sm font-medium">{error}</p>
                <p className="text-destructive/70 text-xs mt-1">
                  Cache: {new Date().toLocaleTimeString()} | 
                  <button 
                    onClick={() => { navigator.serviceWorker?.getRegistrations().then(r => r.forEach(s => s.unregister())); window.location.reload(); }}
                    className="underline ml-1 hover:text-destructive"
                  >
                    Limpar Cache
                  </button>
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !secret}
              className="w-full bg-primary text-primary-foreground"
            >
              {loading ? "Carregando..." : "Acessar"}
            </Button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <DebugLight status={loading ? "loading" : "success"} message={loading ? "Carregando dados..." : "Conectado"} />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-serif">Painel Administrativo</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Botão de Notificações PWA */}
            {isSupported && authenticated && (
              <>
                {isSubscribed ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={unsubscribe}
                    title="Desativar notificações"
                  >
                    <BellOff className="w-4 h-4 mr-2" />
                    Notificações
                  </Button>
                ) : permission === "granted" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={subscribe}
                    title="Ativar notificações push"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Ativar Push
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={subscribe}
                    title="Permitir notificações"
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    Instalar App
                  </Button>
                )}
                
                {isSubscribed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={testNotification}
                    title="Testar notificação"
                  >
                    <Bell className="w-4 h-4 text-green-500" />
                  </Button>
                )}
              </>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </header>

        {/* Stats */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card border border-border rounded-sm p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Users className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Visitantes</span>
              </div>
              <p className="text-2xl font-semibold">{data.stats.totalVisitors}</p>
            </div>
            <div className="bg-card border border-border rounded-sm p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Heart className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Likes</span>
              </div>
              <p className="text-2xl font-semibold">{data.stats.totalLikes}</p>
            </div>
            <div className="bg-card border border-border rounded-sm p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <HeartCrack className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Dislikes</span>
              </div>
              <p className="text-2xl font-semibold">{data.stats.totalDislikes}</p>
            </div>
            <div className="bg-card border border-border rounded-sm p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Comentários</span>
              </div>
              <p className="text-2xl font-semibold">{data.stats.totalComments}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border pb-4">
          {/* Comentários desabilitados temporariamente
          <Button
            variant={activeTab === "comments" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("comments")}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Comentários
          </Button>
          */}
          <Button
            variant={activeTab === "reactions" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("reactions")}
          >
            <Heart className="w-4 h-4 mr-2" />
            Reações
          </Button>
          <Button
            variant={activeTab === "visitors" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("visitors")}
          >
            <Eye className="w-4 h-4 mr-2" />
            Visitantes
          </Button>
        </div>

        {/* Content */}
        {data && (
          <div className="space-y-3">
            {/* Comentários desabilitados temporariamente
            {activeTab === "comments" && data.comments.map((comment) => (
              ...
            ))}
            */}

            {activeTab === "reactions" && data.reactions.map((reaction) => (
              <div key={reaction.id} className="bg-card border border-border rounded-sm p-4">
                <div className="flex items-center gap-4">
                  {reaction.reaction_type === "like" ? (
                    <Heart className="w-5 h-5 text-primary fill-primary" />
                  ) : (
                    <HeartCrack className="w-5 h-5 text-destructive" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
                      <span className="font-medium">IP:</span> {reaction.ip_address}
                      <button
                        onClick={() => openMap(reaction.geo, reaction.ip_address)}
                        className={`inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                          reaction.geo?.city?.includes("Desconhecido") || reaction.geo?.city?.includes("❓")
                            ? "bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30"
                            : reaction.geo?.city?.includes("Local/Rede")
                            ? "bg-gray-500/20 text-gray-500"
                            : "text-primary bg-primary/10 hover:bg-primary/20"
                        }`}
                      >
                        <MapPin className="w-3 h-3" />
                        {reaction.geo?.city 
                          ? `${reaction.geo.city}${reaction.geo.region ? `, ${reaction.geo.region}` : ""}` 
                          : "⏳ Buscando..."}
                      </button>
                    </p>
                    {(() => {
                      const device = parseDevice(reaction.user_agent || "")
                      return (
                        <p className="text-xs flex items-center gap-2 flex-wrap">
                          {device.model ? (
                            <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded font-bold text-xs">
                              {device.model}
                            </span>
                          ) : (
                            <span>{device.device}</span>
                          )}
                          <span className="text-muted-foreground">• {device.os} • {formatDate(reaction.created_at)}</span>
                        </p>
                      )
                    })()}
                  </div>
                </div>
              </div>
            ))}

            {activeTab === "visitors" && data.visitors.map((visitor) => (
              <div key={visitor.id} className="bg-card border border-border rounded-sm p-4">
                <div className="text-sm space-y-1">
                  <p className="flex items-center gap-1 flex-wrap">
                    <span className="font-medium text-muted-foreground">IP:</span> {visitor.ip_address}
                    <button
                      onClick={() => openMap(visitor.geo, visitor.ip_address)}
                      className={`inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                        visitor.geo?.city?.includes("Desconhecido") || visitor.geo?.city?.includes("❓")
                          ? "bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30"
                          : visitor.geo?.city?.includes("Local/Rede")
                          ? "bg-gray-500/20 text-gray-500"
                          : "text-primary bg-primary/10 hover:bg-primary/20"
                      }`}
                    >
                      <MapPin className="w-3 h-3" />
                      {visitor.geo?.city 
                        ? `${visitor.geo.city}${visitor.geo.region ? `, ${visitor.geo.region}` : ""}` 
                        : "⏳ Buscando..."}
                    </button>
                  </p>
                  {(() => {
                    const device = parseDevice(visitor.user_agent)
                    return (
                      <>
                        <p className="text-xs flex items-center gap-2 flex-wrap">
                          <span className="font-medium">📱</span>
                          {device.model ? (
                            <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded font-bold text-xs">
                              {device.model}
                            </span>
                          ) : (
                            <span className="text-primary">{device.device}</span>
                          )}
                          <span className="text-muted-foreground">• {device.os} • {device.browser}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground/40 truncate">{visitor.user_agent}</p>
                        <p className="text-xs text-muted-foreground/60">{formatDate(visitor.created_at)}</p>
                      </>
                    )
                  })()}
                </div>
              </div>
            ))}

            {activeTab === "reactions" && data.reactions.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhuma reação ainda.</p>
            )}
            {activeTab === "visitors" && data.visitors.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhum visitante ainda.</p>
            )}
          </div>
        )}
      </div>
      
      {/* Map Modal */}
      <MapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        geo={selectedGeo?.geo || null}
        ip={selectedGeo?.ip || ""}
      />
    </main>
  )
}
