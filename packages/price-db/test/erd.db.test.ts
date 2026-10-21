// schema-map.html의 ERD가 마이그레이션을 적용한 DB와 같은지 본다.
import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"

import { expect, test } from "vitest"

test("schema-map.html의 ERD가 DB 카탈로그와 같다 (다르면 pnpm db:erd)", () => {
  const script = fileURLToPath(new URL("../scripts/build-erd.ts", import.meta.url))
  expect(() => execFileSync("node", [script, "--check"], { stdio: "pipe" })).not.toThrow()
})
