/* global console, process */
// 품종 상세 원고(content/foods/*.md)를 화면 데이터(src/data/food-content.generated.ts)로 만든다.
//
//   pnpm foods:content          다시 만든다
//   pnpm foods:content --check  생성 파일이 원고와 같은지만 본다(다르면 종료 코드 1)
//
// 원고 형식과 읽는 법: src/data/food-content.ts. 원고에 있는 품종 ID는 품종 원본(food-registry.json)에 있어야 한다.

import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { parseFoodContent } from "../src/data/food-content.ts"
import { parseFoodRegistry } from "../src/data/food-registry.ts"

const here = dirname(fileURLToPath(import.meta.url))
const contentDir = resolve(here, "../content/foods")
const out = resolve(here, "../src/data/food-content.generated.ts")
const registry = parseFoodRegistry(JSON.parse(readFileSync(resolve(here, "../src/data/food-registry.json"), "utf8")))

const content = {}
for (const file of readdirSync(contentDir).filter((name) => name.endsWith(".md")).sort()) {
  const parsed = parseFoodContent(readFileSync(join(contentDir, file), "utf8"))
  for (const [id, food] of Object.entries(parsed)) {
    if (!(id in registry)) throw new Error(`${file}: 품종 원본에 없는 ID ${id}`)
    if (id in content) throw new Error(`${file}: ${id}가 다른 원고 파일에도 있다`)
    content[id] = food
  }
}

const ids = Object.keys(content).sort()
const missing = Object.entries(registry)
  .filter(([id, food]) => food.season === "verified" && !(id in content))
  .map(([id]) => id)
const text = [
  "// 생성 파일. 직접 고치지 않는다. 원고 packages/seasonal/content/foods/*.md를 고치고 `pnpm foods:content`로 다시 만든다.",
  `// 원고가 있는 품종 ${ids.length}개.`,
  "",
  'import type { FoodContent } from "./food-content"',
  "",
  "export const FOOD_CONTENT: Readonly<Record<string, FoodContent>> = {",
  ...ids.map((id) => `  ${JSON.stringify(id)}: ${JSON.stringify(content[id])},`),
  "}",
  "",
].join("\n")

if (process.argv.includes("--check")) {
  let current = ""
  try {
    current = readFileSync(out, "utf8")
  } catch {
    // 아직 없으면 다르다고 본다.
  }
  if (current !== text) {
    console.error("food-content.generated.ts가 원고와 다르다. pnpm foods:content로 다시 만든다.")
    process.exit(1)
  }
  console.log(`원고 ${ids.length}개가 생성 파일과 같다.`)
} else {
  writeFileSync(out, text)
  console.log(`원고 ${ids.length}개 → ${out}`)
}
if (missing.length > 0) console.log(`원고가 없는 제철 검증 품종 ${missing.length}개: ${missing.join(", ")}`)
