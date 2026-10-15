"use client"

import { formatMonthLabel } from "@workspace/seasonal/data/months"

import { useSettingsStore } from "../stores/settings-store"

/**
 * 큰 달 숫자(달 섹션 제목, 데스크톱 패널). ⚙의 달 이름 표기를 따른다.
 * 숫자 글꼴(font-number)에는 한글이 없어 "월"은 제목 글꼴로 작게 붙인다. suffixClassName으로 크기를 정한다.
 * 영어는 약자 대신 전체 이름("September")이라 숫자보다 넓으므로 englishClassName으로 줄인다.
 */
export function MonthTitle({
  month,
  suffixClassName,
  englishClassName,
}: {
  month: number
  suffixClassName?: string
  englishClassName?: string
}) {
  const style = useSettingsStore((state) => state.monthLabel)
  if (style === "english") return <span className={englishClassName}>{formatMonthLabel(month, style, "long")}</span>
  if (style === "number") return formatMonthLabel(month, style)
  return (
    <>
      {month}
      <span className={suffixClassName}>월</span>
    </>
  )
}
