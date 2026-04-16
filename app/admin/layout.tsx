import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: "Admin - Carta de um Homem Cansado",
  description: "Painel administrativo PWA",
  manifest: "/admin-manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Admin Carta"
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192" },
      { url: "/icon-512x512.png", sizes: "512x512" }
    ],
    apple: [
      { url: "/icon-192x192.png", sizes: "192x192" }
    ]
  }
}

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
  width: "device-width",
  initialScale: 1
  // Removido: maximumScale, userScalable, viewportFit - causam problemas no iPhone
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/admin-manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Admin Carta" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>{children}</body>
    </html>
  )
}
