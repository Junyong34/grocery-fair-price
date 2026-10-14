import { Suspense } from "react"

import { MyTableView } from "@/features/seasonal/my-table/my-table-view"

// 1h 나의 식탁. 올해(서울)와 기기의 기록에 따라 달라지므로 요청 시점 값이 준비된 뒤 그린다.
export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-svh" aria-busy />}>
      <MyTableView />
    </Suspense>
  )
}
