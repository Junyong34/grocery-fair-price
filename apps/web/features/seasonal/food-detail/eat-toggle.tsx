"use client"

import { Suspense, useState } from "react"

import { UI_COPY } from "@workspace/seasonal/data/copy"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { useEatenStore, useIsEaten } from "@/shared/eaten-store"
import { useToday } from "@/shared/today-context"

/**
 * 먹음 기록 토글. 올해(서울 기준)에 기록하고, 켤 때 "+1"이 떠오른다(명세 2.7 pop).
 * size="detail"은 품종 상세의 큰 버튼, "card"는 카드 안의 작은 버튼이다.
 */
export function EatToggle({ foodId, size = "detail" }: { foodId: string; size?: "detail" | "card" }) {
  return (
    <Suspense fallback={<Button variant="outline" fullWidth={size === "detail"} disabled>{label(false, size)}</Button>}>
      <Toggle foodId={foodId} size={size} />
    </Suspense>
  )
}

function label(eaten: boolean, size: "detail" | "card") {
  if (size === "card") return eaten ? UI_COPY.eatToggleOn : UI_COPY.eatToggleOff
  return eaten ? UI_COPY.eatDetailOn : UI_COPY.eatDetailOff
}

function Toggle({ foodId, size }: { foodId: string; size: "detail" | "card" }) {
  const { year } = useToday()
  const eaten = useIsEaten(year, foodId)
  const toggle = useEatenStore((state) => state.toggle)
  // 켤 때마다 key를 바꿔 "+1"을 다시 띄운다.
  const [pops, setPops] = useState(0)

  return (
    <div className="relative">
      <Button
        variant={eaten ? "default" : "outline"}
        fullWidth={size === "detail"}
        size={size === "card" ? "sm" : undefined}
        aria-pressed={eaten}
        onClick={() => {
          if (!eaten) setPops((n) => n + 1)
          toggle(year, foodId)
        }}
      >
        {label(eaten, size)}
      </Button>
      {pops > 0 && (
        <span
          key={pops}
          aria-hidden
          className={cn(
            "pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 font-number text-lg font-semibold text-gold opacity-0",
            "motion-safe:animate-pop",
          )}
        >
          +1
        </span>
      )}
    </div>
  )
}
