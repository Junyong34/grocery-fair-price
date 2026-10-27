import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { isoDate } from "@workspace/price/format"

import { getPriceSource } from "@/features/price/data/price-source"
import { DetailView } from "@/features/price/variety-detail/detail-view"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"
import { breadcrumb, JsonLd } from "@/shared/seo/json-ld"
import { varietySeo } from "@/shared/seo/titles"
import { getSeoulToday } from "@/shared/today"

type Params = PageProps<"/prices/[variety]">["params"]

// 모든 품종을 빌드 때 만든다. 목록 밖 id는 notFound()로 막는다(Cache Components에서는 dynamicParams를 쓸 수 없다).
export async function generateStaticParams() {
  const varieties = await getPriceSource().listVarieties()
  return varieties.map((variety) => ({ variety: variety.id }))
}

export async function generateMetadata(props: PageProps<"/prices/[variety]">): Promise<Metadata> {
  const variety = await getPriceSource().getVariety((await props.params).variety)
  if (!variety) return {}
  return createMetadata({
    ...varietySeo(variety),
    path: routes.price.variety(variety.id),
    ogImage: { title: variety.name, subtitle: "오늘 시세와 평소 가격", badge: "시세" },
  })
}

// P3 품종 상세. "오늘"(서울)로 조사일이 얼마나 지났는지 쓰므로 요청 시점에 그린다.
export default function Page(props: PageProps<"/prices/[variety]">) {
  return (
    <Suspense fallback={<div className="min-h-svh" aria-busy />}>
      <Variety params={props.params} />
    </Suspense>
  )
}

async function Variety({ params }: { params: Params }) {
  const [detail, today] = await Promise.all([getPriceSource().getVariety((await params).variety), getSeoulToday()])
  if (!detail) notFound()
  return (
    <>
      <JsonLd data={breadcrumb([{ name: varietySeo(detail).title, path: routes.price.variety(detail.id) }])} />
      <DetailView detail={detail} today={isoDate(today)} />
    </>
  )
}
