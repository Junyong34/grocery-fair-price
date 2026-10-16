import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { FOODS, findFood } from "@workspace/seasonal/data/foods"
import { formatSeasonMonths } from "@workspace/seasonal/data/months"

import { ShareButton } from "@/features/seasonal/components/share-button"
import { FoodDetail } from "@/features/seasonal/food-detail/food-detail"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"
import { breadcrumb, JsonLd } from "@/shared/seo/json-ld"
import { foodSeo } from "@/shared/seo/titles"

type Params = PageProps<"/seasonal/foods/[food]">["params"]

// 모든 품종을 빌드 때 만든다. 목록 밖 id는 notFound()로 막는다(Cache Components에서는 dynamicParams를 쓸 수 없다).
export function generateStaticParams() {
  return FOODS.map((food) => ({ food: food.id }))
}

export async function generateMetadata(
  props: PageProps<"/seasonal/foods/[food]">
): Promise<Metadata> {
  const food = findFood((await props.params).food)
  if (!food) return {}
  // formatSeasonMonths는 "제철 10·11월"처럼 "제철"까지 붙여 준다.
  const seasonText = formatSeasonMonths(food.months)
  return createMetadata({
    ...foodSeo(food),
    path: routes.seasonal.food(food.id),
    ogImage: { title: food.name, subtitle: seasonText, badge: "제철 식재료" },
  })
}

// 주소로 직접 열거나 새로고침했을 때 보이는 전체 페이지. 제철 화면 안에서 누르면 @sheet가 가로챈다.
export default function Page(props: PageProps<"/seasonal/foods/[food]">) {
  return (
    <Suspense fallback={<div className="min-h-svh" aria-busy />}>
      <Food params={props.params} />
    </Suspense>
  )
}

async function Food({ params }: { params: Params }) {
  const food = findFood((await params).food)
  if (!food) notFound()
  return (
    <article className="mx-auto flex max-w-[560px] flex-col gap-4 px-[18px] pt-6 lg:pt-10">
      {/* 시트(@sheet)에는 넣지 않는다. 크롤러는 주소를 직접 열어 이 전체 페이지를 본다. */}
      <JsonLd data={breadcrumb([{ name: foodSeo(food).title, path: routes.seasonal.food(food.id) }])} />
      <div className="flex items-center justify-between gap-3">
        <Link href={routes.seasonal.root} className="text-sm text-stone">
          ‹ 이달의 제철
        </Link>
        {/* 시트는 시트 제목 줄에 공유가 있다. 전체 페이지는 맨 위 줄 오른쪽에 둔다. */}
        <ShareButton className="-mr-2.5 shrink-0" />
      </div>
      <FoodDetail food={food} title={<h1 className="font-heading text-[36px] leading-tight font-bold">{food.name}</h1>} />
    </article>
  )
}
