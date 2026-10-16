import { z } from "zod"

import { KIND_PAGES, PAPER_SIZES, parsePrintSpec, specHash, type PageKey, type Paper, type PrintKind, type PrintSpec } from "./spec"

// 에디션: 이름이 붙은 인쇄 사양 하나. 원본은 apps/web/print-editions/<id>.json(git), 결과 PDF는 public/downloads/.
// 사용자 다운로드 화면은 생성기가 쓰는 public/downloads/manifest.json만 읽는다.

export const EDITION_STATUSES = ["draft", "published"] as const
export type EditionStatus = (typeof EDITION_STATUSES)[number]

/** 에디션 글자 수 제한. 스키마와 입력 칸이 같은 값을 쓴다. */
export const EDITION_LIMITS = { title: 40, description: 200 } as const

export type Edition = {
  /** 다운로드 경로에 쓰는 slug */
  id: string
  title: string
  description: string
  spec: PrintSpec
  /** published만 매니페스트에 들어가 사용자에게 보인다. */
  status: EditionStatus
}

const editionSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  title: z.string().trim().min(1).max(EDITION_LIMITS.title),
  description: z.string().trim().max(EDITION_LIMITS.description),
  status: z.enum(EDITION_STATUSES),
  spec: z.unknown(),
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

/** public 기준 다운로드 경로. 해시가 없어 다시 만들어도 사용자 링크가 그대로다. */
export function downloadPath(editionId: string, paper: Paper, page: PageKey): string {
  return `${downloadDir(editionId)}/${paper.toLowerCase()}/${page}.pdf`
}

export type DownloadFile = { path: string; bytes: number }

export type ManifestEntry = {
  id: string
  kind: PrintKind
  title: string
  description: string
  /** 이 파일을 만든 사양의 해시. 어드민이 "다시 생성 필요"를 가린다. */
  specHash: string
  generatedAt: string
  files: Record<Paper, Partial<Record<PageKey, DownloadFile>>>
}

export type DownloadManifest = { editions: ManifestEntry[] }

/** 생성 기록. 생성기가 에디션마다 남긴다. bytes 키는 downloadPath다. */
export type BuildRecord = { specHash: string; generatedAt: string; bytes: Record<string, number> }

/** 이 생성 기록이 지금 사양으로 만든 것인가. 없거나 사양이 바뀌었으면 false. */
export function isBuildCurrent(spec: PrintSpec, build: BuildRecord | undefined): build is BuildRecord {
  return build !== undefined && build.specHash === specHash(spec)
}

/** 공개된 에디션 가운데 생성 기록이 있는 것으로 매니페스트를 만든다. 같은 입력이면 같은 결과다. */
export function buildManifest(editions: readonly Edition[], builds: Readonly<Record<string, BuildRecord>>): DownloadManifest {
  return {
    editions: editions
      .filter((edition) => edition.status === "published" && builds[edition.id])
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((edition) => {
        const build = builds[edition.id]!
        const filesFor = (paper: Paper) =>
          Object.fromEntries(
            KIND_PAGES[edition.spec.kind].map((page) => {
              const path = downloadPath(edition.id, paper, page)
              return [page, { path, bytes: build.bytes[path] ?? 0 }]
            }),
          )
        return {
          id: edition.id,
          kind: edition.spec.kind,
          title: edition.title,
          description: edition.description,
          specHash: build.specHash,
          generatedAt: build.generatedAt,
          files: Object.fromEntries(PAPER_SIZES.map((paper) => [paper, filesFor(paper)])) as ManifestEntry["files"],
        }
      }),
  }
}
