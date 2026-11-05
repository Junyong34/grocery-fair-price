"use client"

import { usePathname } from "next/navigation"

import { MONTHS } from "@workspace/seasonal/data/months"

import { routes } from "@/shared/routes"
import { SectionRow } from "@/shared/shell/section-row"

import { PillLink } from "../components/pill"

/** 제철 회 달 칩(id)이 화면 위로 지나가면 나타나는 얇은 달 칩 줄. 월별(2b)처럼 달을 바꾸는 것이 주 동작이라 끝까지 따라온다. */
export const SASHIMI_MONTHS_ID = "sashimi-months"

export function SashimiChipRow() {
  const pathname = usePathname()
  return (
    <SectionRow
      watch={SASHIMI_MONTHS_ID}
      belowTabs
      label="달 고르기(고정)"
      activeKey={pathname}
    >
      {MONTHS.map((month) => {
        const href = routes.seasonal.sashimiMonth(month)
        return (
          <PillLink key={month} href={href} scroll={false} current={pathname === href}>
            {month}월
          </PillLink>
        )
      })}
    </SectionRow>
  )
}
