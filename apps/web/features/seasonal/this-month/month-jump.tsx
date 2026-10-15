"use client"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { MONTHS } from "@workspace/seasonal/data/months"

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
