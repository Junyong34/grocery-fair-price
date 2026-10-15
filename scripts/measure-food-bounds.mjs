/* global console */
// 일러스트가 상자(정사각형) 안에서 차지하는 세로 범위를 잰다. 이름표를 그림 바로 아래에 붙이는 데 쓴다.
//
//   pnpm foods:bounds   (pnpm foods:sync가 끝에 자동으로 돌린다)
//
// apps/web/public/foods/<id>/color.svg를 그려서 투명하지 않은 가장 아래 줄을 찾는다.
// 출력: packages/seasonal/src/data/food-bounds.generated.ts (id → 그림 아래 끝, 상자 높이 대비 0..1)

import { readdirSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import sharp from "sharp"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const foodsDir = join(root, "apps/web/public/foods")
const outFile = join(root, "packages/seasonal/src/data/food-bounds.generated.ts")

const SIZE = 256
const ALPHA = 12

const ids = readdirSync(foodsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()

const rows = []
for (const id of ids) {
  const { data, info } = await sharp(join(foodsDir, id, "color.svg"), { density: 144 })
    .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  let bottom = 0
  for (let y = info.height - 1; y >= 0 && !bottom; y--) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * info.channels + 3] > ALPHA) {
        bottom = y + 1
        break
      }
    }
  }
  rows.push([id, Math.round((bottom / info.height) * 100) / 100])
}

writeFileSync(
  outFile,
  `// 생성 파일. 직접 고치지 않는다. \`pnpm foods:bounds\`로 다시 만든다.
// 일러스트가 상자 안에서 아래로 어디까지 그려지는지(상자 높이 대비 0..1). 이름표를 그림에 붙이는 데 쓴다.

export const FOOD_BOTTOM: Readonly<Record<string, number>> = {
${rows.map(([id, bottom]) => `  ${JSON.stringify(id)}: ${bottom},`).join("\n")}
}
`,
)
console.log(`${rows.length}개 품종의 그림 아래 끝을 잼 → packages/seasonal/src/data/food-bounds.generated.ts`)
