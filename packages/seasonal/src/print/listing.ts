import type { ManifestEntry } from "./edition"
import { PRINT_KIND_LABELS, PRINT_KINDS, type PrintKind } from "./spec"

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
