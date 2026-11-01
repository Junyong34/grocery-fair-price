import { routes } from "@/shared/routes"
import { SearchLink } from "@/shared/shell/search-link"
import { SettingsLink } from "@/shared/shell/settings-link"
import { SiteShell } from "@/shared/shell/site-shell"

import { BasketBadge } from "./basket-badge"

/** 가격 영역 셸: 사이트 공통 셸에 담은 품종 배지와 루트 헤더 버튼(🔍 · ⚙)을 넣는다. */
export function PriceShell({ children }: { children: React.ReactNode }) {
  return (
    <SiteShell
      badges={{ basket: <BasketBadge /> }}
      actions={
        <>
          <SearchLink href={routes.price.search} label="품종 검색" />
          <SettingsLink />
        </>
      }
    >
      {children}
    </SiteShell>
  )
}
