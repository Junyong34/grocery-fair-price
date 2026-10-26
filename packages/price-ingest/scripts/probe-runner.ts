// 러너에서 공공 API 3개와 Supabase(DB·Storage)에 붙는지 잰다 (ingest-schedule/03).
// 출처마다 가장 가벼운 호출 1회, DB는 select current_user, Storage는 raw 버킷 목록 1회.
// 성공·실패와 걸린 시간, 오류 종류만 찍는다. 값·키·주소는 찍지 않는다 (02).
// 실행: pnpm --filter @workspace/price-ingest probe:runner (루트 .env 또는 Actions Secrets의 환경변수)
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { createObjectStore } from "../src/load/storage.ts"
import { connectIngest } from "../src/load/db.ts"
import { actionsMaskCommands, errorSummary, redactorFromEnv, SECRET_ENV } from "../src/secrets.ts"
import { fetchChamgaPrice } from "../src/sources/chamgagyeok.ts"
import { fetchEkapeConsumerPrice } from "../src/sources/ekape.ts"
import { fetchKamisPerDay } from "../src/sources/kamis.ts"
import type { CallRecord } from "../src/http.ts"

const rootEnv = fileURLToPath(new URL("../../../.env", import.meta.url))
if (!process.env.GITHUB_ACTIONS && existsSync(rootEnv)) process.loadEnvFile(rootEnv)
if (process.env.GITHUB_ACTIONS === "true") {
  for (const line of actionsMaskCommands(SECRET_ENV.map((name) => process.env[name]))) console.log(line)
}

function env(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name}가 없다`)
  return value
}

type Result = { target: string; ok: boolean; ms: number; detail: string }

const redact = redactorFromEnv()

async function measure(target: string, run: () => Promise<string>): Promise<Result> {
  const start = performance.now()
  try {
    const detail = await run()
    return { target, ok: true, ms: Math.round(performance.now() - start), detail }
  } catch (error) {
    return { target, ok: false, ms: Math.round(performance.now() - start), detail: errorSummary(error, redact) }
  }
}

// 지난 고정일. 값이 늘 있어 0건과 실패를 가를 수 있다 (contract/probes.ts와 같은 날)
const records: CallRecord[] = []
const call = () => ({ serviceKey: env("DATA_GO_KR_SERVICE_KEY"), timeoutMs: 30_000, onCall: (r: CallRecord) => records.push(r) })

const results: Result[] = []
results.push(
  await measure("KAMIS perDay/price", async () => {
    const rows = await fetchKamisPerDay(call(), { fromYmd: "20260928", toYmd: "20260928", ctgryCd: "200", itemCd: "211", seCd: "01" })
    return `${rows.length}행`
  }),
)
results.push(
  await measure("축평원 consumerPriceDaily", async () => {
    const rows = await fetchEkapeConsumerPrice(call(), { standYmd: "20261011", judgeKind: "4304" })
    return `${rows.length}행`
  }),
)
results.push(
  await measure("참가격 getProductPriceInfoSvc", async () => {
    const rows = await fetchChamgaPrice(call(), { goodInspectDay: "20260925", goodId: "1000" })
    return `${rows.length}행`
  }),
)
results.push(
  await measure("Supabase DB (Supavisor)", async () => {
    const sql = connectIngest(env("INGEST_DATABASE_URL"))
    try {
      const [row] = await sql<{ user: string }[]>`select current_user as user`
      return `current_user=${row?.user}`
    } finally {
      await sql.end({ timeout: 5 })
    }
  }),
)
results.push(
  await measure("Supabase Storage", async () => {
    const store = createObjectStore({ url: env("SUPABASE_URL"), secretKey: env("SUPABASE_SECRET_KEY") })
    const keys = await store.list("kamis/")
    return `목록 ${keys.length}개`
  }),
)

const kst = new Date(Date.now() + 9 * 3_600_000).toISOString().replace("T", " ").slice(0, 16)
console.log(`실측 ${kst} KST, 러너 ${process.env.RUNNER_OS ?? "local"} ${process.env.RUNNER_ARCH ?? ""}`)
for (const r of results) console.log(redact(`${r.ok ? "성공" : "실패"} | ${r.target} | ${r.ms}ms | ${r.detail}`))
console.log(redact(`API 호출 ${records.length}회: ${records.map((r) => `${r.endpoint} HTTP ${r.httpStatus} ${r.resultCode ?? "-"}`).join(", ")}`))
process.exit(results.every((r) => r.ok) ? 0 : 1)
