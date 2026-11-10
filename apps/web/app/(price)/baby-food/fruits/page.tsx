import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"
import { breadcrumb, JsonLd } from "@/shared/seo/json-ld"
import { babyFoodFruitsSeo } from "@/shared/seo/titles"

const seo = babyFoodFruitsSeo()
export const metadata = createMetadata({
  ...seo,
  path: routes.babyFood.fruits,
})

/** 도감 본문은 layout.tsx가 그린다. 페이지는 메타데이터와 구조화 데이터만 맡는다. */
export default function Page() {
  return (
    <JsonLd
      data={breadcrumb([
        { name: "제철달력", path: routes.seasonal.root },
        { name: "월령별 과일 도감", path: routes.babyFood.fruits },
      ])}
    />
  )
}
