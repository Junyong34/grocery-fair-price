import { Suspense } from "react"

import { FoodSheet } from "@/features/seasonal/components/food-sheet"

export { generateStaticParams } from "../../../foods/[food]/page"

type Params = PageProps<"/seasonal/foods/[food]">["params"]

// 제철 화면 안에서 /seasonal/foods/[food]로 이동하면 페이지 대신 이 하단 시트가 뜬다(인터셉팅 라우트).
export default function Page(props: PageProps<"/seasonal/foods/[food]">) {
  return (
    <Suspense>
      <Sheet params={props.params} />
    </Suspense>
  )
}

async function Sheet({ params }: { params: Params }) {
  const { food } = await params
  return <FoodSheet id={food} />
}
