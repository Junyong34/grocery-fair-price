import { MonthTimeline } from "@/features/seasonal/month-timeline/month-timeline"

// 2b 레이아웃. 타임라인은 달을 바꿔도 남아 있어(가로 스크롤 위치 유지) 페이지 밖에 둔다.
export default function MonthsLayout({
  children,
}: LayoutProps<"/seasonal/months">) {
  return (
    <>
      <MonthTimeline />
      {children}
    </>
  )
}
