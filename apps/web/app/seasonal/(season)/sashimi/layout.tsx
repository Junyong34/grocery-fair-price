import { MONTHS } from "@workspace/seasonal/data/months"

import { SeasonalMonthChips } from "@/features/seasonal/components/seasonal-month-chips"
import {
  SASHIMI_MONTHS_ID,
  SashimiChipRow,
} from "@/features/seasonal/sashimi/sashimi-chip-row"
import { routes } from "@/shared/routes"

// 제철 회 레이아웃. 달 칩은 달을 바꿔도 남아 있어(가로 스크롤 위치 유지) 페이지 밖에 둔다.
export default function SashimiLayout({
  children,
}: LayoutProps<"/seasonal/sashimi">) {
  return (
    <>
      <SeasonalMonthChips
        id={SASHIMI_MONTHS_ID}
        hrefs={MONTHS.map(routes.seasonal.sashimiMonth)}
        preserveScroll
      />
      <SashimiChipRow />
      {children}
    </>
  )
}
