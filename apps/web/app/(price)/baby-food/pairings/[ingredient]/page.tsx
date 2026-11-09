import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { findPairing, isPairingPageIndexable, PAIRINGS } from "@workspace/seasonal/data/infant-pairings"

import { IngredientDetail } from "@/features/baby-food/ingredient-detail"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"
import { breadcrumb, JsonLd } from "@/shared/seo/json-ld"
import { babyFoodIngredientSeo } from "@/shared/seo/titles"

type Props = PageProps<"/baby-food/pairings/[ingredient]">

// 31개 기준 재료를 빌드 때 만든다. 목록 밖 id는 notFound()로 막는다(Cache Components에서는 dynamicParams를 쓸 수 없다).
export function generateStaticParams() {
  return PAIRINGS.map(({ id }) => ({ ingredient: id }))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const row = findPairing((await props.params).ingredient)
  if (!row) return {}
  const seo = babyFoodIngredientSeo(row)
  return createMetadata({
    ...seo,
    path: routes.babyFood.ingredient(row.id),
    ogImage: { title: seo.title.split(" · ")[0], badge: "이유식" },
    // 관계가 적은 재료는 페이지만 두고 색인하지 않는다. sitemap(shared/seo/pages.ts)도 같은 함수로 거른다.
    noIndex: !isPairingPageIndexable(row),
  })
}

export default function Page(props: Props) {
  return (
    <Suspense fallback={<div className="min-h-svh" aria-busy />}>
      <Ingredient params={props.params} />
    </Suspense>
  )
}

async function Ingredient({ params }: { params: Props["params"] }) {
  const row = findPairing((await params).ingredient)
  if (!row) notFound()
  return (
    <>
      <JsonLd
        data={breadcrumb([
          { name: "제철달력", path: routes.seasonal.root },
          { name: "이유식 재료 궁합표", path: routes.babyFood.pairings },
          { name: babyFoodIngredientSeo(row).title.split(" · ")[0]!, path: routes.babyFood.ingredient(row.id) },
        ])}
      />
      <IngredientDetail row={row} />
    </>
  )
}
