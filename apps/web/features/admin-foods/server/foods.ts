import "server-only"

import { existsSync } from "node:fs"
import { readdir, readFile } from "node:fs/promises"

import { parseFoodRegistry, type FoodEntry } from "@workspace/seasonal/data/food-registry"

import { ART_DIR, artFile, REGISTRY_FILE } from "./paths"

export type FoodRow = FoodEntry & { id: string }

/** 품종 원본의 품종 전체(이름 가나다순)와, 이 기기에 그림 원본이 있으면 그림 ID 목록. */
export async function listFoods(): Promise<{ rows: FoodRow[]; artIds: string[] | null }> {
  const registry = parseFoodRegistry(JSON.parse(await readFile(/*turbopackIgnore: true*/ REGISTRY_FILE, "utf8")))
  const rows = Object.entries(registry)
    .map(([id, food]) => ({ id, ...food }))
    .sort((a, b) => a.name.localeCompare(b.name, "ko"))
  if (!existsSync(/*turbopackIgnore: true*/ ART_DIR)) return { rows, artIds: null }
  const artIds = (await readdir(/*turbopackIgnore: true*/ ART_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && existsSync(/*turbopackIgnore: true*/ artFile(entry.name, "food.mjs")))
    .map((entry) => entry.name)
    .sort()
  return { rows, artIds }
}
