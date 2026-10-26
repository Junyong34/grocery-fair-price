// 주 1회 보존 정리 (pipeline 3-9 보관 1·2·6, ingest-foundation/10). KAMIS 워크플로가 월요일 다시 받기 뒤에 부른다.
//   pnpm --filter @workspace/price-ingest purge [--dry-run]
// KAMIS 관측값은 최근 90일, 참가격은 최근 6 조사일만 남긴다. 그날의 요약이 없으면 지우지 않는다
// (price.purge_expired_observations, 마이그레이션 20261026000100). 원본(Storage)은 지우지 않는다.
// 환경변수: INGEST_DATABASE_URL. .env를 스스로 읽지 않는다.
import { parseArgs } from "node:util"

import { connectIngest } from "./load/db.ts"
import { actionsMaskCommands, describeError, redactorFromEnv, SECRET_ENV } from "./secrets.ts"

const DRY_RUN = Symbol("dry-run")

async function main(): Promise<void> {
  // Actions 로그 가리기에 인코딩 변형까지 더한다 (ingest-schedule/02 워크플로 규칙 2)
  if (process.env.GITHUB_ACTIONS === "true") {
    for (const line of actionsMaskCommands(SECRET_ENV.map((name) => process.env[name]))) console.log(line)
  }
  const { values } = parseArgs({ options: { "dry-run": { type: "boolean" } }, strict: true })
  const url = process.env.INGEST_DATABASE_URL
  if (!url) throw new Error("환경변수 INGEST_DATABASE_URL가 없다")
  const sql = connectIngest(url)
  try {
    await sql.begin(async (tx) => {
      const size = async () => (await tx<{ size: string }[]>`select pg_size_pretty(pg_database_size(current_database())) as size`)[0]!.size
      console.log(`DB 크기: ${await size()}`)
      for (const row of await tx<{ source: string; deleted: string }[]>`select source, deleted from price.purge_expired_observations()`) {
        console.log(`지움: ${row.source} ${row.deleted}행`)
      }
      if (values["dry-run"]) throw DRY_RUN
    })
  } catch (error) {
    if (error !== DRY_RUN) throw error
    console.log("--dry-run: 되돌렸다")
  } finally {
    await sql.end()
  }
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    console.error(describeError(error, redactorFromEnv()))
    process.exitCode = 1
  })
}
