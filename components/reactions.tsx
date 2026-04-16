"use client"

import { useState, useEffect } from "react"
import { Heart, ThumbsDown } from "lucide-react"

export function Reactions() {
  const [likes, setLikes] = useState(0)
  const [dislikes, setDislikes] = useState(0)
  const [userReaction, setUserReaction] = useState<"like" | "dislike" | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchReactions()
  }, [])

  async function fetchReactions() {
    try {
      const res = await fetch("/api/reactions")
      const data = await res.json()
      setLikes(data.likes)
      setDislikes(data.dislikes)
      setUserReaction(data.userReaction)
    } catch (error) {
      console.error("Erro ao buscar reações:", error)
    }
  }

  async function handleReaction(type: "like" | "dislike") {
    if (loading) return
    setLoading(true)

    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      })
      
      if (res.ok) {
        await fetchReactions()
      }
    } catch (error) {
      console.error("Erro ao reagir:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center gap-12">
      <button
        onClick={() => handleReaction("like")}
        disabled={loading}
        className={`group flex flex-col items-center gap-3 transition-all duration-300 ${
          loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <div className={`p-4 border transition-all duration-300 ${
          userReaction === "like"
            ? "border-foreground bg-foreground"
            : "border-border hover:border-foreground/50"
        }`}>
          <Heart
            className={`w-6 h-6 transition-all ${
              userReaction === "like" 
                ? "text-background fill-background" 
                : "text-foreground/60 group-hover:text-foreground"
            }`}
          />
        </div>
        <span className={`text-sm tabular-nums ${
          userReaction === "like" ? "text-foreground" : "text-muted-foreground"
        }`}>
          {likes}
        </span>
      </button>

      <div className="h-16 w-px bg-border" />

      <button
        onClick={() => handleReaction("dislike")}
        disabled={loading}
        className={`group flex flex-col items-center gap-3 transition-all duration-300 ${
          loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <div className={`p-4 border transition-all duration-300 ${
          userReaction === "dislike"
            ? "border-foreground bg-foreground"
            : "border-border hover:border-foreground/50"
        }`}>
          <ThumbsDown
            className={`w-6 h-6 transition-all ${
              userReaction === "dislike" 
                ? "text-background" 
                : "text-foreground/60 group-hover:text-foreground"
            }`}
          />
        </div>
        <span className={`text-sm tabular-nums ${
          userReaction === "dislike" ? "text-foreground" : "text-muted-foreground"
        }`}>
          {dislikes}
        </span>
      </button>
    </div>
  )
}
