import { SeasonalShell } from "@/features/seasonal/components/seasonal-shell"
import { getSeoulToday } from "@/shared/today"
import { TodayProvider } from "@/shared/today-context"

export default function SeasonalLayout({ children, sheet }: LayoutProps<"/seasonal">) {
  // 오늘은 await하지 않고 Promise로 넘긴다. 읽는 쪽(먹음 기록 토글 등)만 <Suspense> 안에서 기다린다.
  return (
    <TodayProvider today={getSeoulToday()}>
      <SeasonalShell sheet={sheet}>{children}</SeasonalShell>
    </TodayProvider>
  )
}
