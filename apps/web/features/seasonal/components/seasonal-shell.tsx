import type { MenuBadges } from "@/shared/shell/site-nav"
import { SiteShell } from "@/shared/shell/site-shell"

import { DesktopSearchButton, MobileSearchButton } from "../search/food-search"
import { SettingsLink } from "./settings-link"

/**
 * 제철 영역 셸. 사이트 공통 셸(헤더 · 하단 내비)에 헤더 버튼(검색 · 설정)을 넣는다. 메뉴 배지(담은 개수)는 라우트 레이아웃이 badges로 넣는다.
 * 제철달력 탭은 라우트 그룹 레이아웃((this-month), (season))이 헤더 아래에 고정해 그린다. sheet는 품종 상세 가로채기 슬롯이다.
 */
export function SeasonalShell({
  children,
  sheet,
  badges,
}: {
  children: React.ReactNode
  sheet: React.ReactNode
  badges?: MenuBadges
}) {
  return (
    <>
      <SiteShell
        badges={badges}
        // 검색·⚙는 모바일과 데스크톱 모양이 달라 둘 다 그리고 CSS로 하나만 보인다. 공유는 헤더가 아니라 공유할 대상(월·계절·명절·품종 상세)의 제목 줄에 둔다.
        actions={
          <>
            <div className="contents lg:hidden">
              <MobileSearchButton />
            </div>
            <div className="hidden lg:contents">
              <DesktopSearchButton />
            </div>
            <SettingsLink />
          </>
        }
      >
        {children}
      </SiteShell>
      {sheet}
    </>
  )
}
