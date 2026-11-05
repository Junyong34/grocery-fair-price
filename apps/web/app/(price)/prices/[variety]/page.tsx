import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { PRICE_COPY } from "@workspace/price/copy"

import { getPriceSource } from "@/features/price/data/price-source"
import { DetailView } from "@/features/price/variety-detail/detail-view"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"
import { breadcrumb, JsonLd } from "@/shared/seo/json-ld"
import { varietySeo } from "@/shared/seo/titles"

type Params = PageProps<"/prices/[variety]">["params"]

// 판정이 있는 품종을 모두 빌드 때 그린다(상세 읽기가 캐시라 본문이 정적 셸에 들어간다). 목록에 없는 id는 요청 때 그리고,
// 판정이 없으면 notFound()로 막는다.
export async function generateStaticParams() {
  const varieties = await getPriceSource().listVarieties()
  return varieties.map(({ id }) => ({ variety: id }))
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

// P3 품종 상세. 본문은 정적이다. "오늘"(서울)은 데이터가 오래됐을 때의 "N주 전" 배지만 요청 때 채운다(VerdictCard).
export default function Page(props: PageProps<"/prices/[variety]">) {
  return (
    <Suspense fallback={<div className="min-h-svh" aria-busy />}>
      <Variety params={props.params} />
    </Suspense>
  )
}

async function Variety({ params }: { params: Params }) {
  const detail = await getPriceSource().getVariety((await params).variety)
  if (!detail) notFound()
  return (
    <>
      <JsonLd data={breadcrumb([{ name: PRICE_COPY.catalog.title, path: routes.price.varieties }, { name: varietySeo(detail).title, path: routes.price.variety(detail.id) }])} />
      <DetailView detail={detail} />
    </>
  )
}
