"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

export function FavoriteStar({
  active,
  onToggle,
  label,
}: {
  active: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        // Row is clickable too — don't open the drawer when starring.
        e.stopPropagation()
        onToggle()
      }}
      aria-pressed={active}
      aria-label={active ? `${label} — дуртайгаас хасах` : `${label} — дуртай болгох`}
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors",
        active ? "text-primary hover:bg-primary/10" : "text-muted-foreground/50 hover:bg-secondary hover:text-foreground",
      )}
    >
      <Star className={cn("h-4 w-4", active && "fill-primary")} />
    </button>
  )
}
