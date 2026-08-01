import { cn } from "@/lib/utils"
import type { FormResult } from "@/lib/tennis-data"

export function FormDots({ form, className }: { form: FormResult[]; className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)} aria-label="Сүүлийн үзүүлэлт">
      {form.map((r, i) => (
        <span
          key={i}
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold",
            r === "W"
              ? "bg-success/20 text-success"
              : "bg-destructive/20 text-destructive",
          )}
          title={r === "W" ? "Ялалт" : "Ялагдал"}
        >
          {r}
        </span>
      ))}
    </div>
  )
}
