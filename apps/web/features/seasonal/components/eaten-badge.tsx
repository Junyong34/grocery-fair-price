"use client"

import { cn } from "@workspace/ui/lib/utils"

import { useIsEaten } from "@/shared/eaten-store"

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
