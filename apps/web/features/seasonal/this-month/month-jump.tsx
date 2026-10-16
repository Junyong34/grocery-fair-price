"use client"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { formatMonthLabel, MONTHS } from "@workspace/seasonal/data/months"

import { useSettingsStore } from "../stores/settings-store"

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

/** 모바일 오른쪽 아래 월 레일. 누르면 그 달로 즉시 이동한다(명세 3.1 ②). 달 이름 표기는 ⚙에서 고른다. */
export function MonthRail() {
  const active = useActiveMonth((state) => state.active)
  const labelStyle = useSettingsStore((state) => state.monthLabel)
  return (
    <nav
      aria-label="달 이동"
      className="fixed top-1/2 right-1 z-(--z-sticky) -translate-y-1/2 flex flex-col gap-0.5 rounded-full border border-hairline bg-canvas/94 p-1 backdrop-blur lg:hidden"
    >
      {MONTHS.map((month) => (
        <button
          key={month}
          type="button"
          aria-label={`${month}월로 이동`}
          aria-current={active === month ? "true" : undefined}
          onClick={() => jumpToMonth(month)}
          className={cn(
            "h-[26px] min-w-7 rounded-full px-0.5 text-xs leading-none tabular-nums text-stone transition-colors",
            active === month && "bg-gold-soft font-semibold text-gold-deep",
          )}
        >
          {formatMonthLabel(month, labelStyle)}
        </button>
      ))}
    </nav>
  )
}
