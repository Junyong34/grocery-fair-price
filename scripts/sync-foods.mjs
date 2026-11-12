/* global console, process */
// 품종 원본과 그림 원본에서 웹 산출물을 한 번에 만든다 (ADR 0006).
//
//   pnpm foods:sync            검사 → 임시 폴더에 생성 → 생성물 확인 → 한 번에 교체
//   pnpm foods:sync --check    검사만 하고 아무것도 쓰지 않는다
//   pnpm foods:sync --json     결과를 JSON 한 줄로 낸다 (그림 어드민이 읽는다)
//
// 입력: packages/seasonal/src/data/food-registry.json(품종 원본), infant-art.json(이유식 그림), dish-rows.ts(전통 음식),
//       prototypes/seasonal-food의 foods/<그림 ID>/{food.mjs, art.json}, dishes/<id>/food.mjs, kit, styles/watercolor.
// 출력: packages/seasonal/src/data/{foods,drawn-foods,drawn-dishes,food-bounds}.generated.ts,
//       apps/web/public/foods/<웹 폴더>/{color,motion}.svg와 PROVENANCE.md, apps/web/public/dishes/<id>/color.svg와 PROVENANCE.md.
//
// 내보내는 그림은 "그림 검수를 마쳤고 어느 화면 데이터든 가리키는 그림"이다(planFoodSync).
// 문제가 하나라도 있으면 고칠 항목을 보여 주고 기존 산출물은 건드리지 않는다.
// prototypes/는 Git에 없다. 없는 기기에서는 품종 목록만 다시 만들고 그림은 건너뛴다.

import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { foodRowsSource } from "../packages/seasonal/scripts/food-rows-source.mjs"
import { parseArtMeta } from "../packages/seasonal/src/data/art-meta.ts"
import { DISH_ROWS } from "../packages/seasonal/src/data/dish-rows.ts"
import { parseFoodRegistry } from "../packages/seasonal/src/data/food-registry.ts"
import { duplicateFoodIds, planFoodSync } from "../packages/seasonal/src/data/food-sync-plan.ts"
import { RENAMED_FOOD_IDS } from "../packages/seasonal/src/data/renamed-foods.ts"
import { foodBoundsSource } from "./measure-food-bounds.mjs"

const STYLE_ID = "watercolor"
const VARIANTS = ["color", "motion"]
// 전통 음식은 움직임이 없어 color만 만든다.
const DISH_VARIANTS = ["color"]

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const prototype = join(root, "prototypes/seasonal-food")
const data = join(root, "packages/seasonal/src/data")
const work = join(root, "node_modules/.cache/foods-sync")
const checkOnly = process.argv.includes("--check")
const asJson = process.argv.includes("--json")

const sha = (text) => createHash("sha256").update(text).digest("hex").slice(0, 16)
const say = (line) => {
  if (!asJson) console.log(line)
}
/** 결과를 내고 끝낸다. 문제가 있으면 종료 코드 1. */
function finish(result) {
  if (asJson) console.log(JSON.stringify(result))
  else if (result.problems.length) {
    console.error(`\n고칠 것 ${result.problems.length}건. 기존 산출물은 그대로 두었다.`)
    for (const problem of result.problems) console.error(`  - ${problem}`)
  }
  process.exit(result.problems.length ? 1 : 0)
}

// ── 1. 읽고 검사한다 ──────────────────────────────────────────────

const registryText = readFileSync(join(data, "food-registry.json"), "utf8")
const duplicated = duplicateFoodIds(registryText)
if (duplicated.length) {
  finish({ problems: duplicated.map((id) => `품종 ${id}: 품종 원본에 같은 품종 ID가 두 번 있다. 하나를 지우거나 ID를 바꾼다.`), notes: [], changed: [] })
}

let registry
try {
  registry = parseFoodRegistry(JSON.parse(registryText))
} catch (error) {
  // 검사 문구가 이미 품종 ID로 시작하면 경로를 다시 붙이지 않는다.
  const issues = error?.issues?.map((issue) => (issue.code === "custom" ? `품종 ${issue.message}` : `품종 ${issue.path.join(".")}: ${issue.message}`))
  finish({ problems: issues ?? [`품종 원본을 읽을 수 없다: ${error.message}`], notes: [], changed: [] })
}

const infantArt = JSON.parse(readFileSync(join(data, "infant-art.json"), "utf8"))
const hasPrototype = existsSync(join(prototype, "kit/index.mjs"))

/** 그림 폴더(food.mjs가 있는 것)의 이름. */
const drawnDirs = (source) =>
  readdirSync(join(prototype, source), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(prototype, source, entry.name, "food.mjs")))
    .map((entry) => entry.name)
    .sort()

