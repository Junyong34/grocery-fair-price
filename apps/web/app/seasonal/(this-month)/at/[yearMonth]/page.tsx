import { notFound } from "next/navigation"
import { Suspense } from "react"

import { STATIC_YEARS } from "@workspace/seasonal/calendar/static-years"
import {
  formatYearMonth,
  parseYearMonth,
} from "@workspace/seasonal/calendar/year-month"
import { MONTHS, type Month } from "@workspace/seasonal/data/months"

import { ThisMonthView } from "@/features/seasonal/this-month/this-month-view"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"
import { seasonalHomeSeo } from "@/shared/seo/titles"

// 2a 이달. 사용자가 여는 주소는 /seasonal이고, proxy.ts가 서울 기준 이번 (연, 월)로 이 경로를 rewrite한다
// (.scratch/seasonal-static/spec.md). /seasonal의 응답이 곧 이 페이지라서 메타데이터는 /seasonal의 것이다(색인, canonical /seasonal).
export const metadata = createMetadata({
  ...seasonalHomeSeo(),
  path: routes.seasonal.root,
  ogImage: {
    title: "이달의 제철",
    subtitle: "지금 가장 맛있는 우리 땅 제철 식재료",
    badge: "이번 달",
  },
})

// 미리 그리는 해의 열두 달을 모두 만든다. 범위 밖 값은 proxy가 보내지 않고, 직접 들어오면 not-found다.
export function generateStaticParams() {
  return STATIC_YEARS.flatMap((year) =>
    MONTHS.map((month) => ({ yearMonth: formatYearMonth(year, month) }))
  )
}

// params는 <Suspense> 안에서 읽는다. 목록의 params는 빌드 때 풀려 본문 전체가 정적 셸에 들어간다.
export default function Page(props: PageProps<"/seasonal/at/[yearMonth]">) {
  return (
    <Suspense fallback={<div className="min-h-svh" aria-busy />}>
      <ThisMonth params={props.params} />
    </Suspense>
  )
}

async function ThisMonth({
  params,
}: {
  params: PageProps<"/seasonal/at/[yearMonth]">["params"]
}) {
  const parsed = parseYearMonth((await params).yearMonth)
  if (!parsed || !STATIC_YEARS.includes(parsed.year)) notFound()
  return <ThisMonthView year={parsed.year} month={parsed.month as Month} />
}
