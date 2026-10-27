import { SiteShell } from "@/shared/shell/site-shell"

import { PriceStores } from "../stores/price-stores"

/** 가격 영역 셸: 사이트 공통 셸에 가격 메뉴(시세 · 제철달력 · 담은 품종)를 넣고, 기기 저장 store를 불러온다. */
export function PriceShell({ children }: { children: React.ReactNode }) {
  return (
    <SiteShell area="price">
      <PriceStores />
      {children}
    </SiteShell>
  )
}
