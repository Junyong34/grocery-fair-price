import { readdirSync, readFileSync } from "node:fs"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

// 데이터 경계(.scratch/price-screens/spec.md 3-2): 화면 · 컴포넌트는 price-source.ts만 import한다.
// 하드코딩 데이터(fixtures/, fixture-source)를 직접 부르면 Supabase로 바꿀 때 화면 코드를 고쳐야 한다.

const WEB_DIR = fileURLToPath(new URL("../../..", import.meta.url))
const DATA_DIR = fileURLToPath(new URL(".", import.meta.url))

const sourceFiles = ["app", "features", "shared"].flatMap((dir) =>
  readdirSync(join(WEB_DIR, dir), { recursive: true, encoding: "utf8" })
    .filter((file) => /\.(ts|tsx)$/.test(file))
    .map((file) => join(WEB_DIR, dir, file))
)

const importsOf = (file: string) =>
  [...readFileSync(file, "utf8").matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)].map((match) => match[1]!)

describe("가격 데이터 경계", () => {
  it("data/ 밖에서는 fixtures와 fixture-source를 import하지 않는다", () => {
    const outside = sourceFiles.filter((file) => !file.startsWith(DATA_DIR))
    const leaks = outside.flatMap((file) =>
      importsOf(file)
        .filter((path) => /(^|\/)(fixtures|fixture-source)(\/|$)/.test(path))
        .map((path) => `${relative(WEB_DIR, file)} → ${path}`)
    )
    expect(leaks, "화면은 getPriceSource()로 읽는다 (features/price/data/price-source.ts)").toEqual([])
  })

  it("검사 대상 파일을 실제로 읽는다", () => {
    expect(sourceFiles.some((file) => file.endsWith("price-source.ts"))).toBe(true)
  })
})
