import { Suspense } from "react"

import { findFood } from "@workspace/seasonal/data/foods"

import { DetailSheet } from "@/features/seasonal/components/detail-sheet"
import { FoodDetail } from "@/features/seasonal/food-detail/food-detail"

// 메타데이터도 전체 페이지와 같다. 없으면 시트를 열었을 때 탭 제목·설명·canonical이 사이트 기본값으로 바뀐다.
export { generateMetadata, generateStaticParams } from "../../../foods/[food]/page"

type Params = PageProps<"/seasonal/foods/[food]">["params"]

// 제철 화면 안에서 /seasonal/foods/[food]로 이동하면 페이지 대신 이 시트가 뜬다(인터셉팅 라우트).
export default function Page(props: PageProps<"/seasonal/foods/[food]">) {
  return (
    <Suspense>
      <Sheet params={props.params} />
    </Suspense>
  )
}

async function Sheet({ params }: { params: Params }) {
  const food = findFood((await params).food)
  // 없는 품종이면 시트를 띄우지 않는다. 주소로 직접 열면 전체 페이지가 404를 낸다.
  if (!food) return null
  return (
    <DetailSheet title={food.name}>
      <FoodDetail food={food} />
    </DetailSheet>
  )
}
