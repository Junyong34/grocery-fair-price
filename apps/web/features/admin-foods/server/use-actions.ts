"use server"

import { execFile } from "node:child_process"
import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { promisify } from "node:util"

import { refresh } from "next/cache"

import { formatFoodRegistry, parseFoodRegistry } from "@workspace/seasonal/data/food-registry"
import { RENAMED_FOOD_IDS } from "@workspace/seasonal/data/renamed-foods"

import { assertAdmin } from "@/features/admin-print/server/guard"

import { createFood, infantKeys, linkArt, setInfantArt, type InfantArt, type NewFood, type RegistryResult } from "../lib/food-edit"
import { ART_ID, INFANT_ART_FILE, REGISTRY_FILE, REPO } from "./paths"

// 그림의 용도를 정해 품종 원본(food-registry.json)과 이유식 그림 목록(infant-art.json)에 쓰고, 웹에 반영한다 (ADR 0006).
// 저장은 파일만 고친다. 웹 산출물은 publishFoods(pnpm foods:sync와 같다)가 검사한 뒤 바꾼다. 커밋은 하지 않는다.
export type UseResult = { ok: true; message: string } | { ok: false; error: string }
export type PublishResult = { problems: string[]; notes: string[]; changed: string[] }

const run = promisify(execFile)
const failure = (error: unknown): UseResult => ({ ok: false, error: error instanceof Error ? error.message : String(error) })

const readRegistry = async () => parseFoodRegistry(JSON.parse(await readFile(/*turbopackIgnore: true*/ REGISTRY_FILE, "utf8")))

async function saveRegistry(result: RegistryResult, done: (verified: boolean) => string): Promise<UseResult> {
  if (!result.ok) return result
  await writeFile(/*turbopackIgnore: true*/ REGISTRY_FILE, formatFoodRegistry(result.registry))
  refresh()
  return { ok: true, message: done(result.verified) }
}

/** 그림에 제철 용도를 지정해 새 품종을 만든다. 근거 출처와 확인일이 비면 제철 미검증으로 저장한다. */
export async function addSeasonalFood(input: NewFood): Promise<UseResult> {
  assertAdmin()
  try {
    if (!ART_ID.test(input.artId)) throw new Error("그림 ID 형식이 아니에요.")
    return await saveRegistry(createFood(await readRegistry(), input, Object.keys(RENAMED_FOOD_IDS)), (verified) =>
      verified ? `${input.name.trim()}을(를) 제철 검증된 품종으로 저장했어요. 웹에 반영하면 제철달력에 나와요.` : `${input.name.trim()}을(를) 제철 미검증으로 저장했어요. 근거 출처와 확인일을 채우기 전에는 제철달력에 나오지 않아요.`,
    )
  } catch (error) {
    return failure(error)
  }
}

/** 기존 품종이 이 그림을 쓰게 한다. */
export async function linkFoodArt(foodId: string, artId: string): Promise<UseResult> {
  assertAdmin()
  try {
    if (!ART_ID.test(artId)) throw new Error("그림 ID 형식이 아니에요.")
    return await saveRegistry(linkArt(await readRegistry(), foodId, artId), () => `${foodId} 품종이 그림 ${artId}을(를) 쓰게 했어요.`)
  } catch (error) {
    return failure(error)
  }
}

/** 이유식 항목에 그림을 연결하거나(artId) 끊는다(null). 궁합 · 월령 본문은 고치지 않는다. */
export async function setInfantUse(kind: keyof InfantArt, key: string, artId: string | null): Promise<UseResult> {
  assertAdmin()
  try {
    if (artId !== null && !ART_ID.test(artId)) throw new Error("그림 ID 형식이 아니에요.")
    if (kind !== "fruits" && kind !== "pairings") throw new Error("이유식 항목의 갈래가 아니에요.")
    if (!infantKeys()[kind].includes(key)) throw new Error(`이유식 데이터에 없는 항목이에요: ${key}`)
    const art = JSON.parse(await readFile(/*turbopackIgnore: true*/ INFANT_ART_FILE, "utf8")) as InfantArt
    await writeFile(/*turbopackIgnore: true*/ INFANT_ART_FILE, `${JSON.stringify(setInfantArt(art, kind, key, artId), null, 2)}\n`)
    refresh()
    return { ok: true, message: artId === null ? `이유식 ${key}의 그림 연결을 끊었어요.` : `이유식 ${key}에 그림을 연결했어요.` }
  } catch (error) {
    return failure(error)
  }
}

/** 웹에 반영한다. pnpm foods:sync와 같은 검사와 생성이다. 문제가 있으면 아무것도 바꾸지 않고 고칠 항목을 돌려준다. */
export async function publishFoods(): Promise<PublishResult> {
  assertAdmin()
  const script = path.join(/*turbopackIgnore: true*/ REPO, "scripts/sync-foods.mjs")
  // 문제가 있으면 종료 코드 1로 끝나지만 결과는 stdout의 JSON 한 줄에 있다.
  const stdout = await run(/*turbopackIgnore: true*/ process.execPath, [script, "--json"], { cwd: REPO, maxBuffer: 16 * 1024 * 1024 }).then(
    (result) => result.stdout,
    (error: { stdout?: string; message: string }) => error.stdout || JSON.stringify({ problems: [error.message], notes: [], changed: [] }),
  )
  const result = JSON.parse(stdout.trim().split("\n").at(-1)!) as PublishResult
  refresh()
  return result
}
