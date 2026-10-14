import { Suspense } from "react"

import { ScreenStub } from "@/features/seasonal/components/screen-stub"

type Params = PageProps<"/seasonal/foods/[food]">["params"]

// 빌드 때 미리 만들 품종 id. 목록 밖 id는 첫 요청 때 렌더된다(Cache Components에서는 dynamicParams를 쓸 수 없다).
// TODO: 품종 데이터 모듈이 생기면 전체 품종 id로 바꾸고, 없는 id는 notFound()로 막는다.
//       id는 일러스트 카탈로그(foods/<id>)와 같은 영문 kebab-case다.
export function generateStaticParams() {
  return [{ food: "apple" }, { food: "shrimp" }, { food: "persimmon" }]
}

// 주소로 직접 열거나 새로고침했을 때 보이는 전체 페이지. 제철 화면 안에서 누르면 @sheet가 가로챈다.
export default function Page(props: PageProps<"/seasonal/foods/[food]">) {
  return (
    <Suspense fallback={<ScreenStub id="1i" title="품종 상세" />}>
      <Food params={props.params} />
    </Suspense>
  )
}

async function Food({ params }: { params: Params }) {
  const { food } = await params
  return <ScreenStub id="1i" title={`품종 상세 · ${food}`} />
}
