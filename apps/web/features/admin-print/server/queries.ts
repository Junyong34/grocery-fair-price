import "server-only"

import type { BuildRecord, Edition } from "@workspace/seasonal/print/edition"
import type { PrintKind } from "@workspace/seasonal/print/spec"

import { nextIdsByKind, toEditionSummary } from "../lib/summary"
import type { EditionSummary } from "../types"
import { listEditions, readBuild, readBuilds, readEdition } from "./files"

// 어드민 화면이 읽는 값. 라우트는 이 함수만 부르고, 파일 형식과 화면용 가공은 모른다.

export type EditionBoardData = { editions: EditionSummary[]; nextIds: Record<PrintKind, string> }

/** 목록 화면: 에디션 요약과 종류별 다음 id */
export async function getEditionBoard(): Promise<EditionBoardData> {
  const [editions, builds] = await Promise.all([listEditions(), readBuilds()])
  return {
    editions: editions.map((edition) => toEditionSummary(edition, builds[edition.id])),
    nextIds: nextIdsByKind(editions.map((edition) => edition.id)),
  }
}

export type EditionEditorData = { edition: Edition; build: BuildRecord | undefined }

/** 편집 화면: 에디션 하나와 그 생성 기록. 없는 id면 undefined */
export async function getEditionEditor(id: string): Promise<EditionEditorData | undefined> {
  const [edition, build] = await Promise.all([readEdition(id), readBuild(id)])
  return edition && { edition, build }
}
