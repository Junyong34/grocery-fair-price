// 카탈로그 명령 (ingest-foundation/08, catalog-scale/04, ADR 0005). 사람이 로컬에서 부른다. 카탈로그 원본은 운영 DB다.
//   pnpm --filter @workspace/price-ingest catalog --export [--file 경로]            DB → 사본 (INGEST_DATABASE_URL). 기본 경로는 src/catalog/snapshot.json
//   pnpm --filter @workspace/price-ingest catalog --import [--file 경로] [--dry-run] 사본 → 분류 표·규칙 표 (OWNER_DATABASE_URL, 소유자 postgres)
//   pnpm --filter @workspace/price-ingest catalog --mappings [--dry-run]            규칙대로 매핑 (INGEST_DATABASE_URL, ingest_writer)
// 가져오기는 로컬 DB 채우기와 운영 복구에 쓴다. 바뀐 분류 단위는 catalog_change에 남긴다.
// 매핑을 맞춘 뒤 이미 쌓인 관측값을 다시 매핑하고(09), 관측값이 있는 날의 일자 요약을 다시 계산한다(10).
// --dry-run은 같은 일을 하고 되돌린다.
// .env를 스스로 읽지 않는다. 넣을 곳(로컬 DB인지 운영인지)을 정해 직접 넘긴다.
import { writeFileSync } from "node:fs"
import { parseArgs } from "node:util"

import { connectIngest, type Tx } from "../load/db.ts"
import { recomputeDailyQuote } from "../load/daily-quote.ts"
import { lockSource } from "../load/observation.ts"
import { remapObservations } from "../load/variety.ts"
import { seoulToday } from "../load/window.ts"
import { describeError, redactorFromEnv } from "../secrets.ts"

import { applyMappings } from "./apply.ts"
import { exportSnapshot, importSnapshot } from "./db.ts"
import { formatSnapshot, readSnapshot, SNAPSHOT_PATH } from "./snapshot.ts"

const USAGE = "사용법: catalog --export|--import|--mappings [--file 경로] [--dry-run]"
const DRY_RUN = Symbol("dry-run")

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`환경변수 ${name}가 없다`)
  return value
}

async function run(url: string, dryRun: boolean, fn: (tx: Tx) => Promise<unknown>): Promise<void> {
  const sql = connectIngest(url)
  try {
    await sql.begin(async (tx) => {
      console.log(JSON.stringify(await fn(tx), null, 2))
      if (dryRun) throw DRY_RUN
    })
  } catch (error) {
    if (error !== DRY_RUN) throw error
    console.log("--dry-run: 되돌렸다")
  } finally {
    await sql.end()
  }
}

// 매핑을 넣고 출처마다 관측값을 다시 매핑한다. 적재와 겹치지 않게 출처 lock을 잡는다
async function applyMappingsAndRemap(tx: Tx) {
  const mappings = await applyMappings(tx)
  const remapped: Record<string, number> = {}
  for (const source of ["kamis", "ekape", "chamga"] as const) {
    await lockSource(tx, source)
    remapped[source] = await remapObservations(tx, source)
  }
  const days = async (kind: string) =>
    (await tx<{ day: string }[]>`select distinct obs_date::text as day from price.observation where obs_kind = any(${kind.split(",")})`).map(
      (r) => r.day,
    )
  const today = seoulToday()
  const dailyQuote = {
    quote: await recomputeDailyQuote(tx, "quote", await days("quote_sample,quote_aggregate"), today),
    shelf_price: await recomputeDailyQuote(tx, "shelf_price", await days("shelf_price"), today),
  }
  return { ...mappings, remapped, dailyQuote }
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      export: { type: "boolean" },
      import: { type: "boolean" },
      mappings: { type: "boolean" },
      file: { type: "string" },
      "dry-run": { type: "boolean" },
    },
    strict: true,
  })
  const dryRun = values["dry-run"] === true
  const file = values.file ?? SNAPSHOT_PATH
  if ([values.export, values.import, values.mappings].filter(Boolean).length !== 1) throw new Error(USAGE)
  if (values.export) {
    const sql = connectIngest(required("INGEST_DATABASE_URL"))
    try {
      const snapshot = await sql.begin("read only", (tx) => exportSnapshot(tx))
      writeFileSync(file, formatSnapshot(snapshot))
      console.log(`내보냄: ${file} (카테고리 ${snapshot.categories.length}, 품목 ${snapshot.items.length}, 품종 ${snapshot.varieties.length}, 예외 ${snapshot.exceptions.length})`)
    } finally {
      await sql.end()
    }
  } else if (values.import) {
    const snapshot = readSnapshot(file)
    await run(required("OWNER_DATABASE_URL"), dryRun, async (tx) => {
      const result = await importSnapshot(tx, snapshot, `import:${file.split("/").pop()}`)
      return { ...result, changes: result.changes.map((c) => `${c.action} ${c.target} ${c.targetKey}`) }
    })
  } else await run(required("INGEST_DATABASE_URL"), dryRun, applyMappingsAndRemap)
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    // 비밀값을 지운 뒤에만 찍는다 (ingest-schedule/02)
    console.error(describeError(error, redactorFromEnv()))
    process.exitCode = 1
  })
}
