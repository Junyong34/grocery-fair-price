// 수집 명령 (ingest-schedule/07). 워크플로와 사람이 이것만 부른다.
//   pnpm --filter @workspace/price-ingest ingest --source kamis|ekape [--date YYYY-MM-DD]
//   pnpm --filter @workspace/price-ingest ingest --source chamga [--survey-day YYYY-MM-DD ...]
// --date는 기준일(KST, 기본 오늘)이다. KAMIS·축평원은 기준일의 D-3~D-1을 받는다 (pipeline 5-1).
// 참가격은 --survey-day가 없으면 자동 모드(최근 금요일 2개를 감지·완료 규칙대로, 10), 있으면 그 조사일들을 받는다
// (과거분 채우기, 12. 실행당 예산 1,500이라 한 번에 3개까지).
// 환경변수: DATA_GO_KR_SERVICE_KEY, SUPABASE_URL, SUPABASE_SECRET_KEY, INGEST_DATABASE_URL.
// .env를 스스로 읽지 않는다. 로컬에서는 넣을 곳(로컬 DB인지 운영인지)을 정해 직접 넘긴다.
import { parseArgs } from "node:util"

import { EXIT, runIngest } from "./ingest/run.ts"
import type { CollectRequest } from "./ingest/collect.ts"
import { seoulToday } from "./load/window.ts"
import { actionsMaskCommands, describeError, redactorFromEnv, SECRET_ENV } from "./secrets.ts"

const USAGE = "사용법: ingest --source kamis|ekape [--date YYYY-MM-DD] | ingest --source chamga [--survey-day YYYY-MM-DD ...]"
const YMD = /^\d{4}-\d{2}-\d{2}$/

export function parseRequest(argv: readonly string[], today: string): CollectRequest {
  const { values } = parseArgs({
    args: [...argv],
    options: { source: { type: "string" }, date: { type: "string" }, "survey-day": { type: "string", multiple: true } },
    strict: true,
  })
  const source = values.source
  if (source === "kamis" || source === "ekape") {
    const day = values.date ?? today
    if (!YMD.test(day)) throw new Error(`--date는 YYYY-MM-DD다. ${USAGE}`)
    return { source, day }
  }
  if (source === "chamga") {
    const surveyDays = values["survey-day"]
    if (surveyDays === undefined) return { source }
    if (!surveyDays.every((day) => YMD.test(day))) throw new Error(`--survey-day는 YYYY-MM-DD다. ${USAGE}`)
    return { source, surveyDays }
  }
  throw new Error(USAGE)
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`환경변수 ${name}가 없다`)
  return value
}

async function main(): Promise<number> {
  // Actions 로그 가리기에 인코딩 변형까지 더한다 (02 Answer 워크플로 규칙 2)
  if (process.env.GITHUB_ACTIONS === "true") {
    for (const line of actionsMaskCommands(SECRET_ENV.map((name) => process.env[name]))) console.log(line)
  }
  const request = parseRequest(process.argv.slice(2), seoulToday())
  const result = await runIngest(request, {
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
      // 모든 예상 밖 오류는 비밀값을 지운 뒤에만 찍는다 (02)
      console.error(describeError(error, redactorFromEnv()))
      process.exitCode = EXIT.unexpected
    })
}
