import { SiteShell } from "@/shared/shell/site-shell"

import { BasketBadge } from "./basket-badge"

/** 가격 영역 셸: 사이트 공통 셸에 가격 메뉴(시세 · 제철달력 · 담은 품종)를 넣는다. */
export function PriceShell({ children }: { children: React.ReactNode }) {
  return (
    <SiteShell area="price" badges={{ basket: <BasketBadge /> }}>
      {children}
    </SiteShell>
  )
}