const metaProblems = []
let arts = null
if (hasPrototype) {
  arts = {}
  for (const id of drawnDirs("foods")) {
    const file = join(prototype, "foods", id, "art.json")
    if (!existsSync(file)) {
      metaProblems.push(`그림 ${id}: art.json이 없다. prototypes/seasonal-food/foods/${id}/art.json을 만든다(형식: packages/seasonal/src/data/art-meta.ts).`)
      continue
    }
    try {
      const meta = parseArtMeta(JSON.parse(readFileSync(file, "utf8")))
      if (meta.id !== id) metaProblems.push(`그림 ${id}: art.json의 id가 ${meta.id}다. 폴더 이름과 맞춘다.`)
      arts[id] = meta
    } catch (error) {
      metaProblems.push(`그림 ${id}: art.json 형식이 틀렸다(${error?.issues?.[0]?.message ?? error.message}).`)
    }
  }
}

const plan = planFoodSync({
  registry,
  infantArtIds: [...Object.values(infantArt.pairings), ...Object.values(infantArt.fruits)],
  arts,
  renamedIds: Object.keys(RENAMED_FOOD_IDS),
})
const problems = [...metaProblems, ...plan.problems]
const notes = [...plan.notes]
if (!hasPrototype) notes.push("prototypes/seasonal-food가 없어 그림은 건너뛰고 품종 목록만 다시 만든다(그림 산출물은 커밋된 그대로 둔다).")
if (problems.length || checkOnly) {
  for (const note of notes) say(note)
  if (!problems.length) say("검사 통과. --check라 아무것도 쓰지 않았다.")
  finish({ problems, notes, changed: [] })
}

// ── 2. 임시 폴더에 만든다 ─────────────────────────────────────────

rmSync(work, { recursive: true, force: true })
mkdirSync(work, { recursive: true })

/** 교체할 것: [임시 경로, 저장소 안 경로]. 파일과 폴더가 섞여 있다. */
const outputs = []
const stage = (name, target, text) => {
  if (text !== undefined) writeFileSync(join(work, name), text)
  outputs.push([join(work, name), join(root, target)])
}

const rows = foodRowsSource(registry)
stage("foods.generated.ts", "packages/seasonal/src/data/foods.generated.ts", rows.text)

if (hasPrototype) {
  const { renderSvg } = await import(pathToFileURL(join(prototype, "kit/index.mjs")))
  const styleText = readFileSync(join(prototype, "styles", STYLE_ID, "style.json"), "utf8")
  const style = JSON.parse(styleText)
  const kitSha = sha(
    readdirSync(join(prototype, "kit"))
      .filter((file) => file.endsWith(".mjs"))
      .sort()
      .map((file) => readFileSync(join(prototype, "kit", file), "utf8"))
      .join("\n"),
  )

  /** 그림 원본 prototype/<source>/<artId>/food.mjs를 outDir/<webId>/<variant>.svg로 그린다. */
  async function draw(source, list, outDir, variants) {
    const drawn = []
    for (const { webId, artId } of list) {
      const sourceFile = join(prototype, source, artId, "food.mjs")
      const food = (await import(pathToFileURL(sourceFile))).default
      mkdirSync(join(outDir, webId), { recursive: true })
      for (const variant of variants) {
        const file = join(outDir, webId, `${variant}.svg`)
        writeFileSync(file, renderSvg(food, style, variant, undefined, { shadow: false }))
        if (statSync(file).size === 0) problems.push(`그림 ${artId}: ${variant}.svg가 비었다. food.mjs를 확인한다.`)
      }
      drawn.push({ id: webId, artId, name: food.name, sha: sha(readFileSync(sourceFile, "utf8")) })
    }
    return drawn
  }

  const provenance = (title, intro, countLabel, variants, drawn) => `# ${title}

생성 파일. \`pnpm foods:sync\`(scripts/sync-foods.mjs)가 덮어쓴다.

${intro}

| 항목 | 값 |
|---|---|
| 그림체 | ${style.name} (\`${style.id}\` v${style.version}, style.json sha \`${sha(styleText)}\`) |
| kit sha | \`${kitSha}\` |
| 변형 | ${variants.map((variant) => `\`${variant}\``).join(", ")} |
| 바닥 그림자 | 끔 |
| ${countLabel} | ${drawn.length} |

