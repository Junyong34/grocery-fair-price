"use client"

import { createContext, use } from "react"

import type { CalendarDate } from "@workspace/seasonal/calendar/month-calendar"

// 서울 기준 오늘을 클라이언트 컴포넌트에 나눠 준다(apps/web/docs/nextjs-16-patterns.md 5.2).
// 서버가 만든 Promise를 그대로 받으므로, useToday()를 부르는 컴포넌트는 <Suspense> 안에 있어야 한다.
const TodayContext = createContext<Promise<CalendarDate> | null>(null)

export function TodayProvider({ today, children }: { today: Promise<CalendarDate>; children: React.ReactNode }) {
  return <TodayContext value={today}>{children}</TodayContext>
}

export function useToday(): CalendarDate {
  const today = use(TodayContext)
  if (!today) throw new Error("useToday는 TodayProvider 안에서만 쓴다")
  return use(today)
}
