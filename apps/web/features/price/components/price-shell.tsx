import { SettingsLink } from "@/shared/shell/settings-link"
import { SiteShell } from "@/shared/shell/site-shell"

import { BasketBadge } from "./basket-badge"
import { HeaderSearchLink } from "./header-search-link"

/** 가격 영역 셸: 사이트 공통 셸에 담은 품종 배지와 루트 헤더 버튼(🔍 · ⚙)을 넣는다. 🔍는 P1에서 뺀다(HeaderSearchLink). */
export function PriceShell({ children }: { children: React.ReactNode }) {
  return (
    <SiteShell
      badges={{ basket: <BasketBadge /> }}
      actions={
        <>
          <HeaderSearchLink />
          <SettingsLink />
        </>
      }
    >
      {children}
    </SiteShell>
  )
}
