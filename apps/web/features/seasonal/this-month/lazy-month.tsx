"use client"

import { lazy, Suspense, useEffect, useRef } from "react"

import type { Month } from "@workspace/seasonal/data/months"

import { requestMonth, useRequestedMonth } from "./active-month"
import { MonthShell } from "./month-shell"

// 달 섹션 내용은 따로 받는 청크다. 서버가 그린 달은 이 청크 없이 HTML로 온다.
const MonthSectionBody = lazy(() => import("./month-section").then((module) => ({ default: module.MonthSectionBody })))

/** 화면에서 이만큼(위아래 한 화면) 떨어졌을 때 미리 그린다. */
const ROOT_MARGIN = "100% 0px"

/** 한가할 때 부른다. 1초가 지나면 기다리지 않는다. Safari는 requestIdleCallback이 없어 짧게 미룬다. */
function whenIdle(run: () => void) {
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(run, { timeout: 1000 })
  else window.setTimeout(run, 200)
}

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
        // 브라우저가 한가할 때 그린다. 페이지를 막 불러온 직후의 하이드레이션 · 첫 그리기와 겹치지 않게 한다.
        // 월 레일 · 해시로 바로 갈 때는 jumpToMonth가 기다리지 않고 바로 그린다.
        if (entry?.isIntersecting) whenIdle(() => requestMonth(month))
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
