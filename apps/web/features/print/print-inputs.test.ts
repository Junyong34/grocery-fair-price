import { existsSync, readFileSync, statSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

import { PRINT_DATA_MODULES } from "@workspace/seasonal/print/inputs"
import { PRINT_KINDS, type PrintKind } from "@workspace/seasonal/print/spec"

// 인쇄물 렌더러가 읽는 데이터 모듈이 모두 PDF 데이터 해시(print/inputs.ts)에 들어 있는지 본다.
// 렌더러에서 import를 따라가(타입 import는 뺀다) packages/seasonal/src/data/*와 calendar/holidays에 닿는 것을 모은다.
// 여기서 빠진 모듈이 있으면 그 데이터가 바뀌어도 어드민이 옛 PDF를 최신으로 본다.

const WEB_DIR = fileURLToPath(new URL("../..", import.meta.url))
const SEASONAL_DIR = fileURLToPath(new URL("../../../../packages/seasonal/src", import.meta.url))

/** 인쇄물 종류마다 /print 페이지가 그리는 렌더러(app/print/page.tsx). */
const RENDERERS: Record<PrintKind, string> = {
  monthly: "features/print/print-document.tsx",
  "year-sheet": "features/print/print-document.tsx",
  "season-poster": "features/print/print-document.tsx",
  "month-poster": "features/print/print-document.tsx",
  "baby-food-pairings": "features/baby-food/pairing-print.tsx",
  "baby-food-fruits": "features/baby-food/fruits/fruits-print.tsx",
}

function resolveImport(from: string, path: string): string | null {
  const base = path.startsWith("@workspace/seasonal/")
    ? join(SEASONAL_DIR, path.slice("@workspace/seasonal/".length))
    : path.startsWith("@/")
      ? join(WEB_DIR, path.slice(2))
      : path.startsWith(".")
        ? join(dirname(from), path)
        : null
  if (!base) return null
  return [base, `${base}.ts`, `${base}.tsx`].find((file) => existsSync(file) && statSync(file).isFile()) ?? null
}

/** 렌더러에서 닿는 데이터 모듈(packages/seasonal/src 기준 경로, 확장자 없음). */
function dataModulesOf(entry: string): string[] {
  const seen = new Set<string>()
  const found = new Set<string>()
  const stack = [join(WEB_DIR, entry)]
  while (stack.length > 0) {
    const file = stack.pop()!
    if (seen.has(file) || file.endsWith(".json")) continue
    seen.add(file)
    for (const match of readFileSync(file, "utf8").matchAll(/^import\s+(type\s+)?[^"']*?from\s+["']([^"']+)["']/gm)) {
      if (match[1]) continue
      const target = resolveImport(file, match[2]!)
      if (!target) continue
      if (target.startsWith(SEASONAL_DIR)) {
        const name = relative(SEASONAL_DIR, target).replace(/\.(ts|tsx|json)$/, "")
        if (name.startsWith("data/") || name === "calendar/holidays") found.add(name)
      }
      if (target.startsWith(SEASONAL_DIR) || target.startsWith(join(WEB_DIR, "features")) || target.startsWith(join(WEB_DIR, "shared")))
        stack.push(target)
    }
  }
  return [...found].sort()
}

describe("인쇄물 데이터 해시", () => {
  it.each(PRINT_KINDS)("%s 렌더러가 읽는 데이터 모듈이 모두 해시에 들어 있다", (kind) => {
    const reached = dataModulesOf(RENDERERS[kind])
    expect(reached.length).toBeGreaterThan(0)
    const missing = reached.filter((name) => !(PRINT_DATA_MODULES[kind] as readonly string[]).includes(name))
    expect(missing, "packages/seasonal/src/print/inputs.ts의 PRINT_DATA_MODULES에 더한다").toEqual([])
  })
})
