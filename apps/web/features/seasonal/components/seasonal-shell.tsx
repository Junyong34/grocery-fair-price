import { Suspense } from "react"

import { DesktopSearchButton, MobileSearchButton } from "../search/food-search"
import { ActiveMonthLabel } from "../this-month/month-jump"
import {
  DesktopSettingsButton,
  MobileSettingsButton,
} from "../this-month/settings-panel"
import { FloatingNav, SeasonalHeader } from "./main-nav"
import { ThisMonthOnly } from "./this-month-only"

/**
 * 제철 영역 공통 셸. 위에 늘 붙은 헤더(로고·검색·설정), 모바일은 하단 Floating Nav, 데스크톱은 헤더 안 주요 메뉴.
 * 2차 탭은 라우트 그룹 레이아웃((this-month), (season))이 헤더 아래에 그린다. sheet는 품종 상세 가로채기 슬롯이다.
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
        context={
          <ThisMonthOnly>
            <Suspense>
              <ActiveMonthLabel />
            </Suspense>
          </ThisMonthOnly>
        }
        actions={
          <>
            <div className="contents lg:hidden">
              <MobileSearchButton />
              <ThisMonthOnly>
                <MobileSettingsButton />
              </ThisMonthOnly>
            </div>
            <div className="hidden lg:contents">
              <DesktopSearchButton />
              <ThisMonthOnly>
                <DesktopSettingsButton />
              </ThisMonthOnly>
            </div>
          </>
        }
      />
      <main className="flex-1 pb-28 lg:pb-12">{children}</main>
      <FloatingNav />
      {sheet}
    </div>
  )
}
