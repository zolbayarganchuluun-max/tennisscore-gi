/**
 * Tennis data access layer.
 *
 * This module is the single seam between the UI and whatever real tennis
 * feed you plug in later (RapidAPI "Tennis Live Data", Sportmonks, etc.).
 * The UI never imports the mock arrays directly anymore — it calls
 * `fetchTennisData()` / `fetchLiveData()` and receives already-normalised
 * `Match` / `LiveMatch` / `ResultMatch` objects.
 *
 * To go live:
 *   1. Implement `mapProviderResponse()` for your provider's JSON shape.
 *   2. Replace the mock bodies of the `fetch*` functions with real `fetch()`
 *      calls (ideally proxied through a Next.js route handler so the API key
 *      stays server-side), then run the result through `mapProviderResponse`.
 * The React hooks and every component keep working unchanged.
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
} from "./tennis-data"

/* --------------------------- PUBLIC RESPONSE TYPES ------------------------- */

export type ConnectionState = "connecting" | "connected" | "error"

// Normalised payload every screen consumes. Keep this stable — it is the
// contract the UI depends on regardless of which provider is behind it.
export type TennisFeed = {
  live: Tournament<LiveMatch>[]
  preMatch: Tournament<Match>[]
  results: Tournament<ResultMatch>[]
  aiAccuracy: { pct: number; sample: number }
  /** ISO timestamp of when the feed was produced, useful for "last updated" UI. */
  updatedAt: string
}

/* ----------------------- RAW PROVIDER RESPONSE TYPES ----------------------- */
/**
 * Loose shapes that mirror common tennis APIs. These intentionally use
 * `unknown`/optional fields so you can paste a real response in without the
 * compiler fighting you, then narrow inside `mapProviderResponse`.
 */
export type ProviderPlayer = {
  id?: string | number
  name: string
  country_code?: string
  ranking?: number
  seed?: number
  [key: string]: unknown
}

export type ProviderEvent = {
  id: string | number
  status?: string // "live" | "notstarted" | "finished" | provider-specific
  scheduled?: string
  surface?: string
  tournament?: string
  home: ProviderPlayer
  away: ProviderPlayer
  scores?: unknown
  odds?: { home?: number; away?: number }
  [key: string]: unknown
}

export type ProviderResponse = {
  events: ProviderEvent[]
  [key: string]: unknown
}

/* ------------------------------- ADAPTER ----------------------------------- */
/**
 * Turn a raw provider response into the normalised `TennisFeed`.
 *
 * Not yet implemented — while running on mock data this is never called.
 * When you wire a real API, fill this in (map surfaces, split events by
 * status into live / pre-match / results, group by tournament) and delete
 * the `throw`.
 */
export function mapProviderResponse(_raw: ProviderResponse): TennisFeed {
  throw new Error("mapProviderResponse: implement this for your tennis provider before going live.")
}

/* ------------------------------ MOCK BACKEND ------------------------------- */

const NETWORK_DELAY = 700 // ms — makes skeletons/loading states observable

function delay<T>(value: T, ms = NETWORK_DELAY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

/**
 * Fetch the full feed (pre-match, live, results).
 *
 * REAL API version would look roughly like:
 *   const res = await fetch("/api/tennis/feed")       // server route holds the key
 *   if (!res.ok) throw new Error("Feed request failed")
 *   return mapProviderResponse(await res.json())
 */
export async function fetchTennisData(): Promise<TennisFeed> {
  return delay({
    live: mockLiveMatches,
    preMatch: mockPreMatch,
    results: mockResults,
    aiAccuracy: mockAiAccuracy,
    updatedAt: new Date().toISOString(),
  })
}

/**
 * Fetch only the live board. Split out so the UI can poll live scores on a
 * tight interval without re-pulling pre-match/results.
 */
export async function fetchLiveData(): Promise<{ live: Tournament<LiveMatch>[]; updatedAt: string }> {
  return delay({ live: mockLiveMatches, updatedAt: new Date().toISOString() }, 500)
}
