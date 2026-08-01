"use client"

import { Sparkles } from "lucide-react"
import type { Match, Tournament } from "@/lib/tennis-data"
import { Flag } from "./flag"
import { TournamentGroup } from "./tournament-group"
import { EmptyState } from "./empty-state"
import { FavoriteStar } from "./favorite-star"

export function PreMatchTab({
  tournaments,
  onSelect,
  favorites,
  onToggleFavorite,
}: {
  tournaments: Tournament<Match>[]
  onSelect: (m: Match) => void
  favorites: Set<string>
  onToggleFavorite: (id: string) => void
}) {
  if (tournaments.length === 0) return <EmptyState message="Хайлтад тохирох тоглолт олдсонгүй." />

  return (
    <div className="space-y-3">
      {tournaments.map((t) => (
        <TournamentGroup key={t.id} name={t.name} surface={t.surface} category={t.category}>
          {t.matches.map((m) => (
            <PreMatchRow
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

function PreMatchRow({
  match,
  onSelect,
  favorite,
  onToggleFavorite,
}: {
  match: Match
  onSelect: () => void
  favorite: boolean
  onToggleFavorite: () => void
}) {
  const { p1, p2, odds, ai } = match
  const favouredP1 = ai.predictedWinner === p1.name

  return (
    <div className="group flex items-center gap-2 px-3 py-2.5 transition-colors hover:bg-secondary/40">
      <FavoriteStar active={favorite} onToggle={onToggleFavorite} label={`${p1.name} - ${p2.name}`} />

      <button onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className="w-10 shrink-0 text-center font-mono text-xs text-muted-foreground">{match.time}</span>

        <div className="min-w-0 flex-1 space-y-1">
          <PlayerLine name={p1.name} country={p1.country} favoured={favouredP1} />
          <PlayerLine name={p2.name} country={p2.country} favoured={!favouredP1} />
        </div>

        {/* Odds */}
        <div className="hidden shrink-0 flex-col gap-1 sm:flex">
          <OddsPill value={odds.p1} highlight={odds.p1 < odds.p2} />
          <OddsPill value={odds.p2} highlight={odds.p2 < odds.p1} />
        </div>

        {/* AI insight badge */}
        <span className="flex shrink-0 items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
          <Sparkles className="h-3 w-3" />
          {ai.winProbability}%
        </span>

        {/* View analysis affordance (row itself opens the drawer) */}
        <span className="hidden shrink-0 items-center rounded-md bg-secondary px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground md:inline-flex">
          Анализ харах
        </span>
      </button>
    </div>
  )
}

function PlayerLine({ name, country, favoured }: { name: string; country: string; favoured: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <Flag code={country} />
      <span className={favoured ? "text-sm font-semibold" : "text-sm text-muted-foreground"}>{name}</span>
      {favoured && <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-label="AI-ийн таамагласан ялагч" />}
    </div>
  )
}

function OddsPill({ value, highlight }: { value: number; highlight: boolean }) {
  return (
    <span
      className={
        "min-w-12 rounded px-2 py-0.5 text-center font-mono text-xs " +
        (highlight ? "bg-primary/15 font-semibold text-primary" : "bg-secondary text-muted-foreground")
      }
    >
      {value.toFixed(2)}
    </span>
  )
}
