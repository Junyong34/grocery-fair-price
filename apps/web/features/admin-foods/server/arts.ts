import "server-only"

import { execFile } from "node:child_process"
import { existsSync } from "node:fs"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { promisify } from "node:util"

import { parseArtMeta } from "@workspace/seasonal/data/art-meta"
import { parseFoodRegistry } from "@workspace/seasonal/data/food-registry"

import { artUses, type ArtRow } from "../lib/art-view"
import { ART_DIR, artFile, INFANT_ART_FILE, REGISTRY_FILE, REPO } from "./paths"

const run = promisify(execFile)
const NONE = { seasonal: [], infant: [] }

export type ArtList =
  | { available: false }
  | { available: true; rows: ArtRow[]; /** 형식이 틀려 읽지 못한 그림 메타. */ broken: string[]; /** 미리보기를 그리지 못한 그림. */ failed: string[] }

/** 그림 원본이 이 기기에 있는지. prototypes/는 Git에 없다. */
export function hasArtSource(): boolean {
  return existsSync(/*turbopackIgnore: true*/ ART_DIR)
}

const readJson = async (file: string) => JSON.parse(await readFile(/*turbopackIgnore: true*/ file, "utf8")) as unknown

/** 바뀐 그림의 미리보기를 다시 그린다. 그리지 못한 그림을 돌려준다. */
async function drawPreviews(): Promise<string[]> {
  const script = path.join(/*turbopackIgnore: true*/ REPO, "scripts/render-art-previews.mjs")
  // 실패한 그림이 있으면 종료 코드 1로 끝나지만 결과는 stdout에 있다.
  const stdout = await run(/*turbopackIgnore: true*/ process.execPath, [script], { cwd: REPO }).then(
    (result) => result.stdout,
    (error: { stdout?: string; message: string }) => error.stdout || JSON.stringify({ failed: [error.message] }),
  )
  return (JSON.parse(stdout.trim().split("\n").at(-1)!) as { failed: string[] }).failed
}

/** 그림 전체와 그림마다 가리키는 화면 데이터. */
export async function listArts(): Promise<ArtList> {
  if (!hasArtSource()) return { available: false }
  const failed = await drawPreviews()
  const registry = parseFoodRegistry(await readJson(REGISTRY_FILE))
  const uses = artUses(registry, (await readJson(INFANT_ART_FILE)) as Parameters<typeof artUses>[1])
  const ids = (await readdir(/*turbopackIgnore: true*/ ART_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && existsSync(/*turbopackIgnore: true*/ artFile(entry.name, "food.mjs")))
    .map((entry) => entry.name)
  const rows: ArtRow[] = []
  const broken: string[] = []
  for (const id of ids) {
    try {
      rows.push({ ...parseArtMeta(await readJson(artFile(id, "art.json"))), uses: uses.get(id) ?? NONE })
    } catch {
      broken.push(id)
    }
  }
  return { available: true, rows, broken: broken.sort(), failed }
}
