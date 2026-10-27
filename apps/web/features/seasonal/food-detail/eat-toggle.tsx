"use client"

import { Suspense, useState } from "react"

import { UI_COPY } from "@workspace/seasonal/data/copy"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { toggleEaten, useIsEaten } from "@/shared/eaten-store"
import { useToday } from "@/shared/today-context"

/**
 * 먹음 기록 토글. 올해(서울 기준)에 기록하고, 켤 때 "+1"이 떠오른다(명세 2.7 pop).
 * size="detail"은 품종 상세의 기록 줄(왼쪽 질문·안내, 오른쪽 작은 버튼), "card"는 카드 안의 작은 버튼이다.
 */
export function EatToggle({
  foodId,
  size = "detail",
}: {
  foodId: string
  size?: "detail" | "card"
}) {
  const fallback = (
    <Button variant="outline" size="sm" disabled>
      {UI_COPY.eatToggleOff}
    </Button>
  )
  if (size === "card")
    return (
      <Suspense fallback={fallback}>
        <Toggle foodId={foodId} />
      </Suspense>
    )
  return (
    <Suspense fallback={<DetailRow eaten={false}>{fallback}</DetailRow>}>
      <DetailToggle foodId={foodId} />
    </Suspense>
  )
}

/** 품종 상세 기록 줄. 버튼은 오른쪽에 작게 두고, 무엇을 하는 버튼인지는 왼쪽 글로 알린다. */
function DetailRow({
  eaten,
  children,
}: {
  eaten: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-colors",
        eaten
          ? "border-gold-pale/60 bg-gold-wash"
          : "border-hairline bg-surface/60"
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-sm font-semibold text-ink">
          {eaten ? UI_COPY.eatDetailDone : UI_COPY.eatDetailAsk}
        </p>
        <p className="text-xs text-stone">
          {eaten ? UI_COPY.eatDetailHintOn : UI_COPY.eatDetailHintOff}
        </p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function DetailToggle({ foodId }: { foodId: string }) {
  const { year } = useToday()
  const eaten = useIsEaten(year, foodId)
  return (
    <DetailRow eaten={eaten}>
      <Toggle foodId={foodId} />
    </DetailRow>
  )
}

function Toggle({ foodId }: { foodId: string }) {
  const { year } = useToday()
  const eaten = useIsEaten(year, foodId)
  // 켤 때마다 key를 바꿔 "+1"을 다시 띄운다.
  const [pops, setPops] = useState(0)

  return (
    <div className="relative">
      <Button
        variant={eaten ? "default" : "outline"}
        size="sm"
        aria-pressed={eaten}
        onClick={() => {
          if (!eaten) setPops((n) => n + 1)
          toggleEaten(year, foodId)
        }}
      >
        {eaten ? UI_COPY.eatToggleOn : UI_COPY.eatToggleOff}
      </Button>
      {pops > 0 && (
        <span
          key={pops}
          aria-hidden
          className={cn(
            "pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 font-number text-lg font-semibold text-gold opacity-0",
            "motion-safe:animate-pop"
          )}
        >
          +1
        </span>
      )}
    </div>
  )
}
