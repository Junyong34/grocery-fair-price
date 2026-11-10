import type { Metadata } from "next"

import { productCategories } from "@workspace/price/list"

import { getPriceSource } from "@/features/price/data/price-source"
import { CatalogView } from "@/features/price/product-catalog/catalog-view"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"
import { breadcrumb, JsonLd } from "@/shared/seo/json-ld"
import { productsSeo } from "@/shared/seo/titles"

export const metadata: Metadata = createMetadata({
  ...productsSeo(),
  path: routes.price.products,
  ogImage: { title: "상품 가격 비교", subtitle: "카테고리별 전국 판매가", badge: "가격" },
})

// 상품 목록. 카테고리 · 상품 목록은 캐시 읽기라 본문이 정적 셸에 들어간다.
export default async function Page() {
  const source = getPriceSource()
  const [categories, products] = await Promise.all([source.listCategories(), source.listProducts()])
  return (
    <>
      <JsonLd data={breadcrumb([{ name: productsSeo().title, path: routes.price.products }])} />
      <CatalogView categories={productCategories(categories, products)} />
    </>
  )
}
