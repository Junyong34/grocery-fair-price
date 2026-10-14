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
const NEW_IDS = {
  아스파라거스: "asparagus",
  애호박: "korean-zucchini",
  오이: "cucumber",
  참나물: "chamnamul",
  토마토: "tomato",
  홍고추: "red-chili",
  수박: "watermelon",
  유자: "yuzu",
  자두: "plum",
  참외: "korean-melon",
  포도: "grape",
  한라봉: "hallabong",
  송이버섯: "pine-mushroom",
  표고버섯: "shiitake",
  밤: "chestnut",
  옥수수: "corn",
  완두콩: "green-pea",
  은행: "ginkgo-nut",
  과메기: "gwamegi",
  굴: "oyster",
  꼬막: "cockle",
  꽃게: "blue-crab",
  농어: "sea-bass",
  대게: "snow-crab",
  "동해한치(화살꼴뚜기)": "spear-squid",
  매생이: "maesaengi",
  멍게: "sea-squirt",
  민어: "brown-croaker",
  바다장어: "conger-eel",
  바지락: "manila-clam",
  병어: "pomfret",
  "봄 도다리(문치가자미)": "marbled-flounder",
  아귀: "monkfish",
  오징어: "squid",
  재첩: "marsh-clam",
  전복: "abalone",
  전어: "gizzard-shad",
  "제주한치(창꼴뚜기)": "swordtip-squid",
  주꾸미: "webfoot-octopus",
  키조개: "pen-shell",
  홍합: "mussel",
}

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
    return { id, name, aliases, category: food.category, months }
  })
  .sort((a, b) => a.name.localeCompare(b.name, "ko"))

const ids = rows.map((row) => row.id)
const duplicate = ids.find((id, i) => ids.indexOf(id) !== i)
if (duplicate) throw new Error(`id가 겹친다: ${duplicate}`)

const body = rows
  .map(
    (row) =>
      `  { id: ${JSON.stringify(row.id)}, name: ${JSON.stringify(row.name)}, aliases: ${JSON.stringify(row.aliases)}, category: ${JSON.stringify(row.category)}, months: ${JSON.stringify(row.months)} },`,
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
