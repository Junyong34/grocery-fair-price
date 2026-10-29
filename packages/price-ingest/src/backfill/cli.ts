// 백필 명령 (ingest-foundation/04). 정기 수집이 끝난 뒤 부른다. 하루 예산을 다 쓰면 멈추고 다음 날 이어 받는다.
// KAMIS는 사람이, 축평원은 ingest-ekape.yml이 매일 정기 수집 뒤에 부른다 (하루 한도 1,000이라 열흘 남짓 걸린다).
//   pnpm --filter @workspace/price-ingest backfill [--source kamis|ekape] [--years 3] [--item 211 ...] [--budget 6000]
//   --item: KAMIS는 품목 코드, 축평원은 축종 코드(4304 등)
// 환경변수: DATA_GO_KR_SERVICE_KEY, SUPABASE_URL, SUPABASE_SECRET_KEY, INGEST_DATABASE_URL (수집 명령과 같다).
// .env를 스스로 읽지 않는다. 로컬에서는 넣을 곳(로컬 DB인지 운영인지)을 정해 직접 넘긴다.
import { appendFileSync } from "node:fs"
import { parseArgs } from "node:util"

import { EXIT } from "../ingest/run.ts"
import { actionsMaskCommands, describeError, redactorFromEnv, SECRET_ENV } from "../secrets.ts"
import { runBackfill, type BackfillRequest, type BackfillResult, type BackfillSource } from "./run.ts"

const USAGE = "사용법: backfill [--source kamis|ekape] [--years N] [--item 품목코드 ...] [--budget 호출수]"

// 실행 한 번의 예산 상한. 일일 한도(KAMIS 10,000, 축평원 1,000)를 넘기면 정기 수집까지 막힌다
const MAX_BUDGET: Record<BackfillSource, number> = { kamis: 9_000, ekape: 950 }

const positive = (name: string, value: string | undefined): number | undefined => {
  if (value === undefined) return undefined
  if (!/^\d+$/.test(value) || Number(value) < 1) throw new Error(`${name}는 1 이상의 정수다. ${USAGE}`)
  return Number(value)
}

export function parseBackfillRequest(argv: readonly string[]): BackfillRequest {
  const { values } = parseArgs({
    args: [...argv],
    options: {
      source: { type: "string" },
      years: { type: "string" },
      item: { type: "string", multiple: true },
      budget: { type: "string" },
    },
    strict: true,
  })
  const source = values.source ?? "kamis"
  if (source !== "kamis" && source !== "ekape") throw new Error(`--source는 kamis 또는 ekape다. ${USAGE}`)
  const budget = positive("--budget", values.budget)
  if (budget !== undefined && budget > MAX_BUDGET[source]) {
    throw new Error(`${source} --budget은 ${MAX_BUDGET[source].toLocaleString("en-US")}까지다. ${USAGE}`)
  }
  return { source, years: positive("--years", values.years), items: values.item, budget }
}

// 이번 실행이 마지막 묶음을 끝냈나. 이미 다 받아 아무것도 하지 않은 실행은 아니다.
// 워크플로가 이 값으로 평소가 6개월을 한 번 다시 낸다 (매일 실행은 최근 7일만 낸다, judgment.md 7장)
export function finishedThisRun(result: BackfillResult): boolean {
  return result.remaining === 0 && result.done.length > 0
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
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `finished=${finishedThisRun(result)}\n`)
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
