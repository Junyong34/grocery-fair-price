"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { nextEditionId, parseEdition, type BuildRecord, type Edition } from "@workspace/seasonal/print/edition"
import { DEFAULT_SPECS, PRINT_KINDS, type PrintKind } from "@workspace/seasonal/print/spec"

import { routes } from "@/shared/routes"

import { listEditions, readEdition, writeBuild, writeEdition, writeManifest } from "./files"
import { generatePdfs } from "./generate"

// 어드민 Server Action. 파일을 쓰므로 운영에서는 거절한다.
function assertDev() {
  if (process.env.NODE_ENV === "production") throw new Error("어드민은 개발 서버에서만 쓴다")
}

/** 새 에디션. 관리자는 종류와 이름만 고르고, id는 종류별 번호로 붙는다. */
export async function createEdition(_state: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  assertDev()
  const kind = String(formData.get("kind")) as PrintKind
  if (!PRINT_KINDS.includes(kind)) return { error: "종류를 고르세요." }
  const existing = (await listEditions()).map((edition) => edition.id)
  const edition = parseEdition({
    id: nextEditionId(kind, existing),
    title: String(formData.get("title") ?? ""),
    description: "",
    status: "draft",
    spec: DEFAULT_SPECS[kind],
  })
  if (edition instanceof Error) return { error: "이름은 1~40자로 적어 주세요." }
  await writeEdition(edition)
  redirect(routes.admin.edition(edition.id))
}

export async function saveEdition(value: Edition): Promise<{ error?: string }> {
  assertDev()
  const edition = parseEdition(value)
  if (edition instanceof Error) return { error: edition.message }
  await writeEdition(edition)
  await writeManifest()
  return {}
}

export async function generateEdition(id: string): Promise<{ error?: string; build?: BuildRecord }> {
  assertDev()
  const edition = await readEdition(id)
  if (!edition) return { error: `없는 에디션: ${id}` }
  const host = (await headers()).get("host")
  try {
    const build = await generatePdfs(edition, `http://${host}`)
    await writeBuild(id, build)
    await writeManifest()
    return { build }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}
