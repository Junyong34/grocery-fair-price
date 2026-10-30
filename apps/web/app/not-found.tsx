import type { Metadata } from "next"

import { PriceShell } from "@/features/price/components/price-shell"
import { NotFoundView } from "@/shared/not-found-view"

// 어떤 라우트에도 맞지 않는 주소의 404. 루트 레이아웃 바로 안이라 셸이 없어 가격 영역 셸을 씌운다.
// 제철 영역 안의 notFound()는 app/seasonal/not-found.tsx가 받는다. noindex는 Next가 넣는다.
export const metadata: Metadata = { title: "페이지를 찾을 수 없어요" }

export default function NotFound() {
  return (
    <PriceShell>
      <NotFoundView />
    </PriceShell>
  )
}
