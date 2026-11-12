/* global console */
// 제철 품종 목록(src/data/foods.generated.ts)만 품종 원본에서 다시 만든다. prototypes/ 없이 돌아간다.
//
//   pnpm --filter @workspace/seasonal build:foods
//
// 원본: src/data/food-registry.json (ADR 0006). 검사와 그림까지 한 번에 하려면 루트에서 pnpm foods:sync를 쓴다.

import { readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { parseFoodRegistry } from "../src/data/food-registry.ts"
import { foodRowsSource } from "./food-rows-source.mjs"

const here = dirname(fileURLToPath(import.meta.url))
const out = resolve(here, "../src/data/foods.generated.ts")
const registry = parseFoodRegistry(JSON.parse(readFileSync(resolve(here, "../src/data/food-registry.json"), "utf8")))
const { count, text } = foodRowsSource(registry)

writeFileSync(out, text)
console.log(`${count}개 품종 → ${out}`)
