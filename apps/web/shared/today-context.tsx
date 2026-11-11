"use client"

import { useSyncExternalStore } from "react"

import type { CalendarDate } from "@workspace/seasonal/calendar/month-calendar"
import { seoulToday } from "@workspace/seasonal/calendar/today"

let cached: CalendarDate | null = null

/** 같은 날이면 같은 객체를 돌려준다(useSyncExternalStore는 스냅샷이 매번 같아야 한다). */
function snapshot(): CalendarDate {
  const now = seoulToday()
  if (!cached || cached.year !== now.year || cached.month !== now.month || cached.day !== now.day) cached = now
  return cached
}

const subscribe = () => () => {}

/**
 * 서울 기준 오늘을 브라우저에서 읽는다. 서버 HTML과 하이드레이션 중에는 null이고, 하이드레이션이 끝나면 날짜가 된다
 * (클라이언트 이동으로 처음 그릴 때는 바로 날짜). /seasonal을 요청 때 서버가 그리지 않는 정적 페이지로 두려는 것이다
 * (.scratch/seasonal-render-perf/spec.md 6.2, apps/web/docs/nextjs-16-patterns.md 5.2).
 * null일 때는 오늘 표시가 없는 모양을 그린다. 화면에 보이는 작은 오늘 표시는 이 훅 대신 TodayShow(shared/today-mark)로 첫 그리기부터 보인다.
 */
export function useSeoulToday(): CalendarDate | null {
  return useSyncExternalStore(subscribe, snapshot, () => null)
}
