"use client"

import { useMemo } from "react"

import { holidaysInMonth } from "@workspace/seasonal/calendar/holidays"
import type { CalendarDate } from "@workspace/seasonal/calendar/month-calendar"
import { CALENDAR_VARIANT_LABELS, CALENDAR_VARIANTS, type CalendarVariant } from "@workspace/seasonal/calendar/variants"
import { cn } from "@workspace/ui/lib/utils"

import { SettingWhere } from "@/shared/settings/setting-section"
import { useSeoulToday } from "@/shared/today-context"

import { MonthCalendar } from "../components/month-calendar"

/** 미리보기 달력을 그리는 폭(px). zoom으로 칸 폭에 맞게 줄인다. */
const PREVIEW_WIDTH = 336
const PREVIEW_ZOOM = 0.22

/**
 * 설정 화면의 달력 모양 고르기. 네 모양을 실제 달력(이번 달)을 줄인 미리보기로 보여 준다.
 * 화살표 키로 옆 모양을 고른다.
 * 서울 오늘은 브라우저에서 정하므로 미리보기는 하이드레이션 뒤에 그린다. 칸 높이가 고정이라 늦게 그려져도 레이아웃이 밀리지 않는다.
 */
export function CalendarStylePicker({
  value,
  onChange,
}: {
  value: CalendarVariant
  onChange: (value: CalendarVariant) => void
}) {
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
      <span className="text-[15px] text-ink">
        <span id="calendar-style-label">달력 모양</span>
        <SettingWhere>제철달력</SettingWhere>
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
                  <CalendarPreview variant={variant} />
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

/** 서울 기준 이번 달을 그린 미리보기 한 칸. 오늘을 브라우저에서 정하므로 하이드레이션 전에는 비어 있다. */
function CalendarPreview({ variant }: { variant: CalendarVariant }) {
  const today = useSeoulToday()
  if (!today) return null
  return <Preview variant={variant} today={today} />
}

function Preview({ variant, today }: { variant: CalendarVariant; today: CalendarDate }) {
  // 설정 화면에만 있어 공휴일 데이터를 여기서 구해도 다른 화면 번들에 들지 않는다.
  const holidays = useMemo(() => holidaysInMonth(today.year, today.month), [today.year, today.month])
  return <MonthCalendar year={today.year} month={today.month} today={today} holidays={holidays} variant={variant} />
}
