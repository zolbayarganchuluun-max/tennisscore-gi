import { type NextRequest, NextResponse } from "next/server"

/**
 * Tennis API proxy — RapidAPI "Tennis API (ATP, WTA, ITF)" by MatchStat.
 * Host: tennis-api-atp-wta-itf.p.rapidapi.com   Base path: /tennis/v2/
 *
 * Why a route handler instead of fetching from the client:
 *   - Your RapidAPI key stays 100% server-side (read from RAPIDAPI_KEY) and is
 *     never shipped to the browser.
 *   - You avoid CORS (RapidAPI does not send browser CORS headers).
 *   - You cache / rate-limit / reshape the response in one place.
 *
 * Usage from the client:
 *   GET /api/matches?type=live                 -> live events (all live scores)
 *   GET /api/matches?type=schedule&tour=atp    -> today's fixtures for a tour
 *   GET /api/matches                           -> live + today's atp & wta fixtures
 *
 * The raw provider JSON is returned untouched under `live` / `schedule`, so you
 * can inspect the real shape and then implement `mapProviderResponse` in
 * lib/tennis-api.ts to normalise it into the app's `TennisFeed`.
 */

// Always run fresh — live scores must never be statically cached.
export const dynamic = "force-dynamic"
export const revalidate = 0

/* --------------------------------------------------------------------------
 * PROVIDER CONFIG  (documented at https://tennisapidoc.matchstat.com)
 * --------------------------------------------------------------------------
 * The host is public (not a secret), so it lives here as a constant. Only the
 * API key is read from the environment. To point the app at a different tour or
 * provider, edit the constants below — this is the single source of truth.
 * ------------------------------------------------------------------------ */
const HOST = "tennis-api-atp-wta-itf.p.rapidapi.com"
const BASE = "/tennis/v2"

/** All live events across every tour (extend/live API). */
const LIVE_PATH = `${BASE}/extend/api/events/live`
/** Today's fixtures for a given tour ("atp" | "wta"). */
const fixturesPath = (tour: string) => `${BASE}/${tour}/fixtures`

type Tour = "atp" | "wta"
const TOURS: Tour[] = ["atp", "wta"]
function normalizeTour(value: string | null): Tour {
  return value?.toLowerCase() === "wta" ? "wta" : "atp"
}

type ProviderJson = unknown
type FetchError = { status: number; message: string; upstream?: unknown }

function isFetchError(e: unknown): e is FetchError {
  return typeof e === "object" && e !== null && "status" in e && "message" in e
}

/**
 * Perform a single authenticated GET against the Tennis API. Throws a typed
 * FetchError on any non-OK response so the handler can surface a helpful
 * message + upstream status.
 */
async function rapidFetch(path: string): Promise<ProviderJson> {
  const key = process.env.RAPIDAPI_KEY
  if (!key) {
    throw {
      status: 500,
      message:
        "Missing RAPIDAPI_KEY environment variable. Add it in Project Settings -> Environment Variables.",
    } satisfies FetchError
  }

  const res = await fetch(`https://${HOST}${path}`, {
    method: "GET",
    headers: {
      "x-rapidapi-key": key,
      "x-rapidapi-host": HOST,
    },
    cache: "no-store",
  })

  const text = await res.text()

  // Try JSON; keep raw text if the provider returned HTML / plain text (common
  // for gateway error pages) so the debugging message stays useful.
  let body: unknown
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }

  if (!res.ok) {
    throw {
      status: res.status,
      message:
        res.status === 401 || res.status === 403
          ? `Authentication failed (HTTP ${res.status}). Check that RAPIDAPI_KEY is valid and subscribed to "Tennis API (ATP, WTA, ITF)" on RapidAPI.`
          : res.status === 429
            ? "Rate limit reached (HTTP 429) on your RapidAPI plan. Wait and retry, or upgrade the plan."
            : `Request to "${path}" failed (HTTP ${res.status}).`,
      upstream: body,
    } satisfies FetchError
  }

  return body
}

/** Fetch today's fixtures for both tours, tagging each row with its tour. */
async function fetchAllFixtures() {
  const results = await Promise.allSettled(TOURS.map((tour) => rapidFetch(fixturesPath(tour))))
  const fixtures: unknown[] = []
  const errors: string[] = []

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      const rows = Array.isArray(result.value) ? result.value : []
      for (const row of rows) {
        fixtures.push({ ...(row as object), tour: TOURS[i] })
      }
    } else {
      errors.push(`${TOURS[i]}: ${(result.reason as FetchError)?.message ?? "fixtures fetch failed"}`)
    }
  })

  return { fixtures, error: errors.length ? errors.join(" | ") : null }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = (searchParams.get("type") ?? "all").toLowerCase()
  const updatedAt = new Date().toISOString()

  try {
    if (type === "live") {
      const live = await rapidFetch(LIVE_PATH)
      return NextResponse.json({ ok: true, updatedAt, live })
    }

    if (type === "schedule") {
      // Single tour if ?tour= is provided, otherwise both.
      const tourParam = searchParams.get("tour")
      if (tourParam) {
        const tour = normalizeTour(tourParam)
        const schedule = await rapidFetch(fixturesPath(tour))
        return NextResponse.json({ ok: true, updatedAt, tour, schedule })
      }
      const { fixtures, error } = await fetchAllFixtures()
      return NextResponse.json({ ok: true, updatedAt, schedule: fixtures, scheduleError: error })
    }

    // Default: live + today's fixtures (both tours) in parallel. `allSettled`
    // so one failing endpoint does not blank out the other.
    const [liveResult, fixturesResult] = await Promise.allSettled([rapidFetch(LIVE_PATH), fetchAllFixtures()])

    return NextResponse.json({
      ok: true,
      updatedAt,
      live: liveResult.status === "fulfilled" ? liveResult.value : null,
      liveError:
        liveResult.status === "rejected" ? (liveResult.reason as FetchError)?.message ?? "Live fetch failed" : null,
      schedule: fixturesResult.status === "fulfilled" ? fixturesResult.value.fixtures : null,
      scheduleError:
        fixturesResult.status === "fulfilled"
          ? fixturesResult.value.error
          : (fixturesResult.reason as FetchError)?.message ?? "Schedule fetch failed",
    })
  } catch (err) {
    const status = isFetchError(err) ? err.status : 502
    const message = isFetchError(err) ? err.message : "Unexpected error contacting the Tennis API."
    const upstream = isFetchError(err) ? err.upstream : undefined
    return NextResponse.json({ ok: false, error: message, upstream }, { status })
  }
}
