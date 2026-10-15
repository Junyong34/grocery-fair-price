"use client"

import { formatMonthLabel } from "@workspace/seasonal/data/months"

import { useSettingsStore } from "../stores/settings-store"

/**
 * 큰 달 숫자(달 섹션 제목, 데스크톱 패널). ⚙의 달 이름 표기를 따른다.
 * 숫자 글꼴(font-number)에는 한글이 없어 "월"은 제목 글꼴로 작게 붙인다. suffixClassName으로 크기를 정한다.
 */
export function MonthTitle({ month, suffixClassName }: { month: number; suffixClassName?: string }) {
  const style = useSettingsStore((state) => state.monthLabel)
  if (style !== "korean") return formatMonthLabel(month, style)
  return (
    <>
      {month}
      <span className={suffixClassName}>월</span>
    </>
  )
}
