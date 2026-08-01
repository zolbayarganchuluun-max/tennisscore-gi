import { SearchX } from "lucide-react"

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/40 px-4 py-16 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
        <SearchX className="h-5 w-5 text-muted-foreground" />
      </span>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
