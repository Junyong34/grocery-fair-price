import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { isMonth, MONTHS, type Month } from "@workspace/seasonal/data/months"
import { sashimiInMonth } from "@workspace/seasonal/data/sashimi"
import { seasonOfMonth } from "@workspace/seasonal/data/seasons"

import { SashimiView } from "@/features/seasonal/sashimi/sashimi-view"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"
import { breadcrumb, JsonLd } from "@/shared/seo/json-ld"
import { sashimiSeo } from "@/shared/seo/titles"

// 달을 바꿀 때는 새 달이 준비될 때까지 지금 달을 그대로 둔다. 페이지에 Suspense 대체 화면을 두면 그 순간 문서가 짧아져
// 스크롤이 위로 끌려갔다가 돌아온다(고정 줄 상태에서 페이지 상단이 비친다). 열두 달 모두 정적이라 기다림은 짧다.
export const instant = false

export function generateStaticParams() {
  return MONTHS.map((month) => ({ month: String(month) }))
}

export async function generateMetadata(
  props: PageProps<"/seasonal/sashimi/[month]">
): Promise<Metadata> {
  const { month } = await props.params
  if (!isMonth(month)) return {}
  const m = Number(month)
  return createMetadata({
    ...sashimiSeo(m),
    path: routes.seasonal.sashimiMonth(m),
    ogImage: {
      title: `${m}월 제철 회`,
      subtitle: sashimiInMonth(m)
        .slice(0, 4)
        .map((food) => food.name)
        .join(" · "),
      badge: "제철 회",
      season: seasonOfMonth(m),
    },
  })
}

export default async function Page({
  params,
}: PageProps<"/seasonal/sashimi/[month]">) {
  const { month } = await params
  if (!isMonth(month)) notFound()
  const m = Number(month) as Month
  return (
    <>
      {/* /seasonal/sashimi는 페이지 없이 proxy가 이번 달로 보내므로 중간 단계를 두지 않는다. */}
      <JsonLd
        data={breadcrumb([
          { name: sashimiSeo(m).title, path: routes.seasonal.sashimiMonth(m) },
        ])}
      />
      <SashimiView month={m} />
    </>
  )
}
