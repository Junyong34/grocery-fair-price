import { isBuildCurrent, nextEditionId, type BuildRecord, type Edition } from "@workspace/seasonal/print/edition"
import { PRINT_KINDS, type PrintKind } from "@workspace/seasonal/print/spec"

import type { EditionSummary } from "../types"
import { formatBuildDate } from "./format"

// 목록 화면에 넘길 값. 서버에서 파일을 읽은 뒤 이 순수 함수로 줄여 클라이언트에 필요한 것만 보낸다.

export function toEditionSummary(edition: Edition, build: BuildRecord | undefined): EditionSummary {
  return {
    id: edition.id,
    kind: edition.spec.kind,
    title: edition.title,
    status: edition.status,
    generatedAt: isBuildCurrent(edition.spec, build) ? formatBuildDate(build.generatedAt) : null,
  }
}

/** 새 에디션 폼이 종류를 고를 때마다 보여 줄 다음 id */
export function nextIdsByKind(existingIds: readonly string[]): Record<PrintKind, string> {
  return Object.fromEntries(PRINT_KINDS.map((kind) => [kind, nextEditionId(kind, existingIds)])) as Record<PrintKind, string>
}
