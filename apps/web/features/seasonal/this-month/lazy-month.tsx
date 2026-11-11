"use client"

import { lazy, Suspense, useEffect, useRef } from "react"

import type { Month } from "@workspace/seasonal/data/months"

import { requestMonth, useRequestedMonth } from "./active-month"
import { MonthShell } from "./month-shell"

// 달 섹션 내용은 따로 받는 청크다. 서버가 그린 달은 이 청크 없이 HTML로 온다.
const MonthSectionBody = lazy(() => import("./month-section").then((module) => ({ default: module.MonthSectionBody })))

/** 화면에서 이만큼(위아래 한 화면) 떨어졌을 때 미리 그린다. */
const ROOT_MARGIN = "100% 0px"

/**
 * 서버가 틀만 그린 달 섹션(.scratch/seasonal-render-perf/spec.md 6.3). 화면 가까이 오거나 월 레일 · 해시로 이 달에 바로 가면
 * 내용을 그린다. 그리기 전에는 틀이 대개의 섹션 높이만큼 자리를 잡는다(MonthShell).
 */
export function LazyMonth({ year, month }: { year: number; month: Month }) {
  const ref = useRef<HTMLElement>(null)
  const requested = useRequestedMonth(month)

  useEffect(() => {
    const el = ref.current
    if (!el || requested) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) requestMonth(month)
      },
      { rootMargin: ROOT_MARGIN },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [month, requested])

  return (
    <MonthShell ref={ref} month={month}>
      {requested && (
        <Suspense>
          <MonthSectionBody year={year} month={month} />
        </Suspense>
      )}
    </MonthShell>
  )
}
