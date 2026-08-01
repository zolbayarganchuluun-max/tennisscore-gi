/**
 * Tennis data access layer.
 *
 * Single seam between the UI and the real feed. The UI calls
 * `fetchTennisData()` / `fetchLiveData()` and receives already-normalised
 * `Tournament<...>` objects grouped for the Live / Pre-match / Results tabs.
 *
 * Live provider: RapidAPI "Tennis API (ATP, WTA, ITF)" (MatchStat), proxied
 * through the server route `app/api/matches/route.ts` so the key stays private.
 * If the feed is unreachable or returns nothing, we transparently fall back to
 * the bundled mock data so the dashboard is never blank in the preview.
 */

import {
  preMatch as mockPreMatch,
  liveMatches as mockLiveMatches,
  results as mockResults,
  aiAccuracy as mockAiAccuracy,
  type Match,
  type LiveMatch,
  type ResultMatch,
  type Tournament,
  type Player,
  type SurfaceKey,
  type FormResult,
} from "./tennis-data"

/* --------------------------- PUBLIC RESPONSE TYPES ------------------------- */

export type ConnectionState = "connecting" | "connected" | "error"

export type TennisFeed = {
  live: Tournament<LiveMatch>[]
  preMatch: Tournament<Match>[]
  results: Tournament<ResultMatch>[]
  aiAccuracy: { pct: number; sample: number }
  updatedAt: string
  /** True when values came from the bundled mock fallback rather than the live API. */
  isMock?: boolean
}

/* ----------------------- RAW PROVIDER RESPONSE TYPES ----------------------- */
/**
 * Loose shapes mirroring the MatchStat feed. Fields are optional / permissive
 * on purpose — real rows vary by tour and match state, so `mapProviderResponse`
 * reads them through defensive getters rather than trusting a fixed schema.
 */
export type ProviderEvent = {
  id?: string | number
  status?: string
  scheduled?: string
  date?: string
  time?: string
  round?: string
  surface?: string
  court_surface?: string
  league?: string
  tournament?: string
  tour?: string
  tourType?: string
  // player names show up under several keys depending on endpoint
  participant1?: string
  participant2?: string
  home_player?: string
  away_player?: string
  player1?: string
  player2?: string
  score?: string
  points?: { p1?: string; p2?: string } | string
  indicator?: number | string // which player is serving
  odds?: { p1?: number; p2?: number; home?: number; away?: number }
  [key: string]: unknown
}

/** Shape returned by our own /api/matches route. */
export type MatchesApiResponse = {
  ok: boolean
  updatedAt?: string
  live?: unknown
  schedule?: unknown
  error?: string
  liveError?: string | null
  scheduleError?: string | null
}

export type ProviderResponse = MatchesApiResponse

/* ------------------------------- HELPERS ----------------------------------- */

function toArray(value: unknown): ProviderEvent[] {
  if (Array.isArray(value)) return value as ProviderEvent[]
  if (value && typeof value === "object") {
    // Some endpoints wrap rows under a data/results/events/matches key.
    for (const k of ["data", "results", "events", "matches", "fixtures"]) {
      const inner = (value as Record<string, unknown>)[k]
      if (Array.isArray(inner)) return inner as ProviderEvent[]
    }
  }
  return []
}

const first = (...vals: (string | undefined)[]) => vals.find((v) => v && v.trim().length > 0)?.trim()

function playerNames(e: ProviderEvent): [string, string] {
  const p1 = first(e.participant1, e.home_player, e.player1) ?? "Player 1"
  const p2 = first(e.participant2, e.away_player, e.player2) ?? "Player 2"
  return [p1, p2]
}

function normSurface(e: ProviderEvent): SurfaceKey {
  const s = (first(e.surface, e.court_surface) ?? "").toLowerCase()
  if (s.includes("clay")) return "Clay"
  if (s.includes("grass")) return "Grass"
  return "Hard"
}

function tourCategory(e: ProviderEvent): "ATP" | "WTA" {
  const t = (first(e.tour, e.tourType) ?? "").toLowerCase()
  return t === "wta" ? "WTA" : "ATP"
}

function eventStatus(e: ProviderEvent): "live" | "finished" | "upcoming" {
  const s = (e.status ?? "").toString().toLowerCase()
  if (/(inplay|live|in progress|playing)/.test(s)) return "live"
  if (/(finished|ended|complete|final|retired|walkover)/.test(s)) return "finished"
  return "upcoming"
}

/** Build a minimal-but-valid Player when the feed lacks deep stats. */
function stubPlayer(name: string, surface: SurfaceKey, rank: number): Player {
  const evenStats = { winRate: 50, yearRecord: { wins: 0, losses: 0 } }
  return {
    name,
    country: "—",
    rank,
    form: [] as FormResult[],
    formMatches: [],
    surfaceStats: { Hard: evenStats, Clay: evenStats, Grass: evenStats },
  }
}

/** Parse a MatchStat score string like "6-4,2-3" into set objects. */
function parseSets(score: string | undefined) {
  if (!score) return [] as { p1: number; p2: number }[]
  return score
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [a, b] = s.split("-").map((n) => Number.parseInt(n, 10))
      return { p1: Number.isFinite(a) ? a : 0, p2: Number.isFinite(b) ? b : 0 }
    })
}

