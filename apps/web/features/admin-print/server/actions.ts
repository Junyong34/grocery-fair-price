"use server"

import { headers } from "next/headers"
import { refresh } from "next/cache"
import { redirect } from "next/navigation"

import { EDITION_LIMITS, nextEditionId, parseEdition, type BuildRecord, type Edition } from "@workspace/seasonal/print/edition"
import { DEFAULT_SPECS, PRINT_KINDS, type PrintKind } from "@workspace/seasonal/print/spec"

import { routes } from "@/shared/routes"

import type { ActionResult, FormState } from "../types"
import { listEditions, readEdition, removeEdition, writeBuild, writeEdition, writeManifest } from "./files"
import { generatePdfs } from "./generate"
import { assertAdmin } from "./guard"

// 어드민 Server Action. 파일을 쓰므로 운영에서는 거절한다.

const isPrintKind = (value: unknown): value is PrintKind => PRINT_KINDS.includes(value as PrintKind)
const missing = (id: string): ActionResult<never> => ({ ok: false, error: `없는 에디션: ${id}` })

/** 새 에디션(useActionState 폼). 관리자는 종류와 이름만 고르고, id는 종류별 번호로 붙는다. 만들면 편집 화면으로 간다. */
export async function createEdition(_state: FormState, formData: FormData): Promise<FormState> {
  assertAdmin()
  const kind = formData.get("kind")
  if (!isPrintKind(kind)) return { error: "종류를 고르세요." }
  const existing = (await listEditions()).map((edition) => edition.id)
  const edition = parseEdition({
    id: nextEditionId(kind, existing),
    title: String(formData.get("title") ?? ""),
    description: "",
    status: "draft",
    spec: DEFAULT_SPECS[kind],
  })
  if (edition instanceof Error) return { error: `이름은 1~${EDITION_LIMITS.title}자로 적어 주세요.` }
  await writeEdition(edition)
  redirect(routes.admin.edition(edition.id))
}

export async function saveEdition(value: Edition): Promise<ActionResult> {
  assertAdmin()
  const edition = parseEdition(value)
  if (edition instanceof Error) return { ok: false, error: edition.message }
  await writeEdition(edition)
  await writeManifest()
  return { ok: true, data: undefined }
}

export async function generateEdition(id: string): Promise<ActionResult<BuildRecord>> {
  assertAdmin()
  const edition = await readEdition(id)
  if (!edition) return missing(id)
  const host = (await headers()).get("host")
  try {
    const build = await generatePdfs(edition, `http://${host}`)
    await writeBuild(id, build)
    await writeManifest()
    return { ok: true, data: build }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

/** 에디션과 그 PDF를 지우고 매니페스트를 다시 쓴다. 보고 있는 화면(목록)은 새로 받는다. */
export async function deleteEdition(id: string): Promise<ActionResult> {
  assertAdmin()
  if (!(await readEdition(id))) return missing(id)
  await removeEdition(id)
  await writeManifest()
  refresh()
  return { ok: true, data: undefined }
}
