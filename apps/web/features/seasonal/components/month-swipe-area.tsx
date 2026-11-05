"use client"

import { useParams, useRouter } from "next/navigation"

import { MONTHS, type Month } from "@workspace/seasonal/data/months"

import { routes } from "@/shared/routes"

import { stepIn } from "./swipe-gesture"
import { useSwipe } from "./use-swipe"

/**
 * 안쪽 콘텐츠를 좌우로 밀면 이전·다음 달 주소로 간다. 1월과 12월은 서로 이어진다.
 * 달 칩과 같이 scroll={false}라 스크롤 위치가 그대로다. 레이아웃에 두어 달을 바꿔도 다시 마운트되지 않는다.
 */
export function MonthSwipeArea({
  route,
  children,
}: {
  route: "month" | "sashimiMonth"
  children: React.ReactNode
}) {
  const router = useRouter()
  const current = Number(useParams<{ month: string }>().month) as Month
  const area = useSwipe<HTMLDivElement>((direction) => {
    const month = stepIn(MONTHS, current, direction, { loop: true })
    router.push(routes.seasonal[route](month), { scroll: false })
  })
  return <div ref={area}>{children}</div>
}
