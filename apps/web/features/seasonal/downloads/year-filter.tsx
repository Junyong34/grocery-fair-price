"use client"

import { Suspense, useState } from "react"

import { DOWNLOADS_COPY } from "@workspace/seasonal/data/copy"
import { yearChoices } from "@workspace/seasonal/print/listing"
import { Segmented } from "@workspace/ui/components/segmented"

import { useToday } from "@/shared/today-context"

export type YearPanel = { year: number; content: React.ReactNode }

/**
 * 내려받기 목록의 연도 필터. 처음에는 서울 기준 올해를 고른다.
 * 목록은 서버 컴포넌트로 연도마다 미리 만들어 받고 여기서는 하나만 고른다. 매니페스트에 없는 연도(올해 달력이 아직 없을 때)는 otherYears를 보인다.
 */
export function YearFilter({ panels, otherYears }: { panels: readonly YearPanel[]; otherYears: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-svh" aria-busy />}>
      <Filtered panels={panels} otherYears={otherYears} />
    </Suspense>
  )
}

function Filtered({ panels, otherYears }: { panels: readonly YearPanel[]; otherYears: React.ReactNode }) {
  const currentYear = useToday().year
  const [picked, setPicked] = useState<number | null>(null)
  const year = picked ?? currentYear
  const options = yearChoices(panels.map((panel) => panel.year), currentYear).map((value) => ({ value, label: DOWNLOADS_COPY.yearLabel(value) }))
  const content = panels.find((panel) => panel.year === year)?.content ?? otherYears
  return (
    <>
      <Segmented aria-label={DOWNLOADS_COPY.yearFilter} options={options} value={year} onValueChange={setPicked} className="mx-[18px] self-start lg:mx-6" />
      {content ?? <p className="px-[18px] text-sm text-caption lg:px-6">{DOWNLOADS_COPY.yearEmpty(year)}</p>}
    </>
  )
}
