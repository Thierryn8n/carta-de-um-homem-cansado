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
  const [activeTab, setActiveTab] = useState<"visitors" | "reactions" | "comments">("comments")
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
      // Samsung - múltiplos padrões
      // Padrão 1: samsung-sm-g973b ou samsung sm-g973b
      const samsungMatch = ua.match(/samsung[-\s]?([^;)\s]+)/)
      if (samsungMatch) model = samsungMatch[1].toUpperCase()
      
      // Padrão 2: SM-G973B (formato padrão Samsung)
      if (!model) {
        const smMatch = ua.match(/(sm-[a-z]?\d{3}[a-z]?)/i)
        if (smMatch) model = smMatch[1].toUpperCase()
      }
      
      // Padrão 3: GT-I9500 (modelos antigos Galaxy)
      if (!model) {
        const gtMatch = ua.match(/(gt-[i|n|s]\d{4}[a-z]?)/i)
        if (gtMatch) model = gtMatch[1].toUpperCase()
      }
      
      // Padrão 4: SGH-T999 (modelos mais antigos)
      if (!model) {
        const sghMatch = ua.match(/(sgh-[a-z]\d{3,4})/i)
        if (sghMatch) model = sghMatch[1].toUpperCase()
      }
      
      // Padrão 5: SCG06 (modelos japoneses)
      if (!model) {
        const scgMatch = ua.match(/(sc[g|h|v]\d{2}[a-z]?)/i)
        if (scgMatch) model = scgMatch[1].toUpperCase()
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
          <Button
            variant={activeTab === "comments" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("comments")}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Comentários
          </Button>
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
            {activeTab === "comments" && data.comments.map((comment) => (
              <div key={comment.id} className="bg-card border border-border rounded-sm p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-foreground mb-2">{comment.content}</p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="flex items-center gap-1 flex-wrap">
                        <span className="font-medium">IP:</span> {comment.ip_address}
                        <button
                          onClick={() => openMap(comment.geo, comment.ip_address)}
                          className={`inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                            comment.geo?.city?.includes("Desconhecido") || comment.geo?.city?.includes("❓")
                              ? "bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30"
                              : comment.geo?.city?.includes("Local/Rede")
                              ? "bg-gray-500/20 text-gray-500"
                              : "text-primary bg-primary/10 hover:bg-primary/20"
                          }`}
                        >
                          <MapPin className="w-3 h-3" />
                          {comment.geo?.city 
                            ? `${comment.geo.city}${comment.geo.region ? `, ${comment.geo.region}` : ""}` 
                            : "⏳ Buscando..."}
                        </button>
                      </p>
                      {(() => {
                        const device = parseDevice(comment.user_agent)
                        return (
                          <>
                            <p className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">📱 Dispositivo:</span>
                              <span className="text-primary">{device.device}</span>
                              {device.model && (
                                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs font-medium">
                                  {device.model}
                                </span>
                              )}
                              <span className="text-muted-foreground">({device.os} • {device.browser})</span>
                            </p>
                            <p className="text-muted-foreground/50 truncate text-[10px]">{comment.user_agent}</p>
                          </>
                        )
                      })()}
                      <p><span className="font-medium">Data:</span> {formatDate(comment.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

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
                        <p className="text-xs text-muted-foreground/60">
                          {device.device} {device.model && `(${device.model})`} • {device.os} • {formatDate(reaction.created_at)}
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
                          <span className="font-medium">📱 Dispositivo:</span>
                          <span className="text-primary">{device.device}</span>
                          {device.model && (
                            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] font-medium">
                              {device.model}
                            </span>
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

            {activeTab === "comments" && data.comments.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhum comentário ainda.</p>
            )}
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
