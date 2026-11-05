import { Suspense } from "react"

import type { Month } from "@workspace/seasonal/data/months"

import { ThisMonthView } from "@/features/seasonal/this-month/this-month-view"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"
import { seasonalHomeSeo } from "@/shared/seo/titles"
import { getSeoulToday } from "@/shared/today"

export const metadata = createMetadata({
  ...seasonalHomeSeo(),
  path: routes.seasonal.root,
  ogImage: {
    title: "이달의 제철",
    subtitle: "지금 가장 맛있는 우리 땅 제철 식재료",
    badge: "이번 달",
  },
})

// 2a의 실제 화면은 /seasonal/at/[yearMonth](미리 그린 정적 페이지)이고, proxy.ts가 /seasonal을 그리로 rewrite한다.
// 이 페이지는 proxy가 돌지 않을 때의 대비책이다(@sheet/page.tsx와 짝이 맞아야 빌드된다). 요청 시점에 그린다.
export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-svh" aria-busy />}>
      <ThisMonth />
    </Suspense>
  )
}

async function ThisMonth() {
  const { year, month } = await getSeoulToday()
  return <ThisMonthView year={year} month={month as Month} />
}
