import { BasketBadge } from "@/features/price/components/basket-badge"
import { SeasonalShell } from "@/features/seasonal/components/seasonal-shell"

// 오늘(서울)은 요청 때 서버가 계산하지 않는다. 그래서 /seasonal 페이지는 구멍 없는 정적 페이지다(.scratch/seasonal-render-perf/spec.md 6.2).
// 작은 오늘 표시는 shared/today-mark(첫 그리기 전 CSS), 날짜에 따른 내용은 useSeoulToday()(하이드레이션 뒤)로 그린다.
export default function SeasonalLayout({ children, sheet }: LayoutProps<"/seasonal">) {
  return <SeasonalShell sheet={sheet} badges={{ basket: <BasketBadge /> }}>{children}</SeasonalShell>
}
