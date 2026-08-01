"use client"

import { Search, ChevronLeft, ChevronRight, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { dateOptions, surfaceFilters, type SurfaceKey } from "@/lib/tennis-data"
import type { ConnectionState } from "@/lib/tennis-api"

export type TabKey = "pre" | "live" | "results"

const TABS: { key: TabKey; label: string }[] = [
  { key: "pre", label: "Эхлэх тоглолтууд" },
  { key: "live", label: "Шууд тоглолт" },
  { key: "results", label: "Дууссан тоглолтууд" },
]

export function Header({
  activeTab,
  onTabChange,
  activeDate,
  onDateChange,
  query,
  onQueryChange,
  liveCount,
  surface,
  onSurfaceChange,
  connection,
  aiAccuracy,
}: {
  activeTab: TabKey
  onTabChange: (t: TabKey) => void
  activeDate: string
  onDateChange: (d: string) => void
  query: string
  onQueryChange: (q: string) => void
  liveCount: number
  surface: "all" | SurfaceKey
  onSurfaceChange: (s: "all" | SurfaceKey) => void
  connection: ConnectionState
  aiAccuracy: { pct: number; sample: number }
}) {
  const dateIndex = dateOptions.indexOf(activeDate as (typeof dateOptions)[number])

  const shiftDate = (dir: -1 | 1) => {
    const next = dateIndex + dir
    if (next >= 0 && next < dateOptions.length) onDateChange(dateOptions[next])
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      {/* AI accuracy banner */}
      <div className="border-b border-border bg-primary/10">
        <div className="mx-auto flex max-w-3xl items-center justify-center gap-2 px-4 py-1.5 text-center">
          <Target className="h-3.5 w-3.5 shrink-0 text-primary" />
          <p className="text-[11px] font-medium text-foreground sm:text-xs">
            AI Таамаглалын оновч:{" "}
            {connection === "connecting" ? (
              <span className="inline-block h-3 w-10 animate-pulse rounded bg-primary/30 align-middle" />
            ) : (
              <>
                <span className="font-mono font-bold text-primary">{aiAccuracy.pct}%</span>{" "}
                <span className="text-muted-foreground">(Сүүлийн {aiAccuracy.sample} тоглолт)</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Top bar */}
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <TennisBallIcon className="h-4 w-4" />
          </span>
          <span className="text-base font-bold tracking-tight">
            TennisScore<span className="text-primary"> AI</span>
          </span>
          <ConnectionBadge connection={connection} />
        </div>

        <div className="relative w-40 sm:w-56">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Тоглогч хайх..."
            aria-label="Тоглогч хайх"
            className="h-8 w-full rounded-md border border-border bg-secondary/50 pl-8 pr-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60 focus:bg-secondary"
          />
        </div>
      </div>

      {/* Tabs */}
      <nav className="mx-auto flex max-w-3xl items-center gap-1 px-2 sm:px-4" aria-label="Хэсгүүд">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={cn(
              "relative flex items-center gap-1.5 px-2.5 py-2.5 text-[13px] font-medium transition-colors sm:px-3 sm:text-sm",
              activeTab === t.key ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="text-balance">{t.label}</span>
            {t.key === "live" && liveCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                {liveCount}
              </span>
            )}
            {activeTab === t.key && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </nav>

      {/* Surface filter pills */}
      <div className="border-t border-border bg-card/40">
        <div className="mx-auto flex max-w-3xl items-center gap-1.5 overflow-x-auto px-4 py-2">
          <span className="mr-1 shrink-0 text-[11px] font-medium text-muted-foreground">Талбай:</span>
          {surfaceFilters.map((s) => (
            <button
              key={s.key}
              onClick={() => onSurfaceChange(s.key)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                surface === s.key
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date selector */}
      <div className="border-t border-border bg-card/40">
        <div className="mx-auto flex max-w-3xl items-center justify-center gap-1 px-4 py-2">
          <button
            onClick={() => shiftDate(-1)}
            disabled={dateIndex <= 0}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Өмнөх өдөр"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {dateOptions.map((d) => (
            <button
              key={d}
              onClick={() => onDateChange(d)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                activeDate === d
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {d}
            </button>
          ))}
          <button
            onClick={() => shiftDate(1)}
            disabled={dateIndex >= dateOptions.length - 1}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Дараагийн өдөр"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}

function ConnectionBadge({ connection }: { connection: ConnectionState }) {
  const config = {
    connected: {
      label: "Live API холбогдсон",
      dot: "bg-success",
      text: "text-success",
      bg: "bg-success/10 border-success/30",
      pulse: true,
    },
    connecting: {
      label: "Холбогдож байна…",
      dot: "bg-chart-3",
      text: "text-chart-3",
      bg: "bg-chart-3/10 border-chart-3/30",
      pulse: true,
    },
    error: {
      label: "API холболт тасарсан",
      dot: "bg-destructive",
      text: "text-destructive",
      bg: "bg-destructive/10 border-destructive/30",
      pulse: false,
    },
  }[connection]

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "hidden items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold sm:inline-flex",
        config.bg,
        config.text,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot, config.pulse && "live-dot")} />
      {config.label}
    </span>
  )
}

function TennisBallIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M5 5c3 2.5 3 11.5 0 14M19 5c-3 2.5-3 11.5 0 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
