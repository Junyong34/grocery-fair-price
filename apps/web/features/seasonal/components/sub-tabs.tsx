import { routes } from "@/shared/routes"

import { NavLink } from "./nav-link"

// 2차 탭(명세 2.1). 선택 탭은 굵게, 아래 2px 밑줄.
function SubTabs({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <nav aria-label={label} className="border-b border-hairline">
      <div className="mx-auto flex max-w-[1080px] gap-5 px-[18px] lg:px-6">{children}</div>
    </nav>
  )
}

function SubTab(props: React.ComponentProps<typeof NavLink>) {
  return (
    <NavLink
      {...props}
      className="py-2.5 text-base text-stone hover:text-ink aria-[current=page]:font-semibold aria-[current=page]:text-ink aria-[current=page]:shadow-[inset_0_-2px_0_var(--color-ink)]"
    />
  )
}

/** 이달 탭의 2차 탭: 이달 | 월별 보기 */
export function ThisMonthTabs() {
  return (
    <SubTabs label="이달 보기 방식">
      <SubTab href={routes.seasonal.root} exact>
        이달
      </SubTab>
      <SubTab href={routes.seasonal.months}>월별 보기</SubTab>
    </SubTabs>
  )
}

/** 계절 탭의 2차 탭: 계절 | 명절 (24절기는 MVP 범위 밖) */
export function SeasonTabs() {
  return (
    <SubTabs label="계절 보기 방식">
      <SubTab href={routes.seasonal.seasons}>계절</SubTab>
      <SubTab href={routes.seasonal.festivals}>명절</SubTab>
    </SubTabs>
  )
}
