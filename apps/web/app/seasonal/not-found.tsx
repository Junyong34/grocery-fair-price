import type { Metadata } from "next"

import { NotFoundView } from "@/shared/not-found-view"

// 제철 영역에서 notFound()가 불렸을 때(없는 품종 · 달 · 계절 등). 셸은 app/seasonal/layout.tsx가 그린다.
export const metadata: Metadata = { title: "페이지를 찾을 수 없어요" }

export default function SeasonalNotFound() {
  return <NotFoundView />
}
