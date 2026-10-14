import { notFound } from "next/navigation"
import { Suspense } from "react"

import { isMonth, MONTHS, type Month } from "@workspace/seasonal/data/months"

import { MonthView } from "@/features/seasonal/month-timeline/month-view"

type Params = PageProps<"/seasonal/months/[month]">["params"]

export function generateStaticParams() {
  return MONTHS.map((month) => ({ month: String(month) }))
}

// params는 URL 데이터라 <Suspense> 밖에서 읽으면 이동이 즉시 일어나지 않는다(instant navigation 검사).
// 페이지 틀은 바로 보내고, params를 쓰는 부분만 Suspense 안에 둔다.
export default function Page(props: PageProps<"/seasonal/months/[month]">) {
  return (
    <Suspense fallback={<div className="min-h-svh" aria-busy />}>
      <Month params={props.params} />
    </Suspense>
  )
}

async function Month({ params }: { params: Params }) {
  const { month } = await params
  if (!isMonth(month)) notFound()
  return <MonthView month={Number(month) as Month} />
}
