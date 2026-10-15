import Link from "next/link"

import { MonthTimeline } from "@/features/seasonal/month-timeline/month-timeline"
import { routes } from "@/shared/routes"

// 2b 그 달 상세 레이아웃. 타임라인은 달을 바꿔도 남아 있어(가로 스크롤 위치 유지) 페이지 밖에 둔다.
// 열두 달 카드 목록(/seasonal/months)에는 타임라인이 없어 라우트 그룹으로 나눴다.
export default function MonthsLayout({
  children,
}: LayoutProps<"/seasonal/months">) {
  return (
    <>
      <div className="mx-auto max-w-[1080px] px-[18px] pt-1 lg:px-6">
        <Link href={routes.seasonal.months} className="inline-block py-1 text-sm text-stone no-underline hover:text-ink">
          ← 열두 달
        </Link>
      </div>
      <MonthTimeline />
      {children}
    </>
  )
}
