import { z } from "zod"

import { pageCount, parsePrintSpec, PUBLISHED_PAPERS, specHash, type Orientation, type Paper, type PrintKind, type PrintSpec, type PublishedPaper } from "./spec"

// 에디션: 이름이 붙은 인쇄 사양 하나. 원본은 apps/web/print-editions/<id>.json(git), 결과 PDF·썸네일은 public/downloads/<id>/.
// 사용자 다운로드 화면은 생성기가 쓰는 public/downloads/manifest.json만 읽는다(.scratch/calendar-download/spec.md).

/** withdrawn: 내린 에디션. 목록에서 빠지고, 옛 링크로 오면 같은 종류의 최신 에디션을 안내한다. */
export const EDITION_STATUSES = ["draft", "published", "withdrawn"] as const
export type EditionStatus = (typeof EDITION_STATUSES)[number]

/** 에디션 글자 수 제한. 스키마와 입력 칸이 같은 값을 쓴다. */
export const EDITION_LIMITS = { title: 40, description: 200 } as const

export type Edition = {
  /** 다운로드 경로에 쓰는 slug */
  id: string
  title: string
  description: string
  spec: PrintSpec
  /** published만 사용자 목록에 보인다. published면 설명이 있어야 한다. */
  status: EditionStatus
}

const editionSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  title: z.string().trim().min(1).max(EDITION_LIMITS.title),
  description: z.string().trim().max(EDITION_LIMITS.description),
  status: z.enum(EDITION_STATUSES),
  spec: z.unknown(),
}).refine((edition) => edition.status !== "published" || edition.description.length > 0, {
  path: ["description"],
  message: "공개하려면 설명을 적어 주세요.",
})

export function parseEdition(value: unknown): Edition | Error {
  const result = editionSchema.safeParse(value)
  if (!result.success) return new Error(z.prettifyError(result.error))
  const spec = parsePrintSpec(result.data.spec)
  return spec instanceof Error ? spec : { ...result.data, spec }
}

/** 새 에디션 id. "종류-번호"이고 번호는 그 종류에서 가장 큰 번호 + 1이다. 관리자는 이름만 정한다. */
export function nextEditionId(kind: PrintKind, existingIds: readonly string[]): string {
  const pattern = new RegExp(`^${kind}-(\\d+)$`)
  const numbers = existingIds.map((id) => Number(pattern.exec(id)?.[1] ?? 0))
  return `${kind}-${Math.max(0, ...numbers) + 1}`
}

/** public 기준 에디션 하나의 다운로드 폴더. */
export function downloadDir(editionId: string): string {
  return `/downloads/${editionId}`
}

/** 생성기가 PDF를 쓰는 public 기준 경로. 에디션·용지마다 파일 하나다. 사용자 링크는 이 경로가 아니라 다운로드 주소(routes)다. */
export function downloadPath(editionId: string, paper: Paper): string {
  return `${downloadDir(editionId)}/${paper.toLowerCase()}.pdf`
}

/** 비공개 R2 버킷의 객체 키(ADR 0003). 로컬 경로와 같은 규칙이라 다시 생성하면 같은 키에 덮어쓴다. */
export function objectKey(editionId: string, paper: Paper): string {
  return downloadPath(editionId, paper).slice(1)
}

/**
 * 버킷에서 지워도 되는 키: 배포된 공개 목록의 공개 용지 키가 아닌 것 전부.
 * 내리거나 지울 때 바로 지우지 않고(배포 전에는 운영 목록에 아직 있다), 배포 뒤 이것으로 정리한다.
 */
export function staleObjectKeys(keys: readonly string[], manifest: Pick<DownloadManifest, "editions">): string[] {
  const live = new Set(manifest.editions.flatMap((edition) => PUBLISHED_PAPERS.map((paper) => objectKey(edition.id, paper))))
  return keys.filter((key) => !live.has(key))
}

/** 썸네일로 찍을 쪽(0부터). 월간 달력은 표지와 첫 달을 같이 보여 표지만 보고 고르지 않게 한다. */
export function thumbnailPages(spec: PrintSpec): number[] {
  return spec.kind === "monthly" && spec.cover !== "none" ? [0, 1] : [0]
}

/** public 기준 썸네일 경로. index는 thumbnailPages의 순서다. */
export function thumbnailPath(editionId: string, index: number): string {
  return `${downloadDir(editionId)}/thumb-${index + 1}.webp`
}

export type Thumbnail = { path: string; width: number; height: number }

export type ManifestEntry = {
  id: string
  kind: PrintKind
  title: string
  description: string
  /** 날짜가 있는 종류(월간·연간 달력)만 */
  year?: number
  orientation: Orientation
  pages: number
  /** 이 파일을 만든 사양의 해시. 어드민이 "다시 생성 필요"를 가린다. */
  specHash: string
  generatedAt: string
  files: Record<PublishedPaper, { bytes: number }>
  thumbnails: Thumbnail[]
}

export type WithdrawnEntry = Pick<ManifestEntry, "id" | "kind" | "title" | "year">

export type DownloadManifest = { editions: ManifestEntry[]; withdrawn: WithdrawnEntry[] }

/** 생성 기록. 생성기가 에디션마다 남긴다. bytes 키는 downloadPath다. */
export type BuildRecord = { specHash: string; generatedAt: string; bytes: Record<string, number>; thumbnails: Thumbnail[] }

/** 이 생성 기록이 지금 사양으로 만든 것인가. 없거나 사양이 바뀌었으면 false. */
export function isBuildCurrent(spec: PrintSpec, build: BuildRecord | undefined): build is BuildRecord {
  return build !== undefined && build.specHash === specHash(spec)
}

const yearOf = (spec: PrintSpec) => ("year" in spec ? spec.year : undefined)

/** 공개된 에디션 가운데 생성 기록이 있는 것과, 내린 에디션으로 매니페스트를 만든다. 같은 입력이면 같은 결과다. */
export function buildManifest(editions: readonly Edition[], builds: Readonly<Record<string, BuildRecord>>): DownloadManifest {
  const sorted = [...editions].sort((a, b) => a.id.localeCompare(b.id))
  return {
    editions: sorted
      .filter((edition) => edition.status === "published" && builds[edition.id])
      .map((edition) => {
        const build = builds[edition.id]!
        return {
          id: edition.id,
          kind: edition.spec.kind,
          title: edition.title,
          description: edition.description,
          year: yearOf(edition.spec),
          orientation: edition.spec.orientation,
          pages: pageCount(edition.spec),
          specHash: build.specHash,
          generatedAt: build.generatedAt,
          files: Object.fromEntries(PUBLISHED_PAPERS.map((paper) => [paper, { bytes: build.bytes[downloadPath(edition.id, paper)] ?? 0 }])) as ManifestEntry["files"],
          thumbnails: build.thumbnails,
        }
      }),
    withdrawn: sorted
      .filter((edition) => edition.status === "withdrawn")
      .map((edition) => ({ id: edition.id, kind: edition.spec.kind, title: edition.title, year: yearOf(edition.spec) })),
  }
}
