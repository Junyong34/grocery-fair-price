import { Badge, BadgeIndicator } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

import { verdictChip } from "@workspace/price/copy"
import type { Verdict } from "@workspace/price/types"

import { VERDICT_TONE } from "./verdict-tone"

/** 목록의 판정 칩: "보통 +8%". 평소가가 없으면 회색 "판정 전". */
export function VerdictChip({ verdict, className }: { verdict: Verdict; className?: string }) {
  const tone = VERDICT_TONE[verdict.kind]
  return (
    <Badge size="sm" className={cn("gap-1 px-2 tabular-nums", tone.wash, tone.ink, className)}>
      <BadgeIndicator className={cn("size-1.5", tone.fill)} />
      {verdictChip(verdict)}
    </Badge>
  )
}

/** 판정 색 점 하나(최근 본 품종 알약, 집계 줄). */
export function VerdictDot({ verdict, className }: { verdict: Verdict; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2 shrink-0 rounded-full", VERDICT_TONE[verdict.kind].fill, className)} />
}
