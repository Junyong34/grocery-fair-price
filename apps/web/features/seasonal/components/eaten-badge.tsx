"use client"

import { Suspense } from "react"

import { cn } from "@workspace/ui/lib/utils"

import { useIsEaten } from "@/shared/eaten-store"
import { useToday } from "@/shared/today-context"

/**
 * 먹음 배지 ✓(명세 2.3). 이미지 오른쪽 위에 겹쳐 놓는다(부모가 relative).
 * 기록은 기기에 있으므로 하이드레이션 뒤에 나타난다.
 */
export function EatenBadge({ year, foodId, className }: { year: number; foodId: string; className?: string }) {
  const eaten = useIsEaten(year, foodId)
  if (!eaten) return null
  return (
    <span
      aria-label="먹음"
      className={cn(
        "absolute -top-1 -right-1 grid size-[18px] place-items-center rounded-full border-[1.5px] border-gold bg-canvas text-[10px] leading-none font-semibold text-gold-deep motion-safe:animate-tick",
        className,
      )}
    >
      ✓
    </span>
  )
}

/** 올해(서울) 기준 먹음 배지. 오늘은 요청 시점 값이라 Suspense 안에서 읽는다. */
export function EatenBadgeToday({ foodId, className }: { foodId: string; className?: string }) {
  return (
    <Suspense>
      <BadgeForThisYear foodId={foodId} className={className} />
    </Suspense>
  )
}

function BadgeForThisYear({ foodId, className }: { foodId: string; className?: string }) {
  const { year } = useToday()
  return <EatenBadge year={year} foodId={foodId} className={className} />
}
