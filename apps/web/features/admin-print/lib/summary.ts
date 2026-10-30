import { isBuildCurrent, nextEditionId, type BuildRecord, type Edition } from "@workspace/seasonal/print/edition"
import { PRINT_KINDS, type PrintKind } from "@workspace/seasonal/print/spec"

import type { EditionSummary } from "../types"
import { formatBuildDate } from "./format"

export function toEditionSummary(edition: Edition, build: BuildRecord | undefined): EditionSummary {
  return {
    id: edition.id,
    kind: edition.spec.kind,
    title: edition.title,
    status: edition.status,
    currentBuildDate: isBuildCurrent(edition.spec, build) ? formatBuildDate(build.generatedAt) : null,
    year: "year" in edition.spec ? edition.spec.year : null,
  }
}

export function nextIdsByKind(existingIds: readonly string[]): Record<PrintKind, string> {
  return Object.fromEntries(PRINT_KINDS.map((kind) => [kind, nextEditionId(kind, existingIds)])) as Record<PrintKind, string>
}
