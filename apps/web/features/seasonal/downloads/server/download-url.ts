import "server-only"

import { downloadPath, type ManifestEntry } from "@workspace/seasonal/print/edition"
import type { PublishedPaper } from "@workspace/seasonal/print/spec"

/**
 * 내려받기 주소가 넘겨 줄 PDF 주소. 저장소를 못 쓰면 null(503).
 * 운영은 비공개 R2의 짧은 서명 링크다(ADR 0003, 티켓 06). 개발 서버는 어드민이 생성한 로컬 파일(public/downloads)로 넘긴다.
 */
export async function downloadUrl(edition: ManifestEntry, paper: PublishedPaper): Promise<string | null> {
  if (process.env.NODE_ENV !== "production") return downloadPath(edition.id, paper)
  return null
}
