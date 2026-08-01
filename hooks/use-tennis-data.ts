"use client"

import useSWR from "swr"
import { fetchTennisData, type ConnectionState, type TennisFeed } from "@/lib/tennis-api"

// How often to refresh the board. Live scores change fast, so we poll.
// When you move to a websocket feed, drop `refreshInterval` and push updates
// into the SWR cache with `mutate()` instead.
const REFRESH_INTERVAL = 15_000

export type UseTennisData = {
  feed: TennisFeed | undefined
  isLoading: boolean
  isValidating: boolean
  error: Error | undefined
  connection: ConnectionState
  /** Manually re-fetch (e.g. a "retry" button on the error state). */
  refresh: () => void
}

/**
 * Single source of truth for the dashboard. Wraps the data-access layer in
 * SWR so we get caching, revalidation, polling and de-duped requests for free.
 * Every screen reads from this hook — swapping the mock backend in
 * `lib/tennis-api.ts` for a real API requires zero changes here.
 */
export function useTennisData(): UseTennisData {
  const { data, error, isLoading, isValidating, mutate } = useSWR<TennisFeed, Error>(
    "tennis-feed",
    fetchTennisData,
    {
      refreshInterval: REFRESH_INTERVAL,
      revalidateOnFocus: true,
      keepPreviousData: true,
    },
  )

  const connection: ConnectionState = error ? "error" : isLoading && !data ? "connecting" : "connected"

  return {
    feed: data,
    isLoading,
    isValidating,
    error,
    connection,
    refresh: () => {
      void mutate()
    },
  }
}
