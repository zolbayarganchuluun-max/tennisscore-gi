"use client"

import { useCallback, useMemo, useState } from "react"
import { Header, type TabKey } from "@/components/tennis/header"
import { PreMatchTab } from "@/components/tennis/pre-match-tab"
import { LiveTab } from "@/components/tennis/live-tab"
import { ResultsTab } from "@/components/tennis/results-tab"
import { MatchDrawer } from "@/components/tennis/match-drawer"
import { preMatch, liveMatches, results, type Match, type Tournament, type SurfaceKey } from "@/lib/tennis-data"

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

export default function Page() {
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

  const liveCount = useMemo(() => liveMatches.reduce((n, t) => n + t.matches.length, 0), [])

  const filteredPre = useMemo(() => filterTournaments(preMatch, query, surface), [query, surface])
  const filteredLive = useMemo(() => filterTournaments(liveMatches, query, surface), [query, surface])
  const filteredResults = useMemo(() => filterTournaments(results, query, surface), [query, surface])

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
      />

      <main className="mx-auto max-w-3xl px-4 py-4 pb-16">
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
      </main>

      <MatchDrawer match={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
