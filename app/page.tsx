"use client"

import { useEffect } from "react"
import { LetterCard } from "@/components/letter-card"
import { Reactions } from "@/components/reactions"
// import { Comments } from "@/components/comments" // Oculto temporariamente

export default function Home() {
  useEffect(() => {
    fetch("/api/visitor", { method: "POST" }).catch(console.error)
  }, [])

  return (
    <main className="min-h-screen">
      <div className="relative px-6 py-16 md:py-24 lg:py-32">
        {/* Header minimalista */}
        <header className="max-w-2xl mx-auto text-center mb-16 md:mb-24 animate-fade-in">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-8">
            Uma carta aberta
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif text-foreground leading-tight tracking-tight text-balance">
            Carta de um
            <br />
            Homem Cansado
          </h1>
          <div className="mt-8 flex items-center justify-center gap-4">
            <span className="h-px w-16 bg-border" />
            <span className="text-xs text-muted-foreground tracking-widest">1 de outubro de 2025</span>
            <span className="h-px w-16 bg-border" />
          </div>
        </header>

        {/* Nota sobre o contexto */}
        <div
          className="max-w-2xl mx-auto mb-16 animate-fade-in opacity-0"
          style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
        >
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            Esta carta foi escrita há seis meses.
            <br />
            <span className="text-foreground/70"></span>
          </p>
        </div>

        {/* A Carta */}
        <div
          className="animate-fade-in opacity-0"
          style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}
        >
          <LetterCard />
        </div>

        {/* Divisor elegante */}
        <div className="max-w-2xl mx-auto my-16 md:my-24">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Reações */}
        <div
          className="max-w-2xl mx-auto animate-fade-in opacity-0"
          style={{ animationDelay: '0.9s', animationFillMode: 'forwards' }}
        >
          <p className="text-center text-sm text-muted-foreground mb-6 tracking-wide">
            Esta carta te tocou?
          </p>
          <Reactions />
        </div>

        {/* Comentários - ocultos temporariamente
        <div
          className="animate-fade-in opacity-0"
          style={{ animationDelay: '1.2s', animationFillMode: 'forwards' }}
        >
          <Comments />
        </div>
        */}

        {/* Footer minimalista */}
        <footer className="max-w-2xl mx-auto mt-24 md:mt-32 text-center">
          <div className="h-px w-24 mx-auto bg-border mb-8" />
          <p className="text-xs text-muted-foreground/60 tracking-wider">
            Nem todo amor vale o preço da sua paz.
          </p>
        </footer>
      </div>
    </main>
  )
}
