"use client"

import { useState } from "react"

import type { CalendarDate } from "@workspace/seasonal/calendar/month-calendar"
import { DOWNLOADS_COPY } from "@workspace/seasonal/data/copy"
import { defaultDownloadYear, yearChoices } from "@workspace/seasonal/print/listing"
import { Segmented } from "@workspace/ui/components/segmented"

import { useSeoulToday } from "@/shared/today-context"

type YearPanel = { year: number; content: React.ReactNode }

/**
 * 포스터와 이유식 자료는 이 필터 밖에서 그린다.
 * 기본 연도가 올해(서울)에 달려 브라우저에서 정한다. 하이드레이션 전에는 자리만 잡는다.
 */
export function YearFilter({ panels }: { panels: readonly YearPanel[] }) {
  const today = useSeoulToday()
  if (!today) return <div className="min-h-10" aria-busy />
  return <Filtered panels={panels} today={today} />
}

function Filtered({ panels, today }: { panels: readonly YearPanel[]; today: CalendarDate }) {
  const publishedYears = panels.map((panel) => panel.year)
  const [picked, setPicked] = useState<number | null>(null)
  const year = picked ?? defaultDownloadYear(today, publishedYears)
  const options = yearChoices(publishedYears, today.year).map((value) => ({ value, label: DOWNLOADS_COPY.yearLabel(value) }))
  const content = panels.find((panel) => panel.year === year)?.content
  return (
    <>
      <Segmented aria-label={DOWNLOADS_COPY.yearFilter} options={options} value={year} onValueChange={setPicked} className="max-w-full flex-wrap self-start" />
      {content ?? <p className="text-sm text-caption">{DOWNLOADS_COPY.yearEmpty(year)}</p>}
    </>
  )
}
