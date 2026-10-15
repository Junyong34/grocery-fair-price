import { Suspense } from "react"

import { ThisMonthView } from "@/features/seasonal/this-month/this-month-view"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"
import { getSeoulToday } from "@/shared/today"

export const metadata = createMetadata({
  title: "이달의 제철",
  description: "지금 가장 맛있는 이달의 제철 식재료와 달력을 확인해 보세요.",
  path: routes.seasonal.root,
  ogImage: {
    title: "이달의 제철",
    subtitle: "지금 가장 맛있는 우리 땅 제철 식재료",
    badge: "이번 달",
  },
})

// 2a는 "오늘"(서울)에 따라 히어로·달력이 달라지므로 요청 시점에 그린다. 셸(헤더·탭·내비)은 정적이다.
export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-svh" aria-busy />}>
      <ThisMonth />
    </Suspense>
  )
}

async function ThisMonth() {
  const today = await getSeoulToday()
  return <ThisMonthView today={today} />
}
