"use client"

import { useState, useEffect, useCallback } from "react"

interface NotificationState {
  isSupported: boolean
  permission: NotificationPermission | "default"
  subscription: PushSubscription | null
  isSubscribed: boolean
}

export function useNotifications() {
  const [state, setState] = useState<NotificationState>({
    isSupported: false,
    permission: "default",
    subscription: null,
    isSubscribed: false
  })

  // Verifica suporte
  useEffect(() => {
    if (typeof window === "undefined") return

    const isSupported = "serviceWorker" in navigator && "PushManager" in window
    setState(prev => ({
      ...prev,
      isSupported,
      permission: Notification.permission
    }))
  }, [])

  // Registra service worker
  const registerSW = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return null

    try {
      const registration = await navigator.serviceWorker.register("/admin-sw.js", {
        scope: "/admin"
      })
      console.log("SW registrado:", registration)
      return registration
    } catch (error) {
      console.error("Erro ao registrar SW:", error)
      return null
    }
  }, [])

  // Solicita permissão e se inscreve
  const subscribe = useCallback(async () => {
    if (!state.isSupported) {
      alert("Seu navegador não suporta notificações push")
      return false
    }

    try {
      // Solicita permissão
      const permission = await Notification.requestPermission()
      setState(prev => ({ ...prev, permission }))

      if (permission !== "granted") {
        alert("Permissão de notificação negada")
        return false
      }

      // Registra SW
      const registration = await registerSW()
      if (!registration) return false

      // Espera o SW estar ativo
      await navigator.serviceWorker.ready

      // Cria/verifica subscription
      let subscription = await registration.pushManager.getSubscription()
      
      if (!subscription) {
        // Chave pública VAPID (gerar em https://vapidkeys.com)
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
          "BEl62iSMgFc8ShyTQnGnwgGcp4k7HuEO3Zd8fQLTB45y6U7xZ6K8OvLyGJ8X3F8E8T9K2L5M7N8P9Q0R1S2T3U"
        
        const convertedKey = urlBase64ToUint8Array(vapidPublicKey)
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey
        })
      }

      setState(prev => ({
        ...prev,
        subscription,
        isSubscribed: true
      }))

      // Salva subscription no servidor
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription)
      })

      return true
    } catch (error) {
      console.error("Erro ao inscrever:", error)
      return false
    }
  }, [state.isSupported, registerSW])

  // Cancela inscrição
  const unsubscribe = useCallback(async () => {
    if (!state.subscription) return

    try {
      await state.subscription.unsubscribe()
      
      // Remove do servidor
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: state.subscription.endpoint })
      })

      setState(prev => ({
        ...prev,
        subscription: null,
        isSubscribed: false
      }))
    } catch (error) {
      console.error("Erro ao cancelar:", error)
    }
  }, [state.subscription])

  // Testa notificação local
  const testNotification = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return

    const registration = await navigator.serviceWorker.ready
    registration.showNotification("✅ Teste de Notificação", {
      body: "Notificações estão funcionando!",
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png"
    })
  }, [])

  return {
    ...state,
    subscribe,
    unsubscribe,
    testNotification
  }
}

// Helper para converter chave VAPID
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  
  return outputArray
}
