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
      {/* 키보드 사용자가 헤더 메뉴를 건너뛰고 본문으로 가는 링크. 초점을 받을 때만 보인다. */}
      <a
        href="#main"
        className="sr-only rounded-full bg-ink text-sm font-semibold text-canvas no-underline focus:not-sr-only focus:fixed focus:px-4 focus:py-2 focus:top-2 focus:left-2 focus:z-(--z-tooltip) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        본문으로 건너뛰기
      </a>
      <SiteHeader area={area} badges={badges} actions={actions} tabs={tabs} />
      <main id="main" tabIndex={-1} className="flex-1 pb-28 outline-none lg:pb-12">
        {children}
      </main>
      <FloatingNav area={area} badges={badges} />
    </div>
  )
}
