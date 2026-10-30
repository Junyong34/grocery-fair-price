import type { DownloadManifest, ManifestEntry } from "./edition"
import { PRINT_KIND_LABELS, PRINT_KINDS, PUBLISHED_PAPERS, type PrintKind, type PublishedPaper } from "./spec"

// 내려받기 화면(목록 2-C, 상세 3-B)이 매니페스트를 보여 주는 규칙. .scratch/calendar-download/spec.md

export type Shelf = { kind: PrintKind; editions: ManifestEntry[] }

/** 종류별 줄. 종류 순서는 PRINT_KINDS, 줄 안은 새 연도가 앞(연도 없는 종류는 id 순서). */
export function shelvesOf(editions: readonly ManifestEntry[]): Shelf[] {
  return PRINT_KINDS.map((kind) => ({
    kind,
    editions: editions
      .filter((edition) => edition.kind === kind)
      .sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.id.localeCompare(b.id)),
  })).filter((shelf) => shelf.editions.length > 0)
}

/** 줄 밖에서 쓰는 이름. 줄 안의 칸은 종류가 줄 제목에 있어 제목만 쓴다. */
export function editionName({ kind, title }: Pick<ManifestEntry, "kind" | "title">): string {
  return `${title} ${PRINT_KIND_LABELS[kind]}`
}

export const megabytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)}MB`

const ORIENTATION_LABELS = { portrait: "세로", landscape: "가로" } as const

/** 상세의 한 줄 정보. 공개 용지는 A4 하나다. */
export function editionMeta(edition: ManifestEntry): string[] {
  return [`A4 ${ORIENTATION_LABELS[edition.orientation]}`, `${edition.pages}쪽`, megabytes(edition.files.A4.bytes)]
}

export type DownloadTarget = { type: "file"; edition: ManifestEntry; paper: PublishedPaper } | { type: "withdrawn"; id: string } | { type: "missing" }

/** 내려받기 주소(/seasonal/downloads/<id>/<용지>)가 가리키는 것. paper는 주소의 소문자 용지다. */
export function resolveDownload(manifest: DownloadManifest, id: string, paper: string): DownloadTarget {
  if (manifest.withdrawn.some((edition) => edition.id === id)) return { type: "withdrawn", id }
  const edition = manifest.editions.find((edition) => edition.id === id)
  const published = PUBLISHED_PAPERS.find((candidate) => candidate.toLowerCase() === paper)
  return edition && published ? { type: "file", edition, paper: published } : { type: "missing" }
}

/** 내린 에디션 대신 안내할 것: 같은 종류에서 가장 새것(shelvesOf의 줄 순서 첫째). */
export function replacementFor({ kind }: Pick<ManifestEntry, "kind">, editions: readonly ManifestEntry[]): ManifestEntry | undefined {
  return shelvesOf(editions.filter((edition) => edition.kind === kind))[0]?.editions[0]
}

/** 저장되는 PDF 파일 이름 */
export function downloadFileName(edition: Pick<ManifestEntry, "kind" | "title">, paper: PublishedPaper): string {
  return `${editionName(edition)} ${paper}.pdf`
}

/**
 * 저장소 서명 링크에 넣는 Content-Disposition. 링크의 download 속성은 다른 출처로 302되면 무시되므로 여기서 이름을 정한다.
 * 한글 이름은 filename*(RFC 5987), 이를 못 읽는 클라이언트용 영문 이름은 filename에 둔다.
 */
export function attachmentDisposition(edition: Pick<ManifestEntry, "id" | "kind" | "title">, paper: PublishedPaper): string {
  const encoded = encodeURIComponent(downloadFileName(edition, paper)).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
  return `attachment; filename="${edition.id}-${paper.toLowerCase()}.pdf"; filename*=UTF-8''${encoded}`
}

/** 2a · 2b 입구 카드의 대표 에디션. 첫 줄(월간 달력이 있으면 그 줄)의 첫째. */
export function featuredEdition(editions: readonly ManifestEntry[]): ManifestEntry | undefined {
  return shelvesOf(editions)[0]?.editions[0]
}
