import { DOWNLOADS_COPY } from "@workspace/seasonal/data/copy"

import { DownloadsView } from "@/features/seasonal/downloads/downloads-view"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"

export const metadata = createMetadata({
  title: DOWNLOADS_COPY.title,
  description: "제철 음식 달력과 계절·월별 제철 포스터를 A4·A3 PDF로 내려받아 인쇄하세요.",
  path: routes.seasonal.downloads,
  ogImage: { title: DOWNLOADS_COPY.title, subtitle: "A4·A3 PDF 제철 달력과 포스터", badge: "PDF" },
})

export default function Page() {
  return <DownloadsView />
}
