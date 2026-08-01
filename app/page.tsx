"use client"

import { useCallback, useMemo, useState } from "react"
import { Header, type TabKey } from "@/components/tennis/header"
import { PreMatchTab } from "@/components/tennis/pre-match-tab"
import { LiveTab } from "@/components/tennis/live-tab"
import { ResultsTab } from "@/components/tennis/results-tab"
import { MatchDrawer } from "@/components/tennis/match-drawer"
import { MatchListSkeleton } from "@/components/tennis/match-skeleton"
import { EmptyState } from "@/components/tennis/empty-state"
import { useTennisData } from "@/hooks/use-tennis-data"
import { type Match, type Tournament, type SurfaceKey } from "@/lib/tennis-data"

function filterTournaments<T extends { p1: { name: string }; p2: { name: string } }>(
  tournaments: Tournament<T>[],
  query: string,
  surface: "all" | SurfaceKey,
): Tournament<T>[] {
  const q = query.trim().toLowerCase()
  return tournaments
    .filter((t) => surface === "all" || t.surface === surface)
    .map((t) => ({
      ...t,
      matches: q
        ? t.matches.filter((m) => m.p1.name.toLowerCase().includes(q) || m.p2.name.toLowerCase().includes(q))
        : t.matches,
    }))
    .filter((t) => t.matches.length > 0)
}

const EMPTY_FEED = {
  live: [] as Tournament<any>[],
  preMatch: [] as Tournament<any>[],
  results: [] as Tournament<any>[],
  aiAccuracy: { pct: 0, sample: 0 },
}

export default function Page() {
  const { feed, connection, error, refresh } = useTennisData()

  const [activeTab, setActiveTab] = useState<TabKey>("pre")
  const [activeDate, setActiveDate] = useState<string>("Өнөөдөр")
  const [query, setQuery] = useState("")
  const [surface, setSurface] = useState<"all" | SurfaceKey>("all")
  const [selected, setSelected] = useState<Match | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const live = feed?.live ?? EMPTY_FEED.live
  const preMatch = feed?.preMatch ?? EMPTY_FEED.preMatch
  const results = feed?.results ?? EMPTY_FEED.results
  const aiAccuracy = feed?.aiAccuracy ?? EMPTY_FEED.aiAccuracy

  const liveCount = useMemo(() => live.reduce((n, t) => n + t.matches.length, 0), [live])

  const filteredPre = useMemo(() => filterTournaments(preMatch, query, surface), [preMatch, query, surface])
  const filteredLive = useMemo(() => filterTournaments(live, query, surface), [live, query, surface])
  const filteredResults = useMemo(() => filterTournaments(results, query, surface), [results, query, surface])

  const loading = connection === "connecting"

  return (
    <div className="min-h-screen bg-background">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeDate={activeDate}
        onDateChange={setActiveDate}
        query={query}
        onQueryChange={setQuery}
        liveCount={liveCount}
        surface={surface}
        onSurfaceChange={setSurface}
        connection={connection}
        aiAccuracy={aiAccuracy}
      />

      <main className="mx-auto max-w-3xl px-4 py-4 pb-16">
        {error ? (
          <ApiErrorState onRetry={refresh} />
        ) : loading ? (
          <MatchListSkeleton groups={2} />
        ) : (
          <>
            {activeTab === "pre" && (
              <PreMatchTab
                tournaments={filteredPre}
                onSelect={setSelected}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
              />
            )}
            {activeTab === "live" && (
              <LiveTab
                tournaments={filteredLive}
                onSelect={setSelected}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
              />
            )}
            {activeTab === "results" && (
              <ResultsTab
                tournaments={filteredResults}
                onSelect={setSelected}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
              />
            )}
          </>
        )}
      </main>

      <MatchDrawer match={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function ApiErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <EmptyState message="API-тай холбогдоход алдаа гарлаа. Дахин оролдоно уу." />
      <button
        onClick={onRetry}
        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Дахин оролдох
      </button>
    </div>
  )
}
