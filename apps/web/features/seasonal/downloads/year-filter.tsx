"use client"

import { Suspense, useState } from "react"

import { DOWNLOADS_COPY } from "@workspace/seasonal/data/copy"
import { yearChoices } from "@workspace/seasonal/print/listing"
import { Segmented } from "@workspace/ui/components/segmented"

import { useToday } from "@/shared/today-context"

type YearPanel = { year: number; content: React.ReactNode }

/** 처음에는 서울 기준 올해를 고른다. 포스터와 이유식 자료는 이 필터 밖에서 그린다. */
export function YearFilter({ panels }: { panels: readonly YearPanel[] }) {
  return (
    <Suspense fallback={<div className="min-h-10" aria-busy />}>
      <Filtered panels={panels} />
    </Suspense>
  )
}

function Filtered({ panels }: { panels: readonly YearPanel[] }) {
  const currentYear = useToday().year
  const [picked, setPicked] = useState<number | null>(null)
  const year = picked ?? currentYear
  const options = yearChoices(panels.map((panel) => panel.year), currentYear).map((value) => ({ value, label: DOWNLOADS_COPY.yearLabel(value) }))
  const content = panels.find((panel) => panel.year === year)?.content
  return (
    <>
      <Segmented aria-label={DOWNLOADS_COPY.yearFilter} options={options} value={year} onValueChange={setPicked} className="max-w-full flex-wrap self-start" />
      {content ?? <p className="text-sm text-caption">{DOWNLOADS_COPY.yearEmpty(year)}</p>}
    </>
  )
}
