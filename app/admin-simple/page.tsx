"use client"

import { useState } from "react"

export default function AdminSimplePage() {
  const [secret, setSecret] = useState("")
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function fetchData() {
    setLoading(true)
    setError("")
    
    try {
      const res = await fetch(`/api/admin?secret=${encodeURIComponent(secret)}`)
      const json = await res.json()
      
      if (!res.ok) {
        setError(json.error || "Erro " + res.status)
        return
      }
      
      setData(json)
    } catch (err: any) {
      setError("Erro: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!data) {
    return (
      <main style={{ padding: 20, fontFamily: "system-ui" }}>
        <h1>Admin Simples (Debug)</h1>
        <p>Versão sem PWA para teste</p>
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Senha"
          style={{ padding: 10, width: 200, marginRight: 10 }}
        />
        <button onClick={fetchData} disabled={loading} style={{ padding: 10 }}>
          {loading ? "Carregando..." : "Entrar"}
        </button>
        {error && (
          <div style={{ color: "red", marginTop: 10, padding: 10, background: "#fee" }}>
            <strong>ERRO:</strong> {error}
          </div>
        )}
      </main>
    )
  }

  return (
    <main style={{ padding: 20, fontFamily: "system-ui" }}>
      <h1>Admin Simples - OK!</h1>
      <p style={{ color: "green" }}>✅ Conectado com sucesso</p>
      <button onClick={() => setData(null)} style={{ padding: 10 }}>Sair</button>
      
      <h2>Resumo:</h2>
      <ul>
        <li>Visitantes: {data.stats.totalVisitors}</li>
        <li>Likes: {data.stats.totalLikes}</li>
        <li>Dislikes: {data.stats.totalDislikes}</li>
        <li>Comentários: {data.stats.totalComments}</li>
      </ul>
      
      <h2>Últimos Comentários:</h2>
      {data.comments.slice(0, 3).map((c: any) => (
        <div key={c.id} style={{ border: "1px solid #ccc", padding: 10, margin: "10px 0" }}>
          <p><strong>IP:</strong> {c.ip_address}</p>
          <p><strong>Local:</strong> {c.geo?.city || "N/A"}, {c.geo?.country || "N/A"}</p>
          <p>{c.content}</p>
        </div>
      ))}
    </main>
  )
}
