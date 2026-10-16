import { Suspense } from "react"

import { ThisMonthView } from "@/features/seasonal/this-month/this-month-view"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"
import { JsonLd, organization, website } from "@/shared/seo/json-ld"
import { homeSeo } from "@/shared/seo/titles"
import { getSeoulToday } from "@/shared/today"

export const metadata = createMetadata({
  ...homeSeo(),
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
    <>
      {/* 사이트 이름·로고. 구글은 홈에서만 읽으므로 routes.home이 가리키는 이 페이지에만 둔다. 홈이 바뀌면 새 홈으로 옮긴다.
          요청 시점에 그리는 본문과 달리 정적 셸에 들어가도록 Suspense 밖에 둔다. */}
      <JsonLd data={[website(), organization()]} />
      <Suspense fallback={<div className="min-h-svh" aria-busy />}>
        <ThisMonth />
      </Suspense>
    </>
  )
}

async function ThisMonth() {
  const today = await getSeoulToday()
  return <ThisMonthView today={today} />
}
