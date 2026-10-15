"use client"

import type { CalendarDate } from "@workspace/seasonal/calendar/month-calendar"

import { MonthCalendar } from "../components/month-calendar"
import { useHydrateSettings, useSettingsStore } from "../stores/settings-store"

/**
 * 표시 설정을 data 속성으로 내려 준다. 안쪽 서버 컴포넌트는 `in-data-[holidays=off]:hidden`처럼 CSS로만 반응하므로
 * 설정이 바뀌어도 달력·그림을 다시 렌더하지 않는다.
 */
export function SettingsScope({ children }: { children: React.ReactNode }) {
  useHydrateSettings()
  const showHolidays = useSettingsStore((state) => state.showHolidays)
  const showEaten = useSettingsStore((state) => state.showEaten)
  return (
    <div data-holidays={showHolidays ? "on" : "off"} data-eaten-mark={showEaten ? "on" : "off"}>
      {children}
    </div>
  )
}

/** ⚙에서 고른 모양으로 그리는 달력. 저장값을 불러오기 전(서버 HTML)에는 기본 plain이다. */
export function SettingsCalendar(props: { year: number; month: number; today: CalendarDate }) {
  const variant = useSettingsStore((state) => state.calendarStyle)
  return <MonthCalendar {...props} variant={variant} />
}
