import type { MenuArea } from "./menus"
import { FloatingNav, SiteHeader, type MenuBadges } from "./site-nav"

/**
 * 가격과 제철이 같이 쓰는 셸: 위에 붙은 헤더, 모바일 하단 Floating Nav, 데스크톱 헤더 안 주요 메뉴.
 * 메뉴는 area로 고르고, 화면별 헤더 버튼(actions) · 2차 탭(tabs) · 메뉴 배지(badges)는 영역 레이아웃이 넣는다.
 */
export function SiteShell({
  area,
  badges,
  actions,
  tabs,
  children,
}: {
  area: MenuArea
  badges?: MenuBadges
  actions?: React.ReactNode
  tabs?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader area={area} badges={badges} actions={actions} tabs={tabs} />
      <main className="flex-1 pb-28 lg:pb-12">{children}</main>
      <FloatingNav area={area} badges={badges} />
    </div>
  )
}
