// 참가격 상품 요약 명령 (ingest-foundation/07). 사람이 부른다. 정기 수집은 적재 뒤에 스스로 계산한다 (run.ts).
//   pnpm --filter @workspace/price-ingest summary [--day YYYY-MM-DD ...]            관측값으로 다시 계산 (날을 안 주면 요약 없는 조사일)
//   pnpm --filter @workspace/price-ingest summary --from-raw --day YYYY-MM-DD ...   원본(Storage)에서 다시 계산 (관측값을 지운 조사일)
//   pnpm --filter @workspace/price-ingest summary --check [--day YYYY-MM-DD ...]    두 길의 결과가 같은지 본다 (DB를 바꾸지 않는다, 날을 안 주면 관측값이 있는 모든 조사일)
// --dry-run: 계산한 뒤 되돌린다. 환경변수: INGEST_DATABASE_URL, (--from-raw, --check) SUPABASE_URL, SUPABASE_SECRET_KEY.
// .env를 스스로 읽지 않는다.
import { parseArgs } from "node:util"

import { connectIngest, type Tx } from "./load/db.ts"
import { checkRawSummary, rebuildProductSummaryFromRaw, recomputeProductSummary, surveyDaysWithoutSummary } from "./load/product-summary.ts"
import { createObjectStore } from "./load/storage.ts"
import { actionsMaskCommands, describeError, redactorFromEnv, SECRET_ENV } from "./secrets.ts"

const USAGE = "사용법: summary [--from-raw | --check] [--day YYYY-MM-DD ...] [--dry-run]"
const DRY_RUN = Symbol("dry-run")

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`환경변수 ${name}가 없다`)
  return value
}

async function observedDays(tx: Tx): Promise<string[]> {
  const rows = await tx<{ day: string }[]>`
    select distinct obs_date::text as day from price.observation where obs_kind = 'shelf_price' order by 1`
  return rows.map((r) => r.day)
}

async function main(): Promise<number> {
  if (process.env.GITHUB_ACTIONS === "true") {
    for (const line of actionsMaskCommands(SECRET_ENV.map((name) => process.env[name]))) console.log(line)
  }
  const { values } = parseArgs({
    options: {
      day: { type: "string", multiple: true },
      "from-raw": { type: "boolean" },
      check: { type: "boolean" },
      "dry-run": { type: "boolean" },
    },
    strict: true,
  })
  const days = values.day ?? []
  if (days.some((d) => !/^\d{4}-\d{2}-\d{2}$/.test(d))) throw new Error(`--day는 YYYY-MM-DD다. ${USAGE}`)
  if (values["from-raw"] && values.check) throw new Error(`--from-raw와 --check는 함께 쓰지 않는다. ${USAGE}`)
  if (values["from-raw"] && days.length === 0) throw new Error(`--from-raw는 --day가 필요하다. ${USAGE}`)
  const store = () => createObjectStore({ url: required("SUPABASE_URL"), secretKey: required("SUPABASE_SECRET_KEY") })

  const sql = connectIngest(required("INGEST_DATABASE_URL"))
  let exitCode = 0
  try {
    await sql.begin(async (tx) => {
      if (values.check) {
        for (const day of days.length > 0 ? days : await observedDays(tx)) {
          const c = await checkRawSummary(tx, store(), day)
          const same = c.differing === 0 && c.onlyObservation === 0 && c.onlyRaw === 0
          if (!same) exitCode = 1
          console.log(
            `${same ? "같음" : "다름"}: ${day} 원본 ${c.files}개 ${c.rows}행, 요약 ${c.summaryRows}행` +
              `, 값이 다른 행 ${c.differing}, 관측값에만 ${c.onlyObservation}, 원본에만 ${c.onlyRaw}`,
          )
        }
        return
      }
      if (values["from-raw"]) {
        for (const day of days) {
          const r = await rebuildProductSummaryFromRaw(tx, store(), day)
          console.log(`원본에서: ${day} 원본 ${r.files}개 ${r.rows}행, 고친 행 ${r.written}, 지운 행 ${r.removed}`)
        }
      } else {
        const targets = days.length > 0 ? days : await surveyDaysWithoutSummary(tx)
        const r = await recomputeProductSummary(tx, targets)
        console.log(`관측값에서: 조사일 ${r.days}개 (${targets.join(", ") || "없음"}), 고친 행 ${r.written}, 지운 행 ${r.removed}`)
      }
      if (values["dry-run"]) throw DRY_RUN
    })
  } catch (error) {
    if (error !== DRY_RUN) throw error
    console.log("--dry-run: 되돌렸다")
  } finally {
    await sql.end()
  }
  return exitCode
}

if (import.meta.main) {
  main()
    .then((code) => {
      process.exitCode = code
    })
    .catch((error: unknown) => {
      console.error(describeError(error, redactorFromEnv()))
      process.exitCode = 1
    })
}
