import "server-only"

import type { BuildRecord, Edition } from "@workspace/seasonal/print/edition"
import type { PrintKind } from "@workspace/seasonal/print/spec"

import { nextIdsByKind, toEditionSummary } from "../lib/summary"
import type { EditionSummary } from "../types"
import { listEditions, readBuild, readBuilds, readEdition } from "./files"

export type EditionBoardData = { editions: EditionSummary[]; nextIds: Record<PrintKind, string> }

export async function getEditionBoard(): Promise<EditionBoardData> {
  const [editions, builds] = await Promise.all([listEditions(), readBuilds()])
  return {
    editions: editions.map((edition) => toEditionSummary(edition, builds[edition.id])),
    nextIds: nextIdsByKind(editions.map((edition) => edition.id)),
  }
}

export type EditionEditorData = { edition: Edition; build: BuildRecord | undefined }

export async function getEditionEditor(id: string): Promise<EditionEditorData | undefined> {
  const [edition, build] = await Promise.all([readEdition(id), readBuild(id)])
  return edition && { edition, build }
}
