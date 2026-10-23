/* global console */
// 제철 품종 목록(src/data/foods.generated.ts)을 만든다.
//
//   node packages/seasonal/scripts/build-foods.mjs
//
// 원천: prototypes/seasonal-food/docs/seasonal-lists/foods.json(검증 품종만), build/catalog.json(일러스트 id).
// prototypes/는 Git에 없으므로 새 클론에서는 돌릴 수 없다. 생성된 파일을 커밋한다.

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

const foods = JSON.parse(readFileSync(resolve(prototype, "docs/seasonal-lists/foods.json"), "utf8"))
const catalog = JSON.parse(readFileSync(resolve(prototype, "build/catalog.json"), "utf8")).foods

const catalogIdByName = new Map()
for (const entry of catalog) for (const part of nameParts(entry.name)) catalogIdByName.set(plain(part), entry.id)

const rows = foods
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

export const FOOD_ROWS = [
${body}
] as const
`,
)

console.log(`${rows.length}개 품종 → ${out}`)
