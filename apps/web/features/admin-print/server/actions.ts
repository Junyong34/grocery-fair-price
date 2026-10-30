"use server"

import { headers } from "next/headers"
import { refresh } from "next/cache"
import { redirect } from "next/navigation"

import { EDITION_LIMITS, nextEditionId, parseEdition, type BuildRecord, type Edition } from "@workspace/seasonal/print/edition"
import { DEFAULT_SPECS, PRINT_KINDS, type PrintKind, type PrintSpec } from "@workspace/seasonal/print/spec"

import { routes } from "@/shared/routes"
import { getSeoulToday } from "@/shared/today"

import { savePlan } from "../lib/publish"
import { kindHasYear, printYearError, specYear } from "../lib/year-range"
import type { ActionResult, FormState } from "../types"
import { listEditions, readBuild, readEdition, removeEdition, writeBuild, writeEdition } from "./files"
import { generatePdfs } from "./generate"
import { assertAdmin } from "./guard"
import { deleteObjects, staleKeys, storageReady, uploadEdition } from "./storage"

const isPrintKind = (value: unknown): value is PrintKind => PRINT_KINDS.includes(value as PrintKind)
const missing = (id: string): ActionResult<never> => ({ ok: false, error: `없는 에디션: ${id}` })
const failure = (error: unknown): ActionResult<never> => ({ ok: false, error: error instanceof Error ? error.message : String(error) })

export async function createEdition(_state: FormState, formData: FormData): Promise<FormState> {
  assertAdmin()
  const kind = formData.get("kind")
  if (!isPrintKind(kind)) return { error: "종류를 고르세요." }
  let spec: PrintSpec = DEFAULT_SPECS[kind]
  if (kindHasYear(kind)) {
    // 폼은 범위 안 연도만 내놓지만, 자정을 넘겨 범위가 바뀌었거나 값을 손댄 요청도 여기서 막는다.
    const year = Number(formData.get("year"))
    const yearError = printYearError(year, (await getSeoulToday()).year)
    if (yearError) return { error: yearError }
    spec = { ...spec, year } as PrintSpec
  }
  const existing = (await listEditions()).map((edition) => edition.id)
  const edition = parseEdition({
    id: nextEditionId(kind, existing),
    title: String(formData.get("title") ?? ""),
    description: "",
    status: "draft",
    spec,
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
  // 연도는 범위(lib/year-range.ts) 안에서만 바꾼다. 범위 밖이어도 저장된 그 연도 그대로면 받는다.
  const year = specYear(edition.spec)
  const yearError = year === undefined ? undefined : printYearError(year, (await getSeoulToday()).year, specYear(saved.spec))
  if (yearError) return { ok: false, error: yearError }
  const plan = savePlan(saved, edition, { build: await readBuild(edition.id), storageReady: storageReady() })
  if ("error" in plan) return { ok: false, error: plan.error }
  try {
    // 올린 뒤에 매니페스트에 넣는다. 그래서 목록에 있는 에디션은 늘 받을 수 있다.
    if (plan.storage === "upload") await uploadEdition(edition.id)
    await writeEdition(edition)
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
  if (!(await readEdition(id))) return missing(id)
  // R2 객체는 남긴다. 배포 뒤 "R2 정리"가 지운다(lib/publish.ts).
  await removeEdition(id)
  refresh()
  return { ok: true, data: undefined }
}

/** R2 정리 전에 지울 키를 보여 준다. */
export async function previewCleanup(): Promise<ActionResult<string[]>> {
  assertAdmin()
  try {
    return { ok: true, data: await staleKeys() }
  } catch (error) {
    return failure(error)
  }
}

/** 배포된 공개 목록에 없는 R2 객체를 지운다. 확인 창에서 본 키만 지운다(그 사이 공개된 것은 남는다). */
export async function cleanStorage(keys: readonly string[]): Promise<ActionResult<string[]>> {
  assertAdmin()
  try {
    const stale = new Set(await staleKeys())
    const targets = keys.filter((key) => stale.has(key))
    await deleteObjects(targets)
    return { ok: true, data: targets }
  } catch (error) {
    return failure(error)
  }
}
