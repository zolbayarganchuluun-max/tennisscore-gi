// Loading placeholders shown while the tennis feed is being fetched.
// Mirrors the shape of TournamentGroup + match rows so the layout doesn't
// jump when real data arrives.

function Shimmer({ className = "" }: { className?: string }) {
  return <span className={`block animate-pulse rounded bg-secondary ${className}`} />
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <Shimmer className="h-7 w-7 shrink-0 rounded-md" />
      <Shimmer className="h-4 w-10 shrink-0" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-1.5">
          <Shimmer className="h-4 w-6 rounded-[3px]" />
          <Shimmer className="h-3.5 w-28" />
        </div>
        <div className="flex items-center gap-1.5">
          <Shimmer className="h-4 w-6 rounded-[3px]" />
          <Shimmer className="h-3.5 w-24" />
        </div>
      </div>
      <Shimmer className="h-6 w-12 shrink-0 rounded-md" />
    </div>
  )
}

function SkeletonGroup({ rows = 2 }: { rows?: number }) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border bg-secondary/40 px-3 py-2">
        <Shimmer className="h-4 w-8 rounded" />
        <Shimmer className="h-4 w-40 rounded" />
        <span className="flex-1" />
        <Shimmer className="h-4 w-12 rounded" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </section>
  )
}

export function MatchListSkeleton({ groups = 2 }: { groups?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Тоглолтын мэдээлэл ачааллаж байна">
      <span className="sr-only">Ачааллаж байна…</span>
      {Array.from({ length: groups }).map((_, i) => (
        <SkeletonGroup key={i} rows={i === 0 ? 2 : 1} />
      ))}
    </div>
  )
}
