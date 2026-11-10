import { DOWNLOADS_COPY } from "@workspace/seasonal/data/copy"

import { DownloadsView } from "@/features/seasonal/downloads/downloads-view"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"
import { breadcrumb, JsonLd } from "@/shared/seo/json-ld"
import { downloadsSeo } from "@/shared/seo/titles"

export const metadata = createMetadata({
  ...downloadsSeo(),
  path: routes.seasonal.downloads,
  ogImage: { title: DOWNLOADS_COPY.title, subtitle: DOWNLOADS_COPY.format, badge: "PDF" },
})

export default function Page() {
  return (
    <>
      <JsonLd data={breadcrumb([{ name: "제철 음식 달력", path: routes.seasonal.root }, { name: DOWNLOADS_COPY.title, path: routes.seasonal.downloads }])} />
      <DownloadsView />
    </>
  )
}
