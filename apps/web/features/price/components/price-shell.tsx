import { SiteShell } from "@/shared/shell/site-shell"

import { BasketBadge } from "./basket-badge"

/** 가격 영역 셸: 사이트 공통 셸에 담은 품종 배지를 넣는다. */
export function PriceShell({ children }: { children: React.ReactNode }) {
  return (
    <SiteShell badges={{ basket: <BasketBadge /> }}>
      {children}
    </SiteShell>
  )
}
