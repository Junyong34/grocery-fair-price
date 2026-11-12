/* global console */
// 제철 품종 목록(src/data/foods.generated.ts)을 품종 원본에서 만든다.
//
//   pnpm --filter @workspace/seasonal build:foods
//
// 원본: src/data/food-registry.json. 품종의 이름·별칭·제철 달·근거는 그 파일에서 고친다 (ADR 0006).
// 제철 검증된 품종만 목록에 넣는다. prototypes/ 없이 돌아간다.

import { readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { parseFoodRegistry, seasonalRows } from "../src/data/food-registry.ts"

const here = dirname(fileURLToPath(import.meta.url))
const source = resolve(here, "../src/data/food-registry.json")
const out = resolve(here, "../src/data/foods.generated.ts")

const registry = parseFoodRegistry(JSON.parse(readFileSync(source, "utf8")))
const rows = seasonalRows(registry)

const body = rows
  .map(
    (row) =>
      `  { id: ${JSON.stringify(row.id)}, name: ${JSON.stringify(row.name)}, aliases: ${JSON.stringify(row.aliases)}, category: ${JSON.stringify(row.category)}, months: ${JSON.stringify(row.months)}, peak: ${JSON.stringify(row.peak)}, core: ${row.core} },`,
  )
  .join("\n")

writeFileSync(
  out,
  `// 생성 파일. 직접 고치지 않는다. 품종 원본 food-registry.json을 고치고 packages/seasonal/scripts/build-foods.mjs로 다시 만든다.
// 품종 원본 ${Object.keys(registry).length}개 가운데 제철 검증된 ${rows.length}개.

export const FOOD_ROWS = [
${body}
] as const
`,
)

console.log(`${rows.length}개 품종 → ${out}`)
