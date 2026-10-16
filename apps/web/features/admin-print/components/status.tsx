import { cn } from "@workspace/ui/lib/utils"

import type { StatusTone } from "../types"

const DOT: Record<StatusTone, string> = {
  ok: "bg-olive",
  warn: "bg-gold",
  idle: "bg-transparent ring-[1.5px] ring-ash ring-inset",
}

export function Status({ tone, children, className }: { tone: StatusTone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap text-ink tabular-nums", className)}>
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", DOT[tone])} />
      {children}
    </span>
  )
}
