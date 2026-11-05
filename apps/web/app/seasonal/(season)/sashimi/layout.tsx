import { MonthSwipeArea } from "@/features/seasonal/components/month-swipe-area"
import { SashimiMonthChips } from "@/features/seasonal/sashimi/sashimi-month-chips"

// 제철 회 레이아웃. 달 칩은 달을 바꿔도 남아 있어(가로 스크롤 위치 유지) 페이지 밖에 둔다.
export default function SashimiLayout({
  children,
}: LayoutProps<"/seasonal/sashimi">) {
  return (
    <>
      <SashimiMonthChips />
      <MonthSwipeArea route="sashimiMonth">{children}</MonthSwipeArea>
    </>
  )
}
