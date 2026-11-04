import type { Metadata } from "next"

import { PRICE_COPY } from "@workspace/price/copy"
import { groupByCategory } from "@workspace/price/list"

import { CatalogView } from "@/features/price/catalog/catalog-view"
import { getPriceSource } from "@/features/price/data/price-source"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"
import { breadcrumb, JsonLd } from "@/shared/seo/json-ld"
import { varietiesIndexSeo } from "@/shared/seo/titles"

async function seo() {
  const varieties = await getPriceSource().listVarieties()
  return { varieties, seo: varietiesIndexSeo(groupByCategory(varieties).map(({ category }) => category), varieties.length) }
}

export async function generateMetadata(): Promise<Metadata> {
  return createMetadata({
    ...(await seo()).seo,
    path: routes.price.varieties,
    ogImage: { title: PRICE_COPY.catalog.title, subtitle: PRICE_COPY.catalog.ogSubtitle, badge: "시세" },
  })
}

// 품종 허브. 목록은 캐시된 판정 목록(시간 단위)이라 정적 셸에 함께 그린다.
export default async function Page() {
  const { varieties, seo: { title } } = await seo()
  return (
    <>
      <JsonLd data={breadcrumb([{ name: title, path: routes.price.varieties }])} />
      <CatalogView varieties={varieties} />
    </>
  )
}
