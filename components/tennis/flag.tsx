import { cn } from "@/lib/utils"

// Simple, dependency-free "flag" chip that shows a country's 3-letter code.
// Keeps the UI clean and scannable without relying on emoji or external assets.
const COUNTRY_TINT: Record<string, string> = {
  ESP: "bg-[#c60b1e]/20 text-[#ff8a95]",
  USA: "bg-[#3c3b6e]/30 text-[#9aa0ff]",
  GER: "bg-[#ffce00]/15 text-[#ffe066]",
  POL: "bg-[#dc143c]/20 text-[#ff9aa8]",
  SRB: "bg-[#0c4076]/40 text-[#8fb8ff]",
  ITA: "bg-[#009246]/20 text-[#5fe0a0]",
  RUS: "bg-[#0039a6]/30 text-[#8fb8ff]",
  DEN: "bg-[#c8102e]/20 text-[#ff97a3]",
  BLR: "bg-[#009739]/20 text-[#5fe0a0]",
  KAZ: "bg-[#00afca]/20 text-[#7fe3f0]",
}

export function Flag({ code, className }: { code: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-4 w-6 shrink-0 items-center justify-center rounded-[3px] font-mono text-[9px] font-bold tracking-tight",
        COUNTRY_TINT[code] ?? "bg-muted text-muted-foreground",
        className,
      )}
      aria-label={code}
      title={code}
    >
      {code}
    </span>
  )
}