| id | 이름 | food.mjs sha |
|---|---|---|
${drawn.map((item) => `| \`${item.id}\` | ${item.name} | \`${item.sha}\` |`).join("\n")}
${
  drawn.some((item) => item.artId !== item.id)
    ? `\n품종 ID와 그림 ID가 다른 것: ${drawn
        .filter((item) => item.artId !== item.id)
        .map((item) => `\`${item.id}\` ← 그림 \`${item.artId}\``)
        .join(", ")}\n`
    : ""
}`
  const idList = (comment, name, drawn) => `// 생성 파일. 직접 고치지 않는다. \`pnpm foods:sync\`로 다시 만든다.
// ${comment}

export const ${name} = [
${drawn.map((item) => `  ${JSON.stringify(item.id)},`).join("\n")}
] as const
`

  const foods = await draw("foods", plan.exports, join(work, "foods"), VARIANTS)
  writeFileSync(
    join(work, "foods/PROVENANCE.md"),
    provenance(
      "제철 일러스트 출처 기록",
      "이 폴더의 SVG는 이 프로젝트에서 직접 만든 제철 일러스트다. 원본(품종별 그리기 코드와 그림체 수치)은 저장소 밖 `prototypes/seasonal-food`에 있다.",
      "품종 수",
      VARIANTS,
      foods,
    ),
  )
  stage("foods", "apps/web/public/foods")
  stage("drawn-foods.generated.ts", "packages/seasonal/src/data/drawn-foods.generated.ts", idList("일러스트가 있는 품종 id. 없는 품종은 화면에서 이름 카드로 대신한다.", "DRAWN_FOOD_IDS", foods))

  // 전통 음식은 화면에 나오는 것(dish-rows.ts) 가운데 그림 폴더가 있는 것만 낸다. 그림 검수 파일을 두지 않는다.
  const dishDirs = drawnDirs("dishes")
  const shownDishes = dishDirs.filter((id) => DISH_ROWS.some((dish) => dish.id === id))
  const dishes = await draw("dishes", shownDishes.map((id) => ({ webId: id, artId: id })), join(work, "dishes"), DISH_VARIANTS)
  writeFileSync(
    join(work, "dishes/PROVENANCE.md"),
    provenance(
      "명절 전통 음식 일러스트 출처 기록",
      "이 폴더의 SVG는 이 프로젝트에서 직접 만든 명절 전통 음식 일러스트다. 원본(음식별 그리기 코드와 그림체 수치)은 저장소 밖 `prototypes/seasonal-food/dishes`에 있다.",
      "음식 수",
      DISH_VARIANTS,
      dishes,
    ),
  )
  stage("dishes", "apps/web/public/dishes")
  stage("drawn-dishes.generated.ts", "packages/seasonal/src/data/drawn-dishes.generated.ts", idList("그림이 있는 전통 음식 id. 없는 음식은 화면에서 이름 카드로 대신한다.", "DRAWN_DISH_IDS", dishes))

  const bounds = await foodBoundsSource(join(work, "foods"))
  stage("food-bounds.generated.ts", "packages/seasonal/src/data/food-bounds.generated.ts", bounds.text)

  say(`${style.id} v${style.version}: 그림 ${foods.length}개 → apps/web/public/foods/, 전통 음식 ${dishes.length}개 → apps/web/public/dishes/`)
  const skippedDishes = dishDirs.filter((id) => !shownDishes.includes(id))
  if (skippedDishes.length) notes.push(`화면에 없는 전통 음식이라 건너뜀 ${skippedDishes.length}개: ${skippedDishes.join(", ")}`)
  // 화면 id와 그림 폴더 이름이 어긋나면 그림이 조용히 빠지므로, 아직 안 그린 음식을 함께 알린다.
  const undrawn = DISH_ROWS.filter((dish) => !shownDishes.includes(dish.id))
  if (undrawn.length) notes.push(`그림이 없는 전통 음식 ${undrawn.length}개: ${undrawn.map((dish) => `${dish.id}(${dish.name})`).join(", ")}`)
}

// ── 3. 생성물을 확인하고 한 번에 교체한다 ─────────────────────────

if (problems.length) {
  rmSync(work, { recursive: true, force: true })
  finish({ problems, notes, changed: [] })
}

/** 파일이면 글, 폴더면 안의 파일 글을 모두 이은 것. 바뀌었는지 비교하는 데 쓴다. */
function fingerprint(path) {
  if (!existsSync(path)) return ""
  if (!statSync(path).isDirectory()) return sha(readFileSync(path))
  return sha(
    readdirSync(path, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => join(entry.parentPath, entry.name))
      .sort()
      .map((file) => `${file.slice(path.length)} ${sha(readFileSync(file))}`)
      .join("\n"),
  )
}

const changed = outputs.filter(([from, to]) => fingerprint(from) !== fingerprint(to))
const backup = join(work, "previous")
mkdirSync(backup, { recursive: true })
const swapped = []
try {
  for (const [index, [from, to]] of changed.entries()) {
    const kept = join(backup, String(index))
    if (existsSync(to)) renameSync(to, kept)
    swapped.push([kept, to])
    renameSync(from, to)
  }
} catch (error) {
  // 교체하다 멈추면 이미 바꾼 것을 되돌려 놓는다.
  for (const [kept, to] of swapped.reverse()) {
    rmSync(to, { recursive: true, force: true })
    if (existsSync(kept)) renameSync(kept, to)
  }
  rmSync(work, { recursive: true, force: true })
  finish({ problems: [`산출물을 교체하지 못해 되돌렸다: ${error.message}`], notes, changed: [] })
}
rmSync(work, { recursive: true, force: true })

for (const note of notes) say(note)
const changedPaths = changed.map(([, to]) => to.slice(root.length + 1))
say(`품종 ${rows.count}개. ${changedPaths.length ? `바뀐 산출물: ${changedPaths.join(", ")}` : "바뀐 산출물 없음."}`)
finish({ problems: [], notes, changed: changedPaths })
