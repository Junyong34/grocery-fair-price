import { DesktopSearchButton, MobileSearchButton } from "../search/food-search"
import {
  DesktopSettingsButton,
  MobileSettingsButton,
} from "../this-month/settings-panel"
import { FloatingNav, SeasonalHeader } from "./main-nav"
import { HeaderShareButton } from "./share-button"
import { HeaderSubTabs } from "./sub-tabs"
import { ThisMonthOnly } from "./this-month-only"

/**
 * 제철 영역 공통 셸. 위에 늘 붙은 헤더(로고·검색·공유·설정. 나의 식탁은 공유 없음), 모바일은 하단 Floating Nav, 데스크톱은 헤더 안 주요 메뉴.
 * 2차 탭은 라우트 그룹 레이아웃((this-month), (season))이 헤더 아래에 그리고, 헤더가 떠 있을 때는 헤더 안에도 작게 보인다. sheet는 품종 상세 가로채기 슬롯이다.
 */
export function SeasonalShell({
  children,
  sheet,
}: {
  children: React.ReactNode
  sheet: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <SeasonalHeader
        tabs={<HeaderSubTabs />}
        // 검색·⚙는 모바일과 데스크톱 모양이 달라 둘 다 그리고 CSS로 하나만 보인다. 공유는 같은 버튼 하나를 쓴다.
        actions={
          <>
            <div className="contents lg:hidden">
              <MobileSearchButton />
            </div>
            <div className="hidden lg:contents">
              <DesktopSearchButton />
            </div>
            <HeaderShareButton />
            <ThisMonthOnly>
              <div className="contents lg:hidden">
                <MobileSettingsButton />
              </div>
              <div className="hidden lg:contents">
                <DesktopSettingsButton />
              </div>
            </ThisMonthOnly>
          </>
        }
      />
      <main className="flex-1 pb-28 lg:pb-12">{children}</main>
      <FloatingNav />
      {sheet}
    </div>
  )
}
