"use client"

import { useState, useEffect } from "react"

export default function TesteNotificacao() {
  const [status, setStatus] = useState("Verificando...")
  const [permissao, setPermissao] = useState<NotificationPermission>("default")

  useEffect(() => {
    if (typeof window === "undefined") return
    
    const supported = "Notification" in window
    const swSupported = "serviceWorker" in navigator
    
    setStatus(`Notificações: ${supported ? "✅ Suportado" : "❌ Não suportado"} | Service Worker: ${swSupported ? "✅ Suportado" : "❌ Não suportado"}`)
    setPermissao(Notification.permission)
  }, [])

  async function solicitarPermissao() {
    const result = await Notification.requestPermission()
    setPermissao(result)
    setStatus(`Permissão: ${result}`)
    
    if (result === "granted") {
      // Mostra notificação imediata
      new Notification("✅ Permissão concedida!", {
        body: "As notificações estão funcionando",
        icon: "/icon-192x192.png"
      })
    }
  }

  function testarNotificacao() {
    if (permissao !== "granted") {
      alert("Primeiro clique em 'Solicitar Permissão'")
      return
    }
    
    new Notification("📱 Teste de Notificação", {
      body: `Hora: ${new Date().toLocaleTimeString()}`,
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      tag: "teste",
      requireInteraction: true
    })
  }

  return (
    <main style={{ padding: 20, fontFamily: "system-ui" }}>
      <h1>🧪 Teste de Notificação</h1>
      <p style={{ color: "#666", margin: "10px 0" }}>{status}</p>
      <p>Permissão atual: <strong>{permissao}</strong></p>
      
      <div style={{ marginTop: 20 }}>
        <button 
          onClick={solicitarPermissao}
          style={{ 
            padding: "15px 30px", 
            fontSize: 16, 
            marginRight: 10,
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: 5,
            cursor: "pointer"
          }}
        >
          1️⃣ Solicitar Permissão
        </button>
        
        <button 
          onClick={testarNotificacao}
          style={{ 
            padding: "15px 30px", 
            fontSize: 16,
            background: permissao === "granted" ? "#28a745" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: 5,
            cursor: permissao === "granted" ? "pointer" : "not-allowed"
          }}
          disabled={permissao !== "granted"}
        >
          2️⃣ Testar Notificação
        </button>
      </div>
      
      <div style={{ marginTop: 30, padding: 15, background: "#f5f5f5", borderRadius: 5 }}>
        <h3>Instruções:</h3>
        <ol>
          <li>Clique em "Solicitar Permissão"</li>
          <li>Aceite quando o navegador perguntar</li>
          <li>Clique em "Testar Notificação"</li>
          <li>A notificação deve aparecer mesmo com a página fechada!</li>
        </ol>
      </div>
    </main>
  )
}
