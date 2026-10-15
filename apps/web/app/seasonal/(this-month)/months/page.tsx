import { MonthsIndex } from "@/features/seasonal/month-timeline/months-index"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"

export const metadata = createMetadata({
  title: "월별 보기",
  description: "1월부터 12월까지 열두 달의 제철 식재료 타임라인을 확인하세요.",
  path: routes.seasonal.months,
  ogImage: {
    title: "열두 달 제철 타임라인",
    subtitle: "1월부터 12월까지 언제 뭐가 맛있을까",
    badge: "월별 보기",
  },
})

export default function Page() {
  return <MonthsIndex />
}
