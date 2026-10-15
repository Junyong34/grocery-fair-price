import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { isMonth, MONTHS, type Month } from "@workspace/seasonal/data/months"
import { seasonOfMonth } from "@workspace/seasonal/data/seasons"

import { MonthView } from "@/features/seasonal/month-timeline/month-view"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"

type Params = PageProps<"/seasonal/months/[month]">["params"]

export function generateStaticParams() {
  return MONTHS.map((month) => ({ month: String(month) }))
}

export async function generateMetadata(
  props: PageProps<"/seasonal/months/[month]">
): Promise<Metadata> {
  const { month } = await props.params
  if (!isMonth(month)) return {}
  const m = Number(month)
  return createMetadata({
    title: `${m}월의 제철`,
    description: `${m}월에 가장 맛있고 영양 가득한 우리 땅 제철 식재료를 만나보세요.`,
    path: routes.seasonal.month(m),
    ogImage: {
      title: `${m}월의 제철`,
      subtitle: `${m}월에 가장 맛있는 제철 식재료 목록`,
      badge: `${m}월`,
      season: seasonOfMonth(m),
    },
  })
}

// params는 URL 데이터라 <Suspense> 밖에서 읽으면 이동이 즉시 일어나지 않는다(instant navigation 검사).
// 페이지 틀은 바로 보내고, params를 쓰는 부분만 Suspense 안에 둔다.
export default function Page(props: PageProps<"/seasonal/months/[month]">) {
  return (
    <Suspense fallback={<div className="min-h-svh" aria-busy />}>
      <Month params={props.params} />
    </Suspense>
  )
}

async function Month({ params }: { params: Params }) {
  const { month } = await params
  if (!isMonth(month)) notFound()
  return <MonthView month={Number(month) as Month} />
}
