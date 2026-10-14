import Link from "next/link"

import { routes } from "@/shared/routes"

import { FloatingNav, TopNav } from "./main-nav"

/**
 * 제철 영역 공통 셸. 모바일은 위 헤더 + 하단 Floating Nav, 데스크톱은 상단 바.
 * 2차 탭은 라우트 그룹 레이아웃((this-month), (season))이 그린다. sheet는 품종 상세 가로채기 슬롯이다.
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
      <TopNav />
      <header className="flex h-14 items-center justify-between px-[18px] lg:hidden">
        <Link href={routes.seasonal.root} className="font-heading text-xl font-bold text-ink no-underline">
          제철달력
        </Link>
      </header>
      <main className="flex-1 pb-28 lg:pb-12">{children}</main>
      <FloatingNav />
      {sheet}
    </div>
  )
}
