import type { Metadata } from 'next'
import { Playfair_Display, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif"
})

const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: "--font-mono"
})

export const metadata: Metadata = {
  title: 'Carta de um Homem Cansado',
  description: 'Uma carta aberta sobre o fim de um relacionamento. Escrita em outubro de 2025, dois meses antes do fim.',
  openGraph: {
    title: 'Carta de um Homem Cansado',
    description: 'Uma carta aberta sobre o fim de um relacionamento.',
    type: 'article',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="bg-background">
      <body className={`${playfair.variable} ${geistMono.variable} font-serif antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
