import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { isMonth, MONTHS, type Month } from "@workspace/seasonal/data/months"
import { sashimiInMonth } from "@workspace/seasonal/data/sashimi"
import { seasonOfMonth } from "@workspace/seasonal/data/seasons"

import { SashimiView } from "@/features/seasonal/sashimi/sashimi-view"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"
import { breadcrumb, JsonLd } from "@/shared/seo/json-ld"
import { sashimiSeo } from "@/shared/seo/titles"

type Params = PageProps<"/seasonal/sashimi/[month]">["params"]

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

// params는 URL 데이터라 <Suspense> 안에서 읽는다(instant navigation 검사).
export default function Page(props: PageProps<"/seasonal/sashimi/[month]">) {
  return (
    <Suspense fallback={<div className="min-h-svh" aria-busy />}>
      <Sashimi params={props.params} />
    </Suspense>
  )
}

async function Sashimi({ params }: { params: Params }) {
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
