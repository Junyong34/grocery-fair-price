import { MonthsIndex } from "@/features/seasonal/month-timeline/months-index"
import { createMetadata } from "@/shared/meta"
import { monthsIndexSeo } from "@/shared/seo/titles"
import { routes } from "@/shared/routes"

export const metadata = createMetadata({
  ...monthsIndexSeo(),
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
