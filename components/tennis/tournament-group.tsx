import { cn } from "@/lib/utils"
import { surfaceLabels, type SurfaceKey } from "@/lib/tennis-data"

const SURFACE_STYLE: Record<SurfaceKey, string> = {
  Grass: "bg-success/15 text-success",
  Hard: "bg-chart-4/20 text-[#8fb8ff]",
  Clay: "bg-chart-3/20 text-[#f0b978]",
}

export function TournamentGroup({
  name,
  surface,
  category,
  children,
}: {
  name: string
  surface: SurfaceKey
  category: string
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border bg-secondary/40 px-3 py-2">
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[10px] font-bold",
            category === "ATP" ? "bg-primary/15 text-primary" : "bg-chart-2/20 text-[#ff9aa8]",
          )}
        >
          {category}
        </span>
        <h2 className="flex-1 truncate text-sm font-semibold">{name}</h2>
        <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", SURFACE_STYLE[surface])}>
          {surfaceLabels[surface]}
        </span>
      </div>
      <div className="divide-y divide-border">{children}</div>
    </section>
  )
}
