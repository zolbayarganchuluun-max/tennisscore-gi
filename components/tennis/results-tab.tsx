"use client"

import { cn } from "@/lib/utils"
import { Check, X, Clock } from "lucide-react"
import type { ResultMatch, Tournament, SetScore } from "@/lib/tennis-data"
import { Flag } from "./flag"
import { TournamentGroup } from "./tournament-group"
import { EmptyState } from "./empty-state"
import { FavoriteStar } from "./favorite-star"

export function ResultsTab({
  tournaments,
  onSelect,
  favorites,
  onToggleFavorite,
}: {
  tournaments: Tournament<ResultMatch>[]
  onSelect: (m: ResultMatch) => void
  favorites: Set<string>
  onToggleFavorite: (id: string) => void
}) {
  if (tournaments.length === 0) return <EmptyState message="Хайлтад тохирох дууссан тоглолт олдсонгүй." />

  return (
    <div className="space-y-3">
      {tournaments.map((t) => (
        <TournamentGroup key={t.id} name={t.name} surface={t.surface} category={t.category}>
          {t.matches.map((m) => (
            <ResultRow
              key={m.id}
              match={m}
              onSelect={() => onSelect(m)}
              favorite={favorites.has(m.id)}
              onToggleFavorite={() => onToggleFavorite(m.id)}
            />
          ))}
        </TournamentGroup>
      ))}
    </div>
  )
}

function ResultRow({
  match,
  onSelect,
  favorite,
  onToggleFavorite,
}: {
  match: ResultMatch
  onSelect: () => void
  favorite: boolean
  onToggleFavorite: () => void
}) {
  const { p1, p2, sets, winner, aiCorrect, duration } = match

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 transition-colors hover:bg-secondary/40">
      <FavoriteStar active={favorite} onToggle={onToggleFavorite} label={`${p1.name} - ${p2.name}`} />

      <button onClick={onSelect} className="flex flex-1 items-center gap-3 text-left">
        <div className="flex w-12 shrink-0 flex-col items-center gap-0.5 text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span className="text-[10px]">{duration}</span>
        </div>

        <div className="min-w-0 flex-1">
          <ScoreLine name={p1.name} country={p1.country} sets={sets} which="p1" isWinner={winner === 1} />
          <div className="my-1 h-px bg-border" />
          <ScoreLine name={p2.name} country={p2.country} sets={sets} which="p2" isWinner={winner === 2} />
        </div>

        {/* AI prediction status */}
        <span
          className={cn(
            "flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-bold sm:text-[11px]",
            aiCorrect ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
          )}
        >
          {aiCorrect ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          AI Таамаглал: {aiCorrect ? "ЗӨВ" : "БУРУУ"}
        </span>
      </button>
    </div>
  )
}

function ScoreLine({
  name,
  country,
  sets,
  which,
  isWinner,
}: {
  name: string
  country: string
  sets: SetScore[]
  which: "p1" | "p2"
  isWinner: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <Flag code={country} />
      <span className={cn("min-w-0 flex-1 truncate text-sm", isWinner ? "font-semibold" : "text-muted-foreground")}>
        {name}
      </span>
      {isWinner && <span className="text-[10px] font-bold text-primary">Я</span>}
      <div className="flex items-center gap-1.5">
        {sets.map((s, i) => {
          const val = which === "p1" ? s.p1 : s.p2
          const other = which === "p1" ? s.p2 : s.p1
          const tb = which === "p1" ? s.p1tb : s.p2tb
          const won = val > other
          return (
            <span
              key={i}
              className={cn("w-5 text-center font-mono text-sm tabular-nums", won ? "font-bold text-foreground" : "text-muted-foreground")}
            >
              {val}
              {typeof tb === "number" && <sup className="ml-px text-[8px] text-muted-foreground">{tb}</sup>}
            </span>
          )
        })}
      </div>
    </div>
  )
}
