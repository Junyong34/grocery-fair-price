// 품종 카탈로그를 DB에 넣는 명령 (ingest-foundation/08). 사람이 로컬에서 부른다.
//   pnpm --filter @workspace/price-ingest catalog --classes [--dry-run]    분류 표 (OWNER_DATABASE_URL, 소유자 postgres)
//   pnpm --filter @workspace/price-ingest catalog --mappings [--dry-run]   매핑 (INGEST_DATABASE_URL, ingest_writer)
// 분류 표를 먼저 넣고 매핑을 넣는다. 매핑을 넣은 뒤 이미 쌓인 관측값을 다시 매핑한다 (09).
// --dry-run은 같은 일을 하고 되돌린다.
// .env를 스스로 읽지 않는다. 넣을 곳(로컬 DB인지 운영인지)을 정해 직접 넘긴다.
import { parseArgs } from "node:util"

import { connectIngest, type Tx } from "../load/db.ts"
import { lockSource } from "../load/observation.ts"
import { remapObservations } from "../load/variety.ts"
import { describeError, redactorFromEnv } from "../secrets.ts"

import { applyClasses, applyMappings } from "./apply.ts"

const USAGE = "사용법: catalog --classes|--mappings [--dry-run]"
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
  return { ...mappings, remapped }
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: { classes: { type: "boolean" }, mappings: { type: "boolean" }, "dry-run": { type: "boolean" } },
    strict: true,
  })
  const dryRun = values["dry-run"] === true
  if (values.classes === values.mappings) throw new Error(USAGE)
  if (values.classes) await run(required("OWNER_DATABASE_URL"), dryRun, applyClasses)
  else await run(required("INGEST_DATABASE_URL"), dryRun, applyMappingsAndRemap)
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    // 비밀값을 지운 뒤에만 찍는다 (ingest-schedule/02)
    console.error(describeError(error, redactorFromEnv()))
    process.exitCode = 1
  })
}
