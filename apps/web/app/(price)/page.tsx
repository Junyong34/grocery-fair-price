import { getPriceSource } from "@/features/price/data/price-source"
import { HomeView } from "@/features/price/home/home-view"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"
import { JsonLd, organization, website } from "@/shared/seo/json-ld"
import { homeSeo } from "@/shared/seo/titles"

export const metadata = createMetadata({
  ...homeSeo(),
  path: routes.home,
  ogImage: { title: "지금 사도 될까?", subtitle: "오늘 시세를 평소 가격과 견줘 봐요", badge: "시세" },
})

// P1 시세 메인. 목록은 데이터 입구(getPriceSource)에서 읽어 내려 준다.
export default async function Page() {
  const source = getPriceSource()
  const [varieties, featuredIds] = await Promise.all([source.listVarieties(), source.featuredIds()])
  return (
    <>
      {/* 사이트 이름·로고. 구글은 홈에서만 읽으므로 routes.home인 이 페이지에만 둔다. */}
      <JsonLd data={[website(), organization()]} />
      <HomeView varieties={varieties} featuredIds={featuredIds} />
    </>
  )
}
