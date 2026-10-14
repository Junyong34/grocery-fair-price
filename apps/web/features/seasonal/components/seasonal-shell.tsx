import { routes } from "@/shared/routes"

import { NavLink } from "./nav-link"

/** 제철 영역 공통 셸. 하단 내비(와이어프레임 Floating Nav) 자리와 품종 상세 시트 슬롯을 둔다. */
export function SeasonalShell({
  children,
  sheet,
}: {
  children: React.ReactNode
  sheet: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <main className="flex-1 pb-24">{children}</main>
      <nav
        aria-label="주요 메뉴"
        className="fixed inset-x-0 bottom-4 mx-auto flex w-fit gap-6 rounded-full bg-ink-band-soft px-6 py-3 text-sm [&_a]:text-mute [&_a[aria-current]]:text-canvas"
      >
        <NavLink href={routes.seasonal.root} also={[routes.seasonal.months]} exact>
          이달
        </NavLink>
        <NavLink href={routes.seasonal.seasons} also={[routes.seasonal.festivals]}>
          계절
        </NavLink>
        <NavLink href={routes.seasonal.myTable}>나의 식탁</NavLink>
      </nav>
      {sheet}
    </div>
  )
}
