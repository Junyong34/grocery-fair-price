import { cn } from "@workspace/ui/lib/utils"

import type { StatusTone } from "../types"

const DOT: Record<StatusTone, string> = {
  ok: "bg-olive",
  warn: "bg-gold",
  idle: "bg-transparent ring-[1.5px] ring-ash ring-inset",
}

/** 상태 한 칸: 색 점과 진한 글자. 색은 점에만 준다. */
export function Status({ tone, children, className }: { tone: StatusTone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap text-ink tabular-nums", className)}>
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", DOT[tone])} />
      {children}
    </span>
  )
}
