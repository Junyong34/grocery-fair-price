/* global console, process */
// 제철 일러스트를 앱으로 복사한다. 일러스트를 새로 그리거나 고친 뒤에 돌린다.
//
//   pnpm foods:sync
//
// prototypes/seasonal-food의 kit으로 직접 렌더하므로 대시보드용 build/out/은 건드리지 않는다.
// 그림체는 STYLE_ID 하나, 변형은 VARIANTS, 바닥 그림자는 끈다. 화면에 나오는 품종(foods.generated.ts)만 복사한다.
// 출력: apps/web/public/foods/<id>/<variant>.svg, apps/web/public/foods/PROVENANCE.md,
//       packages/seasonal/src/data/drawn-foods.generated.ts

import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const STYLE_ID = "watercolor"
const VARIANTS = ["color", "motion"]

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const prototype = join(root, "prototypes/seasonal-food")
const outDir = join(root, "apps/web/public/foods")
const drawnFile = join(root, "packages/seasonal/src/data/drawn-foods.generated.ts")

if (!existsSync(join(prototype, "kit/index.mjs"))) {
  console.error(
    "prototypes/seasonal-food가 없다(Git에 없는 폴더). 일러스트 원본이 있는 기기에서 돌린다. 커밋된 복사본은 그대로 둔다.",
  )
  process.exit(1)
}

const { renderSvg } = await import(pathToFileURL(join(prototype, "kit/index.mjs")))
const { FOOD_ROWS } = await import(pathToFileURL(join(root, "packages/seasonal/src/data/foods.generated.ts")))

const sha = (text) => createHash("sha256").update(text).digest("hex").slice(0, 16)
const styleFile = join(prototype, "styles", STYLE_ID, "style.json")
const styleText = readFileSync(styleFile, "utf8")
const style = JSON.parse(styleText)
const kitSha = sha(
  readdirSync(join(prototype, "kit"))
    .filter((file) => file.endsWith(".mjs"))
    .sort()
    .map((file) => readFileSync(join(prototype, "kit", file), "utf8"))
    .join("\n"),
)

const shownIds = new Set(FOOD_ROWS.map((food) => food.id))
const drawnIds = readdirSync(join(prototype, "foods"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(prototype, "foods", entry.name, "food.mjs")))
  .map((entry) => entry.name)
  .sort()

rmSync(outDir, { recursive: true, force: true })
const copied = []
const skipped = []
for (const id of drawnIds) {
  if (!shownIds.has(id)) {
    skipped.push(id)
    continue
  }
  const sourceFile = join(prototype, "foods", id, "food.mjs")
  const food = (await import(pathToFileURL(sourceFile))).default
  mkdirSync(join(outDir, id), { recursive: true })
  for (const variant of VARIANTS) {
    writeFileSync(join(outDir, id, `${variant}.svg`), renderSvg(food, style, variant, undefined, { shadow: false }))
  }
  copied.push({ id, name: food.name, sha: sha(readFileSync(sourceFile, "utf8")) })
}

writeFileSync(
  join(outDir, "PROVENANCE.md"),
  `# 제철 일러스트 출처 기록

생성 파일. \`pnpm foods:sync\`(scripts/sync-food-images.mjs)가 덮어쓴다.

이 폴더의 SVG는 이 프로젝트에서 직접 만든 제철 일러스트다. 원본(품종별 그리기 코드와 그림체 수치)은 저장소 밖 \`prototypes/seasonal-food\`에 있다.

| 항목 | 값 |
|---|---|
| 그림체 | ${style.name} (\`${style.id}\` v${style.version}, style.json sha \`${sha(styleText)}\`) |
| kit sha | \`${kitSha}\` |
| 변형 | ${VARIANTS.map((variant) => `\`${variant}\``).join(", ")} |
| 바닥 그림자 | 끔 |
| 품종 수 | ${copied.length} |

| id | 이름 | food.mjs sha |
|---|---|---|
${copied.map((food) => `| \`${food.id}\` | ${food.name} | \`${food.sha}\` |`).join("\n")}
`,
)

writeFileSync(
  drawnFile,
  `// 생성 파일. 직접 고치지 않는다. \`pnpm foods:sync\`로 다시 만든다.
// 일러스트가 있는 품종 id. 없는 품종은 화면에서 이름 카드로 대신한다.

export const DRAWN_FOOD_IDS = [
${copied.map((food) => `  ${JSON.stringify(food.id)},`).join("\n")}
] as const
`,
)

console.log(`${style.id} v${style.version}: ${copied.length}개 품종 → apps/web/public/foods/`)
if (skipped.length) console.log(`화면에 없는 품종이라 건너뜀(${skipped.length}): ${skipped.join(", ")}`)
