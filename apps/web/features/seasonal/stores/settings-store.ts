"use client"

import type { CalendarVariant } from "@workspace/seasonal/calendar/variants"
import type { MonthLabelStyle } from "@workspace/seasonal/data/months"
import type { Paper } from "@workspace/seasonal/print/spec"

import { deviceStore } from "@/shared/device-store"

// 2a ⚙ 표시 설정(명세 4절, 24절기·다운로드 제외). 기기에 저장한다.
// 서버 HTML은 기본값(모두 켜짐, 달력 plain, 달 이름 "1월")으로 그리고, 하이드레이션 뒤 저장값을 불러온다.
type Settings = {
  showHolidays: boolean
  showEaten: boolean
  /** 2a 달력 모양. 기본은 plain. */
  calendarStyle: CalendarVariant
  /** 2a 달 제목과 달 이동(모바일 월 레일, 데스크톱 휠)의 달 이름 표기. 기본은 "1월". */
  monthLabel: MonthLabelStyle
  /** PDF 내려받기 화면에서 고른 용지. 기본은 A4. */
  paper: Paper
}

const settingsStore = deviceStore<Settings>("seasonal:settings", {
  showHolidays: true,
  showEaten: true,
  calendarStyle: "plain",
  monthLabel: "korean",
  paper: "A4",
})

export const useSettings = settingsStore.use

export function setSettings(patch: Partial<Settings>): void {
  settingsStore.set(patch)
}