function baseMatch(e: ProviderEvent, idx: number): Match {
  const surface = normSurface(e)
  const [n1, n2] = playerNames(e)
  const p1 = stubPlayer(n1, surface, 1)
  const p2 = stubPlayer(n2, surface, 2)
  const odds = {
    p1: e.odds?.p1 ?? e.odds?.home ?? 0,
    p2: e.odds?.p2 ?? e.odds?.away ?? 0,
  }
  const favouredP1 = odds.p1 > 0 && odds.p2 > 0 ? odds.p1 <= odds.p2 : true
  return {
    id: String(e.id ?? `m-${idx}`),
    time: first(e.time, e.scheduled, e.date) ?? "",
    surface,
    p1,
    p2,
    odds,
    h2h: { p1Wins: 0, p2Wins: 0, matches: [] },
    ai: {
      predictedWinner: favouredP1 ? n1 : n2,
      winProbability: 50,
      summary: "Live API-аас статистик татагдаж байна. H2H болон форм мэдээлэл шинэчлэгдэнэ.",
      keyFactors: ["Live өгөгдөл", "Статистик хүлээгдэж байна"],
    },
  }
}

/** Group flat matches into tournaments keyed by league name. */
function groupByTournament<T extends { surface: SurfaceKey }>(
  rows: { event: ProviderEvent; match: T }[],
  suffix: string,
): Tournament<T>[] {
  const map = new Map<string, Tournament<T>>()
  for (const { event, match } of rows) {
    const name = first(event.league, event.tournament) ?? "Тэмцээн"
    const category = tourCategory(event)
    const key = `${name}-${category}`
    if (!map.has(key)) {
      map.set(key, { id: `${key}-${suffix}`, name, surface: match.surface, category, matches: [] })
    }
    map.get(key)!.matches.push(match)
  }
  return Array.from(map.values())
}

/* ------------------------------- ADAPTER ----------------------------------- */

export function mapProviderResponse(raw: ProviderResponse): TennisFeed {
  const liveEvents = toArray(raw.live)
  const scheduleEvents = toArray(raw.schedule)

  const liveRows: { event: ProviderEvent; match: LiveMatch }[] = []
  const resultRows: { event: ProviderEvent; match: ResultMatch }[] = []
  const preRows: { event: ProviderEvent; match: Match }[] = []

  // Live endpoint can contain in-play, just-finished, and upcoming rows.
  liveEvents.forEach((e, i) => {
    const base = baseMatch(e, i)
    const sets = parseSets(typeof e.score === "string" ? e.score : undefined)
    const status = eventStatus(e)
    const server = (Number(e.indicator) === 2 ? 2 : 1) as 1 | 2
    const points = typeof e.points === "object" && e.points ? e.points : undefined

    if (status === "finished") {
      const p1Sets = sets.filter((s) => s.p1 > s.p2).length
      resultRows.push({
        event: e,
        match: { ...base, sets, winner: p1Sets >= sets.length - p1Sets ? 1 : 2, aiCorrect: false, duration: "" },
      })
    } else {
      liveRows.push({
        event: e,
        match: {
          ...base,
          server,
          currentSet: Math.max(1, sets.length),
          sets,
          gameScore: { p1: points?.p1 ?? "0", p2: points?.p2 ?? "0" },
          status: base.time ? `Live · ${base.time}` : "Live",
        },
      })
    }
  })

  // Fixtures endpoint = upcoming pre-match list.
  scheduleEvents.forEach((e, i) => {
    preRows.push({ event: e, match: baseMatch(e, i) })
  })

  const feed: TennisFeed = {
    live: groupByTournament(liveRows, "live"),
    results: groupByTournament(resultRows, "res"),
    preMatch: groupByTournament(preRows, "pm"),
    aiAccuracy: mockAiAccuracy,
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  }
  return feed
}

/* ------------------------------- FETCHERS ---------------------------------- */

const isEmpty = (f: TennisFeed) => !f.live.length && !f.preMatch.length && !f.results.length

function mockFeed(): TennisFeed {
  return {
    live: mockLiveMatches,
    preMatch: mockPreMatch,
    results: mockResults,
    aiAccuracy: mockAiAccuracy,
    updatedAt: new Date().toISOString(),
    isMock: true,
  }
}

async function getJson(url: string): Promise<MatchesApiResponse | null> {
  try {
    const res = await fetch(url, { cache: "no-store" })
    const json = (await res.json()) as MatchesApiResponse
    if (!res.ok || !json.ok) return null
    return json
  } catch {
    return null
  }
}

/**
 * Full feed for the dashboard. Hits the server route; if the live provider is
 * unavailable or returns nothing usable, falls back to mock data so the UI
 * still renders. `isMock` on the result lets the UI decide how to badge it.
 */
export async function fetchTennisData(): Promise<TennisFeed> {
  const json = await getJson("/api/matches")
  if (!json) return mockFeed()
  const feed = mapProviderResponse(json)
  return isEmpty(feed) ? mockFeed() : feed
}

/** Live board only, for tight polling. */
export async function fetchLiveData(): Promise<{ live: Tournament<LiveMatch>[]; updatedAt: string }> {
  const json = await getJson("/api/matches?type=live")
  if (!json) return { live: mockFeed().live, updatedAt: new Date().toISOString() }
  const feed = mapProviderResponse({ ok: true, live: json.live, updatedAt: json.updatedAt })
  return { live: feed.live.length ? feed.live : mockFeed().live, updatedAt: feed.updatedAt }
}
