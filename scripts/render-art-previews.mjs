/* global console, process */
// 그림 어드민이 보여 줄 미리보기를 그림 원본에서 그린다. 웹에 나가기 전의 그림(미검수, 용도 미정)도 볼 수 있게 한다.
//
//   node scripts/render-art-previews.mjs            바뀐 그림만 다시 그린다
//   node scripts/render-art-previews.mjs <그림 ID>  그 그림만
//
// 입력: prototypes/seasonal-food의 foods/<그림 ID>/food.mjs, kit, styles/watercolor
// 출력: node_modules/.cache/art-preview/<그림 ID>/{color,motion}.svg (Git에 없다. 지워도 다시 만들어진다)
// 그림체·바닥 그림자는 pnpm foods:sync(scripts/sync-foods.mjs)와 같게 그려, 검수한 그림과 웹에 나가는 그림이 같다.
// 어드민 서버가 이 스크립트를 실행한다. Next 번들에 prototypes의 kit을 끌어들이지 않으려고 따로 둔다.

import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const STYLE_ID = "watercolor"
const VARIANTS = ["color", "motion"]

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const prototype = join(root, "prototypes/seasonal-food")
const out = join(root, "node_modules/.cache/art-preview")
const sha = (text) => createHash("sha256").update(text).digest("hex").slice(0, 16)

if (!existsSync(join(prototype, "kit/index.mjs"))) {
  console.error("prototypes/seasonal-food가 없다. 그림 원본이 있는 기기에서만 미리보기를 그린다.")
  process.exit(1)
}

const { renderSvg } = await import(pathToFileURL(join(prototype, "kit/index.mjs")))
const styleText = readFileSync(join(prototype, "styles", STYLE_ID, "style.json"), "utf8")
const style = JSON.parse(styleText)
// 렌더러나 그림체가 바뀌면 모든 그림을 다시 그린다.
const toolSha = sha(
  styleText +
    readdirSync(join(prototype, "kit"))
      .filter((file) => file.endsWith(".mjs"))
      .sort()
      .map((file) => readFileSync(join(prototype, "kit", file), "utf8"))
      .join("\n"),
)

const only = process.argv.slice(2)
const ids = readdirSync(join(prototype, "foods"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(prototype, "foods", entry.name, "food.mjs")))
  .map((entry) => entry.name)
  .filter((id) => !only.length || only.includes(id))
  .sort()

let drawn = 0
const failed = []
for (const id of ids) {
  const source = join(prototype, "foods", id, "food.mjs")
  const stamp = `${toolSha} ${sha(readFileSync(source, "utf8"))}`
  const stampFile = join(out, id, "stamp")
  if (existsSync(stampFile) && readFileSync(stampFile, "utf8") === stamp) continue
  try {
    // 주소에 스탬프를 붙여 같은 프로세스에서 고친 food.mjs를 다시 읽게 한다.
    const food = (await import(`${pathToFileURL(source).href}?${encodeURIComponent(stamp)}`)).default
    mkdirSync(join(out, id), { recursive: true })
    for (const variant of VARIANTS) writeFileSync(join(out, id, `${variant}.svg`), renderSvg(food, style, variant, undefined, { shadow: false }))
    writeFileSync(stampFile, stamp)
    drawn++
  } catch (error) {
    failed.push(`${id}: ${error.message}`)
  }
}

console.log(JSON.stringify({ total: ids.length, drawn, failed }))
process.exit(failed.length ? 1 : 0)
