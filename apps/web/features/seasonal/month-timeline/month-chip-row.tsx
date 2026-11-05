"use client"

import { usePathname } from "next/navigation"

import { routes } from "@/shared/routes"
import { SectionRow } from "@/shared/shell/section-row"

import { PillLink } from "../components/pill"

/** 2b 타임라인(id)이 화면 위로 지나가면 나타나는 얇은 달 칩 줄. 달을 바꾸는 것이 이 화면의 주 동작이라 끝까지 따라온다. */
export const MONTH_TIMELINE_ID = "month-timeline"

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

export function MonthChipRow() {
  const pathname = usePathname()
  return (
    <SectionRow
      watch={MONTH_TIMELINE_ID}
      belowTabs
      label="달 고르기(고정)"
      activeKey={pathname}
    >
      {MONTHS.map((month) => {
        const href = routes.seasonal.month(month)
        return (
          <PillLink key={month} href={href} current={pathname === href}>
            {month}월
          </PillLink>
        )
      })}
    </SectionRow>
  )
}
