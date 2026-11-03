import { Badge, BadgeIndicator } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

import { VERDICT_WORD } from "@workspace/price/copy"
import type { Verdict } from "@workspace/price/types"

import { VERDICT_TONE } from "./verdict-tone"

/** 목록은 판정 단어만 표시한다. 최근 3 조사일의 편차 %는 기준 설명이 있는 상세에서 보여 준다. */
export function VerdictChip({
  verdict,
  className,
}: {
  verdict: Verdict
  className?: string
}) {
  const tone = VERDICT_TONE[verdict.kind]
  return (
    <Badge
      size="sm"
      className={cn("h-6 gap-1 px-2 text-xs", tone.wash, tone.ink, className)}
    >
      <BadgeIndicator className={cn("size-1.5", tone.fill)} />
      {VERDICT_WORD[verdict.kind]}
    </Badge>
  )
}

/** 판정 색 점 하나(최근 본 품종 알약, 집계 줄). */
export function VerdictDot({
  verdict,
  className,
}: {
  verdict: Verdict
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        VERDICT_TONE[verdict.kind].fill,
        className
      )}
    />
  )
}
