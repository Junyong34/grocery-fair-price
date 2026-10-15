import { Suspense } from "react"

import { MyTableView } from "@/features/seasonal/my-table/my-table-view"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"

export const metadata = createMetadata({
  title: "나의 식탁",
  description: "올해 맛본 제철 식재료를 기록하고 풍성한 나만의 제철 식탁을 완성해 보세요.",
  path: routes.seasonal.myTable,
  ogImage: {
    title: "나의 식탁",
    subtitle: "올해 맛본 제철 식재료 기록과 나만의 달력",
    badge: "나의 식탁",
  },
})

// 1h 나의 식탁. 올해(서울)와 기기의 기록에 따라 달라지므로 요청 시점 값이 준비된 뒤 그린다.
export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-svh" aria-busy />}>
      <MyTableView />
    </Suspense>
  )
}
