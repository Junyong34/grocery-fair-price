// KAMIS 소매 백필 명령 (ingest-foundation/04). 정기 수집이 끝난 뒤 사람이 부른다. 하루 예산을 다 쓰면 멈추고 다음 날 이어 받는다.
//   pnpm --filter @workspace/price-ingest backfill [--years 3] [--item 211 ...] [--budget 6000]
// 환경변수: DATA_GO_KR_SERVICE_KEY, SUPABASE_URL, SUPABASE_SECRET_KEY, INGEST_DATABASE_URL (수집 명령과 같다).
// .env를 스스로 읽지 않는다. 로컬에서는 넣을 곳(로컬 DB인지 운영인지)을 정해 직접 넘긴다.
import { parseArgs } from "node:util"

import { EXIT } from "../ingest/run.ts"
import { actionsMaskCommands, describeError, redactorFromEnv, SECRET_ENV } from "../secrets.ts"
import { runBackfill, type BackfillRequest } from "./run.ts"

const USAGE = "사용법: backfill [--years N] [--item 품목코드 ...] [--budget 호출수]"

const positive = (name: string, value: string | undefined): number | undefined => {
  if (value === undefined) return undefined
  if (!/^\d+$/.test(value) || Number(value) < 1) throw new Error(`${name}는 1 이상의 정수다. ${USAGE}`)
  return Number(value)
}

export function parseBackfillRequest(argv: readonly string[]): BackfillRequest {
  const { values } = parseArgs({
    args: [...argv],
    options: {
      years: { type: "string" },
      item: { type: "string", multiple: true },
      budget: { type: "string" },
    },
    strict: true,
  })
  // 일일 한도(10,000)를 넘는 예산은 받지 않는다. 한도를 넘기면 정기 수집까지 막힌다
  const budget = positive("--budget", values.budget)
  if (budget !== undefined && budget > 9_000) throw new Error(`--budget은 9,000까지다. ${USAGE}`)
  return { years: positive("--years", values.years), items: values.item, budget }
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`환경변수 ${name}가 없다`)
  return value
}

async function main(): Promise<number> {
  if (process.env.GITHUB_ACTIONS === "true") {
    for (const line of actionsMaskCommands(SECRET_ENV.map((name) => process.env[name]))) console.log(line)
  }
  const result = await runBackfill(parseBackfillRequest(process.argv.slice(2)), {
    env: {
      serviceKey: required("DATA_GO_KR_SERVICE_KEY"),
      supabaseUrl: required("SUPABASE_URL"),
      secretKey: required("SUPABASE_SECRET_KEY"),
      databaseUrl: required("INGEST_DATABASE_URL"),
    },
    gitSha: process.env.GITHUB_SHA ?? null,
  })
  return result.exitCode
}

if (import.meta.main) {
  main()
    .then((code) => {
      process.exitCode = code
    })
    .catch((error: unknown) => {
      console.error(describeError(error, redactorFromEnv()))
      process.exitCode = EXIT.unexpected
    })
}
