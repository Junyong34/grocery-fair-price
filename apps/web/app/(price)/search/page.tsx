import { Suspense } from "react"

import { getPriceSource } from "@/features/price/data/price-source"
import { SearchView } from "@/features/price/search/search-view"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"

export const metadata = createMetadata({
  title: "품종 검색",
  description: "품종 이름이나 초성, 품목 이름으로 오늘 시세와 판정을 찾아보세요.",
  path: routes.price.search,
  noIndex: true,
})

// P2 품종 검색. 검색어(?q=)는 브라우저에서 읽어 정적 셸을 유지한다(useSearchParams는 Suspense 안).
export default async function Page() {
  const source = getPriceSource()
  const [varieties, featuredIds, index] = await Promise.all([source.listVarieties(), source.featuredIds(), source.searchIndex()])
  return (
    <Suspense>
      <SearchView varieties={varieties} featuredIds={featuredIds} index={index} />
    </Suspense>
  )
}
