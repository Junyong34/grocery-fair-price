import { NextResponse, type NextRequest } from "next/server"

import { currentMonth } from "@workspace/seasonal/calendar/today"
import { upcomingFestival } from "@workspace/seasonal/data/festivals"

import { routes } from "@/shared/routes"

// "오늘"에 따라 기본 화면이 달라지는 경로를 서울 시간 기준으로 보낸다.
// 페이지가 이 계산을 하면 정적 프리렌더가 깨지므로 렌더 전에 처리한다.
export function proxy(request: NextRequest) {
  const month = currentMonth()
  const target =
    request.nextUrl.pathname === routes.seasonal.months
      ? routes.seasonal.month(month)
      : routes.seasonal.festival(upcomingFestival(month))
  return NextResponse.redirect(new URL(target, request.url))
}

// matcher는 빌드 때 정적으로 읽히므로 routes 값을 쓸 수 없다. shared/routes.ts와 맞춰 둔다.
export const config = {
  matcher: ["/seasonal/months", "/seasonal/festivals"],
}
