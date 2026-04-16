"use client"

import { useState, useEffect } from "react"
import { Send } from "lucide-react"

interface Comment {
  id: string
  content: string
  created_at: string
}

export function Comments() {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [])

  async function fetchComments() {
    setLoading(true)
    try {
      const res = await fetch("/api/comments")
      const data = await res.json()
      setComments(data.comments || [])
    } catch (error) {
      console.error("Erro ao buscar comentários:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim() || submitting) return

    setSubmitting(true)
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      })

      if (res.ok) {
        setNewComment("")
        await fetchComments()
      }
    } catch (error) {
      console.error("Erro ao enviar comentário:", error)
    } finally {
      setSubmitting(false)
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  return (
    <section className="max-w-2xl mx-auto mt-24">
      <div className="mb-12">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">
          Comentários
        </p>
        <p className="text-sm text-muted-foreground/60">
          Deixe sua mensagem de forma anônima
        </p>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="mb-16">
        <div className="relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escreva aqui..."
            maxLength={1000}
            rows={4}
            className="w-full bg-transparent border border-border p-6 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/50 resize-none font-serif leading-relaxed"
          />
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-muted-foreground/40">
              {newComment.length}/1000
            </span>
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="flex items-center gap-2 px-6 py-3 border border-border text-sm uppercase tracking-wider text-foreground/80 hover:bg-foreground hover:text-background transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span>Enviando...</span>
              ) : (
                <>
                  <span>Enviar</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Lista de comentários */}
      <div className="space-y-px">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-4 h-4 border border-foreground/30 border-t-foreground animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground/60 italic">
              Nenhum comentário ainda.
            </p>
            <p className="text-sm text-muted-foreground/40 mt-2">
              Seja o primeiro a deixar uma mensagem.
            </p>
          </div>
        ) : (
          comments.map((comment, index) => (
            <article
              key={comment.id}
              className="py-8 border-t border-border first:border-t-0"
            >
              <div className="flex items-baseline justify-between mb-4">
                <span className="text-xs text-muted-foreground/60 uppercase tracking-wider">
                  Anônimo #{comments.length - index}
                </span>
                <span className="text-xs text-muted-foreground/40">
                  {formatDate(comment.created_at)}
                </span>
              </div>
              <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {comment.content}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
