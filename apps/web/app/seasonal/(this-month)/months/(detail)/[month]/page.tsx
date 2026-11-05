import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { isMonth, MONTHS, type Month } from "@workspace/seasonal/data/months"
import { seasonOfMonth } from "@workspace/seasonal/data/seasons"

import { MonthView } from "@/features/seasonal/month-timeline/month-view"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"
import { breadcrumb, JsonLd } from "@/shared/seo/json-ld"
import { monthSeo, monthsIndexSeo } from "@/shared/seo/titles"

// 달을 바꿀 때는 새 달이 준비될 때까지 지금 달을 그대로 둔다. 페이지에 Suspense 대체 화면을 두면 그 순간 문서가 짧아져
// 스크롤이 위로 끌려갔다가 돌아온다(고정 줄 상태에서 페이지 상단이 비친다). 열두 달 모두 정적이라 기다림은 짧다.
export const instant = false

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
    ...monthSeo(m),
    path: routes.seasonal.month(m),
    ogImage: {
      title: `${m}월의 제철`,
      subtitle: `${m}월에 가장 맛있는 제철 식재료 목록`,
      badge: `${m}월`,
      season: seasonOfMonth(m),
    },
  })
}

export default async function Page({
  params,
}: PageProps<"/seasonal/months/[month]">) {
  const { month } = await params
  if (!isMonth(month)) notFound()
  const m = Number(month) as Month
  return (
    <>
      <JsonLd
        data={breadcrumb([
          { name: monthsIndexSeo().title, path: routes.seasonal.months },
          { name: monthSeo(m).title, path: routes.seasonal.month(m) },
        ])}
      />
      <MonthView month={m} />
    </>
  )
}
