import type { MetadataRoute } from "next"

import { getPriceSource } from "@/features/price/data/price-source"
import { absoluteUrl } from "@/shared/meta"
import { routes } from "@/shared/routes"
import { SEO_PAGES, type SitemapEntry } from "@/shared/seo/pages"

// 색인 대상 페이지 목록. 내용은 shared/seo/pages.ts 레지스트리가 정하고 여기서는 절대 주소로 펼치기만 한다.
// priority·changefreq는 구글이 무시하므로 넣지 않는다. 색인 스위치와 상관없이 열어 두고, robots.txt가 이 주소를 알릴지만 바뀐다.
// 품종 상세(DATA_SEO_PAGES)는 데이터 입구에서 품종 목록을 읽어 더한다.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const varieties = await getPriceSource().listVarieties()
  const priceEntries: SitemapEntry[] = varieties.map((variety) => ({ path: routes.price.variety(variety.id) }))
  return [...Object.values(SEO_PAGES).flatMap((entries) => entries()), ...priceEntries].map(
    ({ path, images, lastModified }) => ({
      url: absoluteUrl(path),
      ...(lastModified && { lastModified }),
      ...(images && { images: images.map(absoluteUrl) }),
    })
  )
}
