import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { FOODS, findFood } from "@workspace/seasonal/data/foods"

import { FoodDetail } from "@/features/seasonal/food-detail/food-detail"
import { routes } from "@/shared/routes"

type Params = PageProps<"/seasonal/foods/[food]">["params"]

// 모든 품종을 빌드 때 만든다. 목록 밖 id는 notFound()로 막는다(Cache Components에서는 dynamicParams를 쓸 수 없다).
export function generateStaticParams() {
  return FOODS.map((food) => ({ food: food.id }))
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
      <Link href={routes.seasonal.root} className="text-sm text-stone">
        ‹ 이달의 제철
      </Link>
      <FoodDetail food={food} title={<h1 className="font-heading text-[36px] leading-tight font-bold">{food.name}</h1>} />
    </article>
  )
}
