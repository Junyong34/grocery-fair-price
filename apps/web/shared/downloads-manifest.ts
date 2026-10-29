import type { DownloadManifest, ManifestEntry, WithdrawnEntry } from "@workspace/seasonal/print/edition"

import manifest from "@/public/downloads/manifest.json"

// 운영자가 어드민에서 게시한 에디션 목록(public/downloads/manifest.json). 빌드 때 읽는다.
// 내려받기 화면과 sitemap이 같이 쓰므로 shared에 둔다(.scratch/calendar-download/spec.md).
export const DOWNLOADS = manifest as DownloadManifest

export function findEdition(id: string): ManifestEntry | undefined {
  return DOWNLOADS.editions.find((edition) => edition.id === id)
}


export function findWithdrawn(id: string): WithdrawnEntry | undefined {
  return DOWNLOADS.withdrawn.find((edition) => edition.id === id)
}
