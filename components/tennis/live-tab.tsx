"use client"

import { cn } from "@/lib/utils"
import type { LiveMatch, Tournament, SetScore } from "@/lib/tennis-data"
import { Flag } from "./flag"
import { TournamentGroup } from "./tournament-group"
import { EmptyState } from "./empty-state"
import { FavoriteStar } from "./favorite-star"

export function LiveTab({
  tournaments,
  onSelect,
  favorites,
  onToggleFavorite,
}: {
  tournaments: Tournament<LiveMatch>[]
  onSelect: (m: LiveMatch) => void
  favorites: Set<string>
  onToggleFavorite: (id: string) => void
}) {
  if (tournaments.length === 0) return <EmptyState message="Одоогоор шууд тоглолт алга. Дараа дахин шалгана уу." />

  return (
    <div className="space-y-3">
      {tournaments.map((t) => (
        <TournamentGroup key={t.id} name={t.name} surface={t.surface} category={t.category}>
          {t.matches.map((m) => (
            <LiveRow
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

function LiveRow({
  match,
  onSelect,
  favorite,
  onToggleFavorite,
}: {
  match: LiveMatch
  onSelect: () => void
  favorite: boolean
  onToggleFavorite: () => void
}) {
  const { p1, p2, sets, gameScore, server, status } = match
  const setCount = sets.length

  return (
    <div className="flex items-stretch gap-2 px-3 py-2.5 transition-colors hover:bg-secondary/40">
      <FavoriteStar active={favorite} onToggle={onToggleFavorite} label={`${p1.name} - ${p2.name}`} />

      <button onClick={onSelect} className="flex flex-1 items-stretch gap-3 text-left">
        {/* Live indicator */}
        <div className="flex w-9 shrink-0 flex-col items-center justify-center gap-1">
          <span className="live-dot h-2 w-2 rounded-full bg-destructive" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-destructive">Шууд</span>
        </div>

        {/* Players + score grid */}
        <div className="min-w-0 flex-1">
          <ScoreRow name={p1.name} country={p1.country} sets={sets} which="p1" game={gameScore.p1} serving={server === 1} />
          <div className="my-1 h-px bg-border" />
          <ScoreRow name={p2.name} country={p2.country} sets={sets} which="p2" game={gameScore.p2} serving={server === 2} />
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {status} · <span className="text-destructive">{setCount}-р сет</span>
          </p>
        </div>
      </button>
    </div>
  )
}

function ScoreRow({
  name,
  country,
  sets,
  which,
  game,
  serving,
}: {
  name: string
  country: string
  sets: SetScore[]
  which: "p1" | "p2"
  game: string
  serving: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-1.5 w-1.5 shrink-0 items-center justify-center">
        {serving && <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-label="Серв хийж байна" />}
      </span>
      <Flag code={country} />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>

      <div className="flex items-center gap-1.5">
        {sets.map((s, i) => {
          const val = which === "p1" ? s.p1 : s.p2
          const other = which === "p1" ? s.p2 : s.p1
          const tb = which === "p1" ? s.p1tb : s.p2tb
          const won = val > other
          return (
            <span
              key={i}
              className={cn(
                "relative w-5 text-center font-mono text-sm tabular-nums",
                won ? "font-bold text-foreground" : "text-muted-foreground",
              )}
            >
              {val}
              {typeof tb === "number" && <sup className="ml-px text-[8px] text-muted-foreground">{tb}</sup>}
            </span>
          )
        })}
        <span className="ml-1 w-7 rounded bg-destructive/15 text-center font-mono text-sm font-bold text-destructive tabular-nums">
          {game}
        </span>
      </div>
    </div>
  )
}
