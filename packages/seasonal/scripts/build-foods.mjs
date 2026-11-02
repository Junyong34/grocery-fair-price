/* global console, process */
// 제철 품종 목록(src/data/foods.generated.ts)을 만든다.
//
//   node packages/seasonal/scripts/build-foods.mjs
//
// 원천: prototypes/seasonal-food/docs/seasonal-lists/foods.json(검증 품종만), build/catalog.json(일러스트 id).
// prototypes/는 Git에 없다. 원본 없이 제철 보정만 적용할 때는 --refresh-seasons를 쓴다.

import { readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, "../../..")
const prototype = resolve(root, "prototypes/seasonal-food")
const out = resolve(here, "../src/data/foods.generated.ts")

// 일러스트가 아직 없는 품종의 id. 일러스트를 그릴 때 이 id를 쓴다.
// 2026-10-23 기준 모든 품종에 일러스트가 있어 비어 있다.
const NEW_IDS = {}

// 이름이 달라 자동으로 맞지 않지만 같은 품종을 그린 일러스트. 새우 일러스트는 대하 기준으로 그렸다.
const DRAWN_AS = { 대하: "shrimp" }

const CATEGORIES = ["채소", "과일", "버섯", "곡물·견과", "수산"]

const plain = (name) => name.replace(/\s+/g, "")
// "광어(넙치)" → ["광어", "넙치"]
const nameParts = (name) => [name.replace(/\(.*?\)/g, "").trim(), ...[...name.matchAll(/\((.*?)\)/g)].map((m) => m[1])]

// 원본이 없는 클론에서는 명시적으로 기존 생성 목록에 제철 보정만 다시 적용한다.
// 새 품종·이름·일러스트 변경은 기존처럼 prototypes 원본이 필요하다.
let rows
if (process.argv.includes("--refresh-seasons")) {
  const generated = readFileSync(out, "utf8")
  const array = generated.match(/export const FOOD_ROWS = (\[[\s\S]*\]) as const/)
  if (!array) throw new Error("기존 생성 목록의 형식을 읽을 수 없다.")
  rows = JSON.parse(array[1].replace(/([{,]\s*)([a-zA-Z]+):/g, '$1"$2":').replace(/,\s*\]/g, "]"))
} else {
  const foods = JSON.parse(readFileSync(resolve(prototype, "docs/seasonal-lists/foods.json"), "utf8"))
  const catalog = JSON.parse(readFileSync(resolve(prototype, "build/catalog.json"), "utf8")).foods

  const catalogIdByName = new Map()
  for (const entry of catalog) for (const part of nameParts(entry.name)) catalogIdByName.set(plain(part), entry.id)

  rows = foods
    .filter((food) => food.tier === "verified")
    .map((food) => {
      const keys = [...nameParts(food.name), ...food.keys]
      const id =
        DRAWN_AS[food.name] ??
        keys.map((key) => catalogIdByName.get(plain(key))).find(Boolean) ??
        NEW_IDS[food.name]
      if (!id) throw new Error(`id가 없는 품종: ${food.name}. NEW_IDS에 추가한다.`)
      if (!CATEGORIES.includes(food.category)) throw new Error(`모르는 카테고리: ${food.category}`)
      const name = nameParts(food.name)[0]
      const aliases = [...new Set(keys.filter((key) => key !== name))]
      const months = [...new Set(food.months)].sort((a, b) => a - b)
      const peak = [...new Set(food.peak ?? food.months)].sort((a, b) => a - b)
      // core: 처음부터 조사로 제철을 검증한 품종. false는 2026-10-23 정보누리 생산시기로 올린 품종이다. 대표를 고를 때 core를 앞에 둔다.
      return { id, name, aliases, category: food.category, months, peak, core: !food.promoted }
    })
    .sort((a, b) => a.name.localeCompare(b.name, "ko"))
}

const corrections = JSON.parse(readFileSync(resolve(here, "../src/data/food-season-corrections.json"), "utf8"))
for (const [id, correction] of Object.entries(corrections)) {
  const row = rows.find((food) => food.id === id)
  if (!row) throw new Error(`제철 보정 대상 품종이 없다: ${id}`)
  if (!correction.sources.length || !correction.months.length || correction.months.some((month) => !Number.isInteger(month) || month < 1 || month > 12) || correction.peak.some((month) => !correction.months.includes(month))) {
    throw new Error(`근거나 대표 달이 잘못된 제철 보정: ${id}`)
  }
  row.months = [...new Set(correction.months)].sort((a, b) => a - b)
  row.peak = [...new Set(correction.peak)].sort((a, b) => a - b)
}

const ids = rows.map((row) => row.id)
const duplicate = ids.find((id, i) => ids.indexOf(id) !== i)
if (duplicate) throw new Error(`id가 겹친다: ${duplicate}`)

const body = rows
  .map(
    (row) =>
      `  { id: ${JSON.stringify(row.id)}, name: ${JSON.stringify(row.name)}, aliases: ${JSON.stringify(row.aliases)}, category: ${JSON.stringify(row.category)}, months: ${JSON.stringify(row.months)}, peak: ${JSON.stringify(row.peak)}, core: ${row.core} },`,
  )
  .join("\n")

writeFileSync(
  out,
  `// 생성 파일. 직접 고치지 않는다. packages/seasonal/scripts/build-foods.mjs로 다시 만든다.
// 원천: prototypes/seasonal-food/docs/seasonal-lists/foods.json의 검증 품종 ${rows.length}개.
// 제철 보정: food-season-corrections.json (조사 근거 포함).

export const FOOD_ROWS = [
${body}
] as const
`,
)

console.log(`${rows.length}개 품종 → ${out}`)
