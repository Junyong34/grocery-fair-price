// 품종 원본에서 foods.generated.ts의 글을 만든다. build-foods.mjs와 루트 scripts/sync-foods.mjs가 함께 쓴다.
import { seasonalRows } from "../src/data/food-registry.ts"

/** @param {import("../src/data/food-registry.ts").FoodRegistry} registry */
export function foodRowsSource(registry) {
  const rows = seasonalRows(registry)
  const body = rows
    .map(
      (row) =>
        `  { id: ${JSON.stringify(row.id)}, name: ${JSON.stringify(row.name)}, aliases: ${JSON.stringify(row.aliases)}, category: ${JSON.stringify(row.category)}, months: ${JSON.stringify(row.months)}, peak: ${JSON.stringify(row.peak)}, core: ${row.core} },`,
    )
    .join("\n")
  return {
    count: rows.length,
    text: `// 생성 파일. 직접 고치지 않는다. 품종 원본 food-registry.json을 고치고 \`pnpm foods:sync\`로 다시 만든다.
// 품종 원본 ${Object.keys(registry).length}개 가운데 제철 검증된 ${rows.length}개.

export const FOOD_ROWS = [
${body}
] as const
`,
  }
}
