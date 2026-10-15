"use client"

import { useState } from "react"

import { holidaysInMonth } from "@workspace/seasonal/calendar/holidays"
import { seoulToday } from "@workspace/seasonal/calendar/today"
import { cn } from "@workspace/ui/lib/utils"

import {
  CALENDAR_VARIANT_LABELS,
  CALENDAR_VARIANTS,
  MonthCalendar,
  type CalendarVariant,
} from "../components/month-calendar"

/** 미리보기 달력을 그리는 폭(px). zoom으로 칸 폭에 맞게 줄인다. */
const PREVIEW_WIDTH = 336
const PREVIEW_ZOOM = 0.22

/**
 * ⚙ 달력 모양 고르기. 네 모양을 실제 달력(이번 달)을 줄인 미리보기로 보여 준다.
 * 화살표 키로 옆 모양을 고른다.
 */
export function CalendarStylePicker({
  value,
  onChange,
}: {
  value: CalendarVariant
  onChange: (value: CalendarVariant) => void
}) {
  // 시트·패널은 열릴 때만 그려지므로(클라이언트) 이번 달을 바로 잡는다. 날짜는 서울 기준이다.
  const [today] = useState(seoulToday)
  // 이 피커는 설정을 열 때 따로 불러오는 묶음(settings-fields)에 있어 공휴일 데이터를 여기서 구해도 첫 화면 번들에 들지 않는다.
  const [holidays] = useState(() => holidaysInMonth(today.year, today.month))
  const index = CALENDAR_VARIANTS.indexOf(value)

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
    if (!step) return
    event.preventDefault()
    const next = (index + step + CALENDAR_VARIANTS.length) % CALENDAR_VARIANTS.length
    onChange(CALENDAR_VARIANTS[next]!)
    event.currentTarget.querySelectorAll<HTMLButtonElement>("[role=radio]")[next]?.focus()
  }

  return (
    <div className="flex flex-col gap-2.5 py-3">
      <span id="calendar-style-label" className="text-[15px] text-ink">
        달력 모양
      </span>
      <div
        role="radiogroup"
        aria-labelledby="calendar-style-label"
        onKeyDown={onKeyDown}
        className="grid grid-cols-4 gap-2"
      >
        {CALENDAR_VARIANTS.map((variant, i) => {
          const selected = i === index
          return (
            <button
              key={variant}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(variant)}
              className="group flex flex-col items-center gap-1.5 text-xs text-stone aria-checked:font-semibold aria-checked:text-ink"
            >
              <span
                className={cn(
                  "grid h-[86px] w-full lg:h-[112px] place-items-center overflow-hidden rounded-md border bg-canvas p-1.5 transition-colors",
                  selected ? "border-gold bg-gold-wash" : "border-hairline group-hover:border-silver"
                )}
              >
                <span aria-hidden inert style={{ width: PREVIEW_WIDTH, zoom: PREVIEW_ZOOM }}>
                  <MonthCalendar year={today.year} month={today.month} today={today} holidays={holidays} variant={variant} />
                </span>
              </span>
              {CALENDAR_VARIANT_LABELS[variant]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
