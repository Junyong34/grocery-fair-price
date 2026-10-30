"use server"

import { headers } from "next/headers"
import { refresh } from "next/cache"
import { redirect } from "next/navigation"

import { EDITION_LIMITS, nextEditionId, parseEdition, type BuildRecord, type Edition } from "@workspace/seasonal/print/edition"
import { DEFAULT_SPECS, PRINT_KINDS, type PrintKind } from "@workspace/seasonal/print/spec"

import { routes } from "@/shared/routes"

import { savePlan } from "../lib/publish"
import type { ActionResult, FormState } from "../types"
import { listEditions, readBuild, readEdition, removeEdition, writeBuild, writeEdition } from "./files"
import { generatePdfs } from "./generate"
import { assertAdmin } from "./guard"
import { removeEditionObjects, storageReady, uploadEdition } from "./storage"

const isPrintKind = (value: unknown): value is PrintKind => PRINT_KINDS.includes(value as PrintKind)
const missing = (id: string): ActionResult<never> => ({ ok: false, error: `없는 에디션: ${id}` })
const failure = (error: unknown): ActionResult<never> => ({ ok: false, error: error instanceof Error ? error.message : String(error) })

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
  const saved = await readEdition(edition.id)
  if (!saved) return missing(edition.id)
  const plan = savePlan(saved, edition, { build: await readBuild(edition.id), storageReady: storageReady() })
  if ("error" in plan) return { ok: false, error: plan.error }
  try {
    // 올린 뒤에 매니페스트에 넣고, 매니페스트에서 뺀 뒤에 지운다. 그래서 목록에 있는 에디션은 늘 받을 수 있다.
    if (plan.storage === "upload") await uploadEdition(edition.id)
    await writeEdition(edition)
    if (plan.storage === "delete") await removeEditionObjects(edition.id)
  } catch (error) {
    return failure(error)
  }
  return { ok: true, data: undefined }
}

export async function generateEdition(id: string): Promise<ActionResult<BuildRecord>> {
  assertAdmin()
  const edition = await readEdition(id)
  if (!edition) return missing(id)
  const host = (await headers()).get("host")
  try {
    const build = await generatePdfs(edition, `http://${host}`)
    // 공개 중이면 사용자가 받는 파일도 새 PDF로 바꾼다(같은 키에 덮어쓴다).
    if (edition.status === "published") await uploadEdition(id)
    await writeBuild(id, build)
    return { ok: true, data: build }
  } catch (error) {
    return failure(error)
  }
}

export async function deleteEdition(id: string): Promise<ActionResult> {
  assertAdmin()
  const edition = await readEdition(id)
  if (!edition) return missing(id)
  try {
    await removeEdition(id)
    if (edition.status === "published") await removeEditionObjects(id)
  } catch (error) {
    return failure(error)
  }
  refresh()
  return { ok: true, data: undefined }
}
