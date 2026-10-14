import { routes } from "@/shared/routes"

import { NavLink } from "./nav-link"

function SubTabs({ children }: { children: React.ReactNode }) {
  return <nav className="flex gap-5 border-b border-hairline px-5 py-3">{children}</nav>
}

/** 이달 탭의 2차 탭: 이달 | 월별 보기 */
export function ThisMonthTabs() {
  return (
    <SubTabs>
      <NavLink href={routes.seasonal.root} exact>
        이달
      </NavLink>
      <NavLink href={routes.seasonal.months}>월별 보기</NavLink>
    </SubTabs>
  )
}

/** 계절 탭의 2차 탭: 계절 | 명절 (24절기는 MVP 범위 밖) */
export function SeasonTabs() {
  return (
    <SubTabs>
      <NavLink href={routes.seasonal.seasons}>계절</NavLink>
      <NavLink href={routes.seasonal.festivals}>명절</NavLink>
    </SubTabs>
  )
}
