import { DOWNLOADS_COPY } from "@workspace/seasonal/data/copy"
import { calendarPreview } from "@workspace/seasonal/print/listing"

import { DownloadsView } from "@/features/seasonal/downloads/downloads-view"
import { DOWNLOADS } from "@/shared/downloads-manifest"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"
import { breadcrumb, JsonLd, webPageWithPrimaryImage } from "@/shared/seo/json-ld"
import { downloadsSeo } from "@/shared/seo/titles"

export const metadata = createMetadata({
  ...downloadsSeo(),
  path: routes.seasonal.downloads,
  ogImage: { title: DOWNLOADS_COPY.title, subtitle: DOWNLOADS_COPY.format, badge: "PDF" },
})

export default function Page() {
  const preview = calendarPreview(DOWNLOADS.editions)
  return (
    <>
      <JsonLd data={breadcrumb([{ name: "제철 음식 달력", path: routes.seasonal.root }, { name: DOWNLOADS_COPY.title, path: routes.seasonal.downloads }])} />
      {preview && <JsonLd data={webPageWithPrimaryImage(routes.seasonal.downloads, preview.thumbnail.path)} />}
      <DownloadsView preview={preview} />
    </>
  )
}
