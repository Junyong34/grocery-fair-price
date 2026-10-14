"use client"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { SEASON_COPY } from "@workspace/seasonal/data/copy"
import { MONTHS } from "@workspace/seasonal/data/months"
import { seasonOfMonth } from "@workspace/seasonal/data/seasons"

import { jumpToMonth, useActiveMonth } from "./active-month"

/** 그 달 섹션으로 즉시 이동하는 버튼(히어로의 "10월 달력 보기 ↓", "1월부터"). */
export function JumpButton({
  month,
  variant,
  children,
}: {
  month: number
  variant?: "default" | "outline"
  children: React.ReactNode
}) {
  return (
    <Button variant={variant} onClick={() => jumpToMonth(month)}>
      {children}
    </Button>
  )
}

/** 모바일 위쪽에 붙는 인디케이터. 히어로에서는 "지금은 10월", 아래로 내려가면 "가을 · 11월". */
export function StickyIndicator({ thisMonth }: { thisMonth: number }) {
  const active = useActiveMonth((state) => state.active)
  return (
    <div
      aria-hidden
      className="sticky top-0 z-(--z-sticky) flex h-11 items-center bg-canvas/94 px-[18px] text-sm text-stone backdrop-blur lg:hidden"
    >
      {active ? `${SEASON_COPY[seasonOfMonth(active)].name} · ${active}월` : `지금은 ${thisMonth}월`}
    </div>
  )
}

/** 모바일 오른쪽 아래 월 레일. 누르면 그 달로 즉시 이동한다(명세 3.1 ②). */
export function MonthRail() {
  const active = useActiveMonth((state) => state.active)
  return (
    <nav
      aria-label="달 이동"
      className="fixed right-2 bottom-24 z-(--z-sticky) flex flex-col gap-0.5 rounded-full border border-hairline bg-canvas/94 p-1 backdrop-blur lg:hidden"
    >
      {MONTHS.map((month) => (
        <button
          key={month}
          type="button"
          aria-label={`${month}월로 이동`}
          aria-current={active === month ? "true" : undefined}
          onClick={() => jumpToMonth(month)}
          className={cn(
            "h-[19px] w-6 rounded-full text-[10px] leading-none tabular-nums text-stone",
            active === month && "bg-ink text-canvas",
          )}
        >
          {month}
        </button>
      ))}
    </nav>
  )
}
