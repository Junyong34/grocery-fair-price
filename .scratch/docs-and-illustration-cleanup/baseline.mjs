/* global console */
// 기준값을 다시 잰다 (티켓 01). 저장소 루트에서: node .scratch/docs-and-illustration-cleanup/baseline.mjs
// prototypes/가 있어야 한다. 아무 파일도 쓰지 않는다.
import { createHash } from "node:crypto"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

const proto = "prototypes/seasonal-food"
const data = "packages/seasonal/src/data"
const sha = (text) => createHash("sha256").update(text).digest("hex").slice(0, 16)
const dirs = (dir) =>
  readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
const svgs = (dir) =>
  dirs(dir)
    .flatMap((id) =>
      readdirSync(join(dir, id))
        .filter((file) => file.endsWith(".svg"))
        .map((file) => join(dir, id, file)),
    )
    .sort()
/** 파일마다 해시를 내고 그 목록을 다시 해시한다. */
const bundle = (files) => sha(files.map((file) => `${sha(readFileSync(file))} ${file}`).join("\n"))

const foods = JSON.parse(readFileSync(join(proto, "docs/seasonal-lists/foods.json"), "utf8"))
const tiers = {}
for (const food of foods) tiers[food.tier] = (tiers[food.tier] ?? 0) + 1
console.log("foods.json 항목:", foods.length, JSON.stringify(tiers))
console.log("catalog.json 항목:", JSON.parse(readFileSync(join(proto, "build/catalog.json"), "utf8")).foods.length)

const generated = readFileSync(join(data, "foods.generated.ts"), "utf8")
const rows = JSON.parse(
  generated
    .match(/export const FOOD_ROWS = (\[[\s\S]*\]) as const/)[1]
    .replace(/([{,]\s*)([a-zA-Z]+):/g, '$1"$2":')
    .replace(/,\s*\]/g, "]"),
)
const varietyIds = new Set(rows.map((row) => row.id))
console.log("제철 품종:", rows.length, "/ 겹치지 않는 ID:", varietyIds.size, "/ core:", rows.filter((row) => row.core).length)

const source = dirs(join(proto, "foods")).filter((id) => existsSync(join(proto, "foods", id, "food.mjs")))
const web = dirs("apps/web/public/foods")
console.log("그림 원본:", source.length, "/ 웹 그림:", web.length)
console.log("전통 음식 원본:", dirs(join(proto, "dishes")).length, "/ 웹:", dirs("apps/web/public/dishes").length)
console.log("원본만 있고 웹에 없는 그림:", source.filter((id) => !web.includes(id)).join(" "))
console.log("웹에 있고 원본이 없는 그림:", web.filter((id) => !source.includes(id)).join(" ") || "없음")
console.log("웹에 있지만 제철 품종이 아닌 그림:", web.filter((id) => !varietyIds.has(id)).join(" "))
console.log("제철 품종인데 웹에 없는 그림:", [...varietyIds].filter((id) => !web.includes(id)).join(" ") || "없음")
console.log(
  "제철 보정 품종:",
  Object.keys(JSON.parse(readFileSync(join(data, "food-season-corrections.json"), "utf8"))).join(" "),
)

for (const file of [
  join(data, "foods.generated.ts"),
  join(data, "drawn-foods.generated.ts"),
  join(data, "drawn-dishes.generated.ts"),
  join(data, "food-bounds.generated.ts"),
  "apps/web/public/foods/PROVENANCE.md",
  "apps/web/public/dishes/PROVENANCE.md",
])
  console.log(sha(readFileSync(file)), file)
const foodSvgs = svgs("apps/web/public/foods")
const dishSvgs = svgs("apps/web/public/dishes")
console.log(bundle(foodSvgs), `apps/web/public/foods/*/*.svg (${foodSvgs.length}개)`)
console.log(bundle(dishSvgs), `apps/web/public/dishes/*/*.svg (${dishSvgs.length}개)`)
