import "server-only"

import { connection } from "next/server"

import type { CalendarDate } from "@workspace/seasonal/calendar/month-calendar"
import { seoulToday } from "@workspace/seasonal/calendar/today"

/**
 * 서울 기준 오늘. 요청 시점에 서버에서 한 번 계산한다(apps/web/docs/nextjs-16-patterns.md 5.2).
 * 프리렌더 결과에 날짜가 굳지 않도록 connection() 뒤에 계산하므로, 부르는 쪽은 <Suspense> 안에 있어야 한다.
 * 클라이언트 컴포넌트에는 이 값을 props로 넘기고, 클라이언트에서 날짜를 다시 계산하지 않는다.
 */
export async function getSeoulToday(): Promise<CalendarDate> {
  await connection()
  return seoulToday()
}
