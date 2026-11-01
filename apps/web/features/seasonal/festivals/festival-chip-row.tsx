"use client"

import { usePathname } from "next/navigation"

import { FESTIVALS } from "@workspace/seasonal/data/festivals"

import { routes } from "@/shared/routes"
import { SectionChip, SectionRow } from "@/shared/shell/section-row"

/** 1g 명절 칩(id)이 화면 위로 지나가면 나타나는 얇은 명절 칩 줄. */
export const FESTIVAL_CHIPS_ID = "festival-chips"

export function FestivalChipRow() {
  const pathname = usePathname()
  return (
    <SectionRow watch={FESTIVAL_CHIPS_ID} belowTabs label="명절 고르기(고정)">
      {FESTIVALS.map((festival) => {
        const href = routes.seasonal.festival(festival.slug)
        return (
          <SectionChip key={festival.slug} href={href} current={pathname === href}>
            {festival.name}
          </SectionChip>
        )
      })}
    </SectionRow>
  )
}
