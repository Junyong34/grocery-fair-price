import { DOWNLOADS_COPY } from "@workspace/seasonal/data/copy"
import type { ManifestEntry } from "@workspace/seasonal/print/edition"

import { routes } from "@/shared/routes"

const megabytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)}MB`

/** 에디션 하나의 내려받기 링크. 공개 용지는 A4 하나다. */
export function EditionDownloads({ edition }: { edition: ManifestEntry }) {
  return (
    <a href={routes.seasonal.downloadFile(edition.id, "A4")} download className="self-start rounded-full bg-ink px-4 py-2 text-sm text-canvas no-underline">
      {DOWNLOADS_COPY.all(edition.kind === "monthly" ? "monthly" : "single")}
      <span className="ml-1.5 text-xs opacity-70">{megabytes(edition.files.A4.bytes)}</span>
    </a>
  )
}
