"use client"

import { useState, useEffect } from "react"
import { Eye, Heart, HeartCrack, MessageCircle, Users, Shield, RefreshCw, MapPin, Bell, BellOff, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNotifications } from "@/hooks/use-notifications"

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
  
  const { 
    isSupported, 
    permission, 
    isSubscribed, 
    subscribe, 
    unsubscribe, 
    testNotification 
  } = useNotifications()

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
                        <span className="inline-flex items-center gap-1 ml-2 text-primary bg-primary/10 px-2 py-0.5 rounded text-xs">
                          <MapPin className="w-3 h-3" />
                          {comment.geo?.city 
                            ? `${comment.geo.city}, ${comment.geo.region || comment.geo.country}` 
                            : "📍 Localizando..."}
                        </span>
                      </p>
                      <p><span className="font-medium">User Agent:</span> {comment.user_agent}</p>
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
                      <span className="inline-flex items-center gap-1 ml-2 text-primary bg-primary/10 px-2 py-0.5 rounded text-xs">
                        <MapPin className="w-3 h-3" />
                        {reaction.geo?.city 
                          ? `${reaction.geo.city}, ${reaction.geo.country || reaction.geo.region}` 
                          : "📍 Localizando..."}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      {formatDate(reaction.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {activeTab === "visitors" && data.visitors.map((visitor) => (
              <div key={visitor.id} className="bg-card border border-border rounded-sm p-4">
                <div className="text-sm space-y-1">
                  <p className="flex items-center gap-1 flex-wrap">
                    <span className="font-medium text-muted-foreground">IP:</span> {visitor.ip_address}
                    <span className="inline-flex items-center gap-1 ml-2 text-primary bg-primary/10 px-2 py-0.5 rounded text-xs">
                      <MapPin className="w-3 h-3" />
                      {visitor.geo?.city 
                        ? `${visitor.geo.city}, ${visitor.geo.region || visitor.geo.country}` 
                        : "📍 Localizando..."}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground/60 truncate">
                    <span className="font-medium">User Agent:</span> {visitor.user_agent}
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    {formatDate(visitor.created_at)}
                  </p>
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
    </main>
  )
}
