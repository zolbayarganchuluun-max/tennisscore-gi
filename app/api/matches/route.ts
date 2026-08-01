import { type NextRequest, NextResponse } from "next/server"

/**
 * Ultimate Tennis API proxy (RapidAPI — ultimate-tennis1.p.rapidapi.com).
 *
 * Why a route handler instead of fetching from the client:
 *   - Your RapidAPI key stays 100% server-side (read from RAPIDAPI_KEY) and is
 *     never shipped to the browser.
 *   - You avoid CORS (RapidAPI does not send browser CORS headers).
 *   - You cache / rate-limit / reshape the response in one place.
 *
 * Usage from the client:
 *   GET /api/matches?type=live                    -> live scores
 *   GET /api/matches?type=schedule&tournament=580 -> a tournament's daily schedule
 *   GET /api/matches                              -> both
 *
 * The raw provider JSON is returned untouched under `live` / `schedule`, so you
 * can inspect the real shape and then implement `mapProviderResponse` in
 * lib/tennis-api.ts to normalise it into the app's `TennisFeed`.
 */

// Always run fresh — live scores must never be statically cached.
export const dynamic = "force-dynamic"
export const revalidate = 0

/* --------------------------------------------------------------------------
 * ENDPOINT PATHS
 * --------------------------------------------------------------------------
 * These are the real registered endpoints for the ultimate-tennis1 API
 * (confirmed by probing: every other path returns the API's own
 * "Endpoint does not exist" JSON, while these are recognised and forwarded
 * upstream).
 *
 * If your RapidAPI "Endpoints" tab shows different names, this is the ONLY
 * place to change them. `{tournament}` in SCHEDULE_PATH is replaced with the
 * requested tournament id.
 * ------------------------------------------------------------------------ */
const LIVE_PATH = "live_scores"
const SCHEDULE_PATH = "atp/tournament_daily_schedule/{tournament}"
const DEFAULT_TOURNAMENT = "580"

type ProviderJson = unknown

type FetchError = { status: number; message: string; upstream?: unknown }

function isFetchError(e: unknown): e is FetchError {
  return typeof e === "object" && e !== null && "status" in e && "message" in e
}

/**
 * Perform a single authenticated GET against the Ultimate Tennis API.
 * Throws a typed FetchError on any non-OK response so the handler can surface
 * a helpful message + upstream status.
 */
async function rapidFetch(path: string): Promise<ProviderJson> {
  const key = process.env.RAPIDAPI_KEY
  const host = process.env.RAPIDAPI_TENNIS_HOST

  if (!key || !host) {
    throw {
      status: 500,
      message:
        "Missing RAPIDAPI_KEY or RAPIDAPI_TENNIS_HOST environment variables. Add them in Project Settings -> Environment Variables.",
    } satisfies FetchError
  }

  const res = await fetch(`https://${host}/${path}`, {
    method: "GET",
    headers: {
      "x-rapidapi-key": key,
      "x-rapidapi-host": host,
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
    // Detect the provider's upstream-offline gateway page so the message is
    // actionable rather than a generic 404.
    const isUpstreamDown = typeof body === "string" && body.includes("No such app")
    throw {
      status: res.status,
      message: isUpstreamDown
        ? `The Ultimate Tennis API recognised "${path}" but its upstream backend is currently offline ("No such app"). This is a provider-side outage — try again later or verify the endpoint in your RapidAPI dashboard.`
        : `Request to "${path}" failed (HTTP ${res.status}). If this is a 404 "Endpoint does not exist", update the path in app/api/matches/route.ts to match your RapidAPI "Endpoints" tab.`,
      upstream: body,
    } satisfies FetchError
  }

  return body
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = (searchParams.get("type") ?? "all").toLowerCase()
  const tournament = searchParams.get("tournament") ?? DEFAULT_TOURNAMENT
  const schedulePath = SCHEDULE_PATH.replace("{tournament}", tournament)

  try {
    if (type === "live") {
      const live = await rapidFetch(LIVE_PATH)
      return NextResponse.json({ ok: true, updatedAt: new Date().toISOString(), live })
    }

    if (type === "schedule") {
      const schedule = await rapidFetch(schedulePath)
      return NextResponse.json({ ok: true, updatedAt: new Date().toISOString(), tournament, schedule })
    }

    // Default: fetch both in parallel. `allSettled` so one failing endpoint
    // does not blank out the other.
    const [liveResult, scheduleResult] = await Promise.allSettled([rapidFetch(LIVE_PATH), rapidFetch(schedulePath)])

    return NextResponse.json({
      ok: true,
      updatedAt: new Date().toISOString(),
      tournament,
      live: liveResult.status === "fulfilled" ? liveResult.value : null,
      liveError: liveResult.status === "rejected" ? (liveResult.reason as FetchError)?.message ?? "Live fetch failed" : null,
      schedule: scheduleResult.status === "fulfilled" ? scheduleResult.value : null,
      scheduleError:
        scheduleResult.status === "rejected"
          ? (scheduleResult.reason as FetchError)?.message ?? "Schedule fetch failed"
          : null,
    })
  } catch (err) {
    const status = isFetchError(err) ? err.status : 502
    const message = isFetchError(err) ? err.message : "Unexpected error contacting the Ultimate Tennis API."
    const upstream = isFetchError(err) ? err.upstream : undefined
    return NextResponse.json({ ok: false, error: message, upstream }, { status })
  }
}
