/* global console, process */
// 그림 폴더마다 내용 해시를 만든다. 화면이 그림 주소에 ?v=<해시>로 붙여 1년 immutable 캐시를 받는다(next.config.ts headers).
//
//   pnpm foods:versions   (pnpm foods:sync가 끝에 자동으로 돌린다)
//
// apps/web/public/foods/<웹 폴더>/{color,motion}.svg를 읽기만 하고 SVG는 고치지 않는다.
// 출력: packages/seasonal/src/data/food-versions.generated.ts (웹 폴더 → color·motion 내용 해시 앞 8자)

import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { foodVersion, foodVersionsText } from "../packages/seasonal/src/data/food-versions.ts"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")

/** foodsDir/<웹 폴더>/{color,motion}.svg의 해시로 food-versions.generated.ts의 글을 만든다. */
export async function foodVersionsSource(foodsDir) {
  const ids = readdirSync(foodsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)

  const versions = {}
  for (const id of ids) {
    const read = (variant) => readFileSync(join(foodsDir, id, `${variant}.svg`), "utf8")
    versions[id] = await foodVersion({ color: read("color"), motion: read("motion") })
  }
  return { count: ids.length, text: foodVersionsText(versions) }
}

// pnpm foods:versions로 직접 돌릴 때만 파일을 쓴다. pnpm foods:sync는 foodVersionsSource를 가져다 쓴다.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { count, text } = await foodVersionsSource(join(root, "apps/web/public/foods"))
  writeFileSync(join(root, "packages/seasonal/src/data/food-versions.generated.ts"), text)
  console.log(`${count}개 그림 폴더의 내용 해시 → packages/seasonal/src/data/food-versions.generated.ts`)
}
