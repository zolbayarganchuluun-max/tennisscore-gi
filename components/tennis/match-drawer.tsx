"use client"

import { useEffect } from "react"
import { X, Sparkles, TrendingUp, Trophy, ChartBar as BarChart3, Swords, CircleCheck as CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { surfaceLabels, type Match, type SurfaceKey, type FormEntry } from "@/lib/tennis-data"
import { Flag } from "./flag"
import { FormDots } from "./form-dots"

export function MatchDrawer({ match, onClose }: { match: Match | null; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    if (match) {
      document.addEventListener("keydown", onKey)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [match, onClose])

  const open = Boolean(match)

  return (
    <div className={cn("fixed inset-0 z-50", open ? "pointer-events-auto" : "pointer-events-none")}>
      <div
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Тоглолтын дэлгэрэнгүй"
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {match && <DrawerBody match={match} onClose={onClose} />}
      </aside>
    </div>
  )
}

function DrawerBody({ match, onClose }: { match: Match; onClose: () => void }) {
  const { p1, p2, ai, h2h, surface } = match
  const total = h2h.p1Wins + h2h.p2Wins
  const p1Pct = total ? (h2h.p1Wins / total) * 100 : 50
  const p2Pct = 100 - p1Pct

  const s1 = p1.surfaceStats[surface]
  const s2 = p2.surfaceStats[surface]

  return (
    <>
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Trophy className="h-4 w-4 text-primary" />
          Тоглолтын урьдчилсан харах
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Хаах"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
        {/* Matchup */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-lg border border-border bg-secondary/40 p-4">
          <PlayerBlock name={p1.name} country={p1.country} rank={p1.rank} odds={match.odds.p1} />
          <span className="text-center font-mono text-xs text-muted-foreground">vs</span>
          <PlayerBlock name={p2.name} country={p2.country} rank={p2.rank} odds={match.odds.p2} align="right" />
        </div>

        {/* Surface Performance Breakdown */}
        <section>
          <SectionHeader icon={<BarChart3 className="h-3.5 w-3.5" />} title="Талбайн гадаргуу дээрх үзүүлэлт" />
          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <div className="mb-3 flex items-center justify-center gap-2 text-xs">
              <span className="rounded-full bg-primary/15 px-2 py-0.5 font-semibold text-primary">
                {surfaceLabels[surface]} талбай
              </span>
            </div>

            {/* Win rate comparison */}
            <div className="space-y-3">
              <SurfaceWinRateRow name={p1.name} country={p1.country} winRate={s1.winRate} highlight={s1.winRate >= s2.winRate} />
              <SurfaceWinRateRow name={p2.name} country={p2.country} winRate={s2.winRate} highlight={s2.winRate > s1.winRate} />
            </div>

            {/* Combined bar */}
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                <span>Харьцуулалт</span>
                <span>{s1.winRate}% : {s2.winRate}%</span>
              </div>
              <div className="flex h-2.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full bg-primary" style={{ width: `${(s1.winRate / (s1.winRate + s2.winRate)) * 100}%` }} />
                <div className="h-full bg-muted-foreground/50" style={{ width: `${(s2.winRate / (s1.winRate + s2.winRate)) * 100}%` }} />
              </div>
            </div>

            {/* Year record */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <YearRecordCard name={p1.name} record={s1.yearRecord} surface={surface} />
              <YearRecordCard name={p2.name} record={s2.yearRecord} surface={surface} />
            </div>
          </div>
        </section>

        {/* AI Match Analysis */}
        <section className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/20">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </span>
            <h3 className="text-sm font-semibold text-primary">AI Тоглолтын зангилаа</h3>
          </div>

          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Таамагласан ялагч</p>
              <p className="flex items-center gap-1.5 text-lg font-bold">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {ai.predictedWinner}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Ялах магадлал</p>
              <p className="font-mono text-2xl font-bold text-primary">{ai.winProbability}%</p>
            </div>
          </div>

          <div className="mb-3 h-2.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${ai.winProbability}%` }} />
          </div>

          <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{ai.summary}</p>

          <ul className="space-y-2">
            {ai.keyFactors.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs">
                <TrendingUp className="mt-px h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Recent Form with surface tags */}
        <section>
          <SectionHeader icon={<TrendingUp className="h-3.5 w-3.5" />} title="Сүүлийн 5 тоглолт" />
          <div className="space-y-3 rounded-lg border border-border bg-secondary/30 p-3">
            <FormRowWithSurface name={p1.name} country={p1.country} formMatches={p1.formMatches} />
            <FormRowWithSurface name={p2.name} country={p2.country} formMatches={p2.formMatches} />
          </div>
        </section>

        {/* Head to Head */}
        <section>
          <SectionHeader icon={<Swords className="h-3.5 w-3.5" />} title="Хоорондын тулаан" />
          <div className="rounded-lg border border-border bg-secondary/30 p-3">
            <div className="mb-2 flex items-center justify-between text-sm font-semibold">
              <span className="text-primary">{h2h.p1Wins}</span>
              <span className="text-[11px] font-normal text-muted-foreground">{total} удаа тааралдсан</span>
              <span className="text-foreground">{h2h.p2Wins}</span>
            </div>

            {/* Visual H2H bar */}
            <div className="mb-1 flex items-center justify-between text-[10px] font-medium text-muted-foreground">
              <span>{p1.name}</span>
              <span>{p2.name}</span>
            </div>
            <div className="mb-3 flex h-2.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-primary transition-all" style={{ width: `${p1Pct}%` }} />
              <div className="h-full bg-muted-foreground/50 transition-all" style={{ width: `${p2Pct}%` }} />
            </div>
            <div className="mb-3 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span>{p1Pct.toFixed(0)}%</span>
              <span>{p2Pct.toFixed(0)}%</span>
            </div>

            {h2h.matches.length > 0 ? (
              <ul className="divide-y divide-border">
                {h2h.matches.map((m, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 py-2 text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {m.tournament} <span className="text-muted-foreground">· {m.round}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {m.year} · {surfaceLabels[m.surface]}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-medium text-success">{m.winner}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{m.score}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-2 text-center text-xs text-muted-foreground">Сүүлийн үеийн тулаан бүртгэгдээгүй.</p>
            )}
          </div>
        </section>
      </div>
    </>
  )
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary text-muted-foreground">{icon}</span>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
    </div>
  )
}

function PlayerBlock({
  name,
  country,
  rank,
  odds,
  align = "left",
}: {
  name: string
  country: string
  rank: number
  odds: number
  align?: "left" | "right"
}) {
  return (
    <div className={cn("min-w-0", align === "right" && "text-right")}>
      <div className={cn("mb-1 flex items-center gap-1.5", align === "right" && "flex-row-reverse")}>
        <Flag code={country} />
        <span className="truncate text-sm font-semibold">{name}</span>
      </div>
      <p className="text-[11px] text-muted-foreground">Байр #{rank}</p>
      <p className="mt-1 inline-block rounded bg-secondary px-1.5 py-0.5 font-mono text-xs font-semibold">{odds.toFixed(2)}</p>
    </div>
  )
}

function SurfaceWinRateRow({
  name,
  country,
  winRate,
  highlight,
}: {
  name: string
  country: string
  winRate: number
  highlight: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <Flag code={country} />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
          <div
            className={cn("h-full rounded-full", highlight ? "bg-primary" : "bg-muted-foreground/60")}
            style={{ width: `${winRate}%` }}
          />
        </div>
        <span className={cn("w-10 text-right font-mono text-sm font-bold", highlight ? "text-primary" : "text-foreground")}>
          {winRate}%
        </span>
      </div>
    </div>
  )
}

function YearRecordCard({
  name,
  record,
  surface,
}: {
  name: string
  record: { wins: number; losses: number }
  surface: SurfaceKey
}) {
  return (
    <div className="rounded-md border border-border bg-card/60 p-2.5">
      <p className="mb-1 truncate text-[11px] font-medium text-muted-foreground">{name}</p>
      <p className="text-[11px] text-muted-foreground">
        Энэ жил {surfaceLabels[surface]} талбайд:
      </p>
      <p className="mt-0.5 font-mono text-sm font-bold">
        <span className="text-success">{record.wins}Я</span>
        <span className="mx-1 text-muted-foreground">-</span>
        <span className="text-destructive">{record.losses}Х</span>
      </p>
    </div>
  )
}

function FormRowWithSurface({
  name,
  country,
  formMatches,
}: {
  name: string
  country: string
  formMatches: FormEntry[]
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Flag code={country} />
          <span className="text-sm">{name}</span>
        </div>
        <FormDots form={formMatches.map((m) => m.result)} />
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1 pl-6">
        {formMatches.map((m, i) => (
          <span
            key={i}
            className={cn(
              "rounded px-1.5 py-0.5 text-[9px] font-medium",
              m.result === "W" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
            )}
            title={`${m.opponent} — ${surfaceLabels[m.surface]}`}
          >
            {surfaceLabels[m.surface]}
          </span>
        ))}
      </div>
    </div>
  )
}
