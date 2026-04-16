import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin - Carta de um Homem Cansado",
  description: "Painel administrativo"
  // Removido: manifest, appleWebApp - estavam causando erro no iPhone
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
