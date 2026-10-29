// 축평원 백필 (ingest-foundation/04).
// 적재: 축평원 관측값은 영구라 90일 밖의 날도 관측값에 넣고, 그 날의 시세 요약은 임시 표에서 함께 낸다. 모두 되돌린다 (1999년 날짜).
// 실행: 가짜 축평원 응답(돼지 구분명을 '테스트'로 바꿔 카탈로그에 없는 키)과 로컬 DB·Storage로 끝까지 돈다.
// 시각을 1995년으로 고정하고 끝에 만든 것을 지운다.
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { ADAPTER_VERSION } from "../../src/adapt/draft.ts"
import { runBackfill, type BackfillDeps } from "../../src/backfill/run.ts"
import { applyClasses } from "../../src/catalog/apply.ts"
import type { FetchLike } from "../../src/http.ts"
import { EXIT } from "../../src/ingest/run.ts"
import { recomputeDailyQuote } from "../../src/load/daily-quote.ts"
import type { Sql, Tx } from "../../src/load/db.ts"
import { loadRawFile } from "../../src/load/load-file.ts"
import { buildRawFile, objectKeyOf, parseRawFile, type Json, type RawFile } from "../../src/load/raw-file.ts"
import type { RunJob } from "../../src/load/types.ts"
import { dayPrefix } from "../../src/load/window.ts"
import { EKAPE_ENDPOINT, parseEkapeConsumerPrice } from "../../src/sources/ekape.ts"
import { FAKE_KEY, readSampleText } from "../helpers.ts"
import { kamisFile, kamisSample, pending } from "./files.ts"
import { connectLocalAdmin, connectLocalIngest, inRollback, localStore } from "./local.ts"

const admin = connectLocalAdmin()

// 돼지 4부위 응답 (당일 4행 + 평년 4행, 2026-10-11)
const PORK = readSampleText("ekape/pork-all-items.xml")
const PORK_DAY = "20261011"

// 기준일 standYmd(YYYYMMDD)로 옮긴 돼지 응답. grade를 주면 구분명(grdNm)을 바꾼다
function porkXml(standYmd: string, grade?: string): string {
  const moved = PORK.replaceAll(PORK_DAY, standYmd)
  return grade === undefined ? moved : moved.replaceAll("<grdNm>구분없음</grdNm>", `<grdNm>${grade}</grdNm>`)
}

function ekapeFile(standYmd: string, job: RunJob): RawFile {
  const rows = parseEkapeConsumerPrice(200, porkXml(standYmd))
  const day = `${standYmd.slice(0, 4)}-${standYmd.slice(4, 6)}-${standYmd.slice(6, 8)}`
  return buildRawFile(
    {
      source: "ekape",
      endpoint: EKAPE_ENDPOINT,
      job,
      ingestRunId: null,
      runStartedAt: "2026-10-22T21:40:00.000Z",
      fetchedAt: "2026-10-22T21:40:05.000Z",
      requests: [{ endpoint: EKAPE_ENDPOINT, params: { standYmd, judgeKind: "4304" }, httpStatus: 200, resultCode: "00", rowCount: rows.length }],
      targetFrom: day,
      targetTo: day,
      contractBaseline: "baseline:test",
      adapterVersion: ADAPTER_VERSION,
    },
    rows as unknown as Json[],
  )
}

type Quote = { variety: string; spec: string; scope_key: string; obs_date: string; value: string; n: number; sources: string[] }

// 품종·규격 번호는 되돌릴 때마다 새로 붙으므로 slug·이름으로 비교한다
async function porkQuotes(tx: Tx): Promise<Quote[]> {
  return tx<Quote[]>`
    select v.slug as variety, s.name as spec, q.scope_key, q.obs_date::text, q.value::text, q.n, q.sources
      from price.daily_quote q join price.variety v on v.id = q.variety_id join price.spec s on s.id = q.spec_id
     where q.obs_date = '1999-10-11' and 'ekape' = any(q.sources) order by v.slug, s.name`
}

async function porkObservations(tx: Tx): Promise<number> {
  const [row] = await tx<{ n: number }[]>`
    select count(*)::int as n from price.observation o join price.source_item si on si.id = o.source_item_id
     where si.source = 'ekape' and o.obs_date = '1999-10-11'`
  return row!.n
}

// KAMIS 알배기배추 백필 요약 (1999-09-28~10-11, backfill.db.test와 같은 샘플)
async function cabbageQuotes(tx: Tx): Promise<{ scope_key: string; obs_date: string; value: string }[]> {
  return tx`
    select q.scope_key, q.obs_date::text, q.value::text from price.daily_quote q join price.variety v on v.id = q.variety_id
     where v.slug = 'baby-napa-cabbage' and q.obs_date < '2000-01-01' order by q.obs_date, q.scope_key`
}

async function sourceDay(tx: Tx): Promise<string | null> {
  const [row] = await tx<{ status: string }[]>`select status from price.source_day where source = 'ekape' and target_date = '1999-10-11'`
  return row?.status ?? null
}

// 정기 경로(관측값 → 재계산)로 낸 요약. 백필 요약이 이것과 같아야 한다
let regular: Quote[] = []

describe("축평원 백필 원본 적재 (되돌림)", () => {
  beforeAll(async () => {
    await inRollback(admin, async (tx) => {
      await applyClasses(tx)
      const file = ekapeFile("19991011", "daily")
      await loadRawFile(tx, await pending(tx, file, "ekape"), file)
      await recomputeDailyQuote(tx, "quote", ["1999-10-11"], "1999-10-12")
      regular = await porkQuotes(tx)
    })
    expect(regular.length).toBe(4)
    expect(regular.every((q) => q.scope_key === "national" && q.n === 1)).toBe(true)
  })

  it("90일 밖의 날도 관측값에 넣고, 정기 경로와 같은 시세 요약을 낸다. source_day는 만들지 않는다", async () => {
    await inRollback(admin, async (tx) => {
      await applyClasses(tx)
      const file = ekapeFile("19991011", "backfill")
      const outcome = await loadRawFile(tx, await pending(tx, file, "ekape"), file, { today: "2000-06-01" })

      expect(outcome.backfill).toEqual({ written: 4, days: 1 })
      expect(outcome.references).toBe(4)
      expect(await porkObservations(tx)).toBe(4)
      expect(await porkQuotes(tx)).toEqual(regular)
      expect(await sourceDay(tx)).toBeNull()
    })
  })

  it("90일 안의 날은 정기 적재처럼 source_day를 만든다", async () => {
    await inRollback(admin, async (tx) => {
      await applyClasses(tx)
      const file = ekapeFile("19991011", "backfill")
      await loadRawFile(tx, await pending(tx, file, "ekape"), file, { today: "1999-10-20" })
      expect(await sourceDay(tx)).toBe("ok")
    })
  })

  it("같은 날의 다른 출처 요약은 지우지 않는다", async () => {
    await inRollback(admin, async (tx) => {
      await applyClasses(tx)
      const kamis = kamisFile(kamisSample("1999", (row) => Object.assign(row, { item_cd: "279", vrty_cd: "00" })), null)
      const backfill = { ...kamis, header: { ...kamis.header, job: "backfill" as const } }
      await loadRawFile(tx, await pending(tx, backfill), backfill, { today: "2000-06-01" })
      const cabbage = await cabbageQuotes(tx)
      expect(cabbage.length).toBeGreaterThan(0)

      const file = ekapeFile("19991011", "backfill")
      await loadRawFile(tx, await pending(tx, file, "ekape"), file, { today: "2000-06-01" })
      expect(await cabbageQuotes(tx)).toEqual(cabbage)
    })
  })

  it("같은 원본을 다시 적재해도 관측값과 요약이 바뀌지 않는다", async () => {
    await inRollback(admin, async (tx) => {
      await applyClasses(tx)
      const file = ekapeFile("19991011", "backfill")
      await loadRawFile(tx, await pending(tx, file, "ekape"), file, { today: "2000-06-01" })
      const again = await loadRawFile(tx, await pending(tx, file, "ekape"), file, { today: "2000-06-01" })
      expect(again).toMatchObject({ backfill: { written: 0 }, observations: { changed: 0 }, references: 0 })
    })
  })
})

// ── 실행 (커밋) ─────────────────────────────────────────────

const INGEST_URL = "postgresql://ingest_writer:local-only-password@127.0.0.1:55322/postgres"
const store = localStore()
let sql: Sql

// 1995-10-11 22:00Z = 10-12 07:00 KST. --years 1이면 묶음은 1995-10(01~11일), 1995-09, …, 1994-01
function clock(): () => Date {
  let tick = 0
  return () => new Date(Date.UTC(1995, 9, 11, 22, 0, tick++))
}

// 요청한 기준일로 옮긴 돼지 응답. 구분명을 바꿔 카탈로그에 없는 키로 만든다 (실제 매핑의 시작일을 넓히지 않는다)
const TEST_GRADE = "테스트"

const fakeEkape: FetchLike = async (url) => {
  const standYmd = new URL(url).searchParams.get("standYmd")!
  return new Response(porkXml(standYmd, TEST_GRADE), { status: 200 })
}

function deps(over: Partial<BackfillDeps> = {}): BackfillDeps {
  return {
    env: { serviceKey: FAKE_KEY, supabaseUrl: "unused", secretKey: "unused", databaseUrl: INGEST_URL },
    store,
    fetch: fakeEkape,
    now: clock(),
    sleep: async () => {},
    log: () => {},
    ...over,
  }
}

async function tasks(): Promise<Record<string, string>> {
  const rows = await sql<{ task_key: string; status: string }[]>`
    select task_key, status from price.backfill_task where source = 'ekape' and task_key like 'ekape:4304:199_-__'`
  return Object.fromEntries(rows.map((r) => [r.task_key, r.status]))
}

beforeAll(async () => {
  sql = await connectLocalIngest()
})

afterAll(async () => {
  await store.remove(await store.list(dayPrefix("ekape", "1995-10-12")))
  await admin.begin(async (tx) => {
    const items = tx`select id from price.source_item where source = 'ekape' and key_parts->>'grdNm' = ${TEST_GRADE}`
    await tx`delete from price.observation where source_item_id in (${items})`
    await tx`delete from price.reference_observation where source_item_id in (${items})`
    await tx`delete from price.source_code_map where source_item_id in (${items})`
    await tx`delete from price.source_item where source = 'ekape' and key_parts->>'grdNm' = ${TEST_GRADE}`
    await tx`delete from price.source_day where source = 'ekape' and target_date < '1999-01-01'`
    const runs = tx`select id from price.ingest_run where source = 'ekape' and started_at < '1999-01-01'`
    await tx`delete from price.raw_object where ingest_run_id in (${runs})`
    await tx`delete from price.ingest_run where source = 'ekape' and started_at < '1999-01-01'`
    await tx`delete from price.backfill_task where source = 'ekape' and task_key like 'ekape:4304:199_-__'`
  })
  await Promise.all([sql.end(), admin.end()])
})

describe("축평원 백필 실행 (커밋, 순서대로)", () => {
  it("묶음마다 그 달의 날을 하루씩 부르고, 예산을 다 쓰면 부르던 묶음은 failed로 둔다", async () => {
    // 1995-10 묶음은 11회(10-01~10-11), 1995-09 묶음은 30회라 40회에서 멈춘다
    const result = await runBackfill({ source: "ekape", items: ["4304"], years: 1, budget: 40 }, deps())
    expect(result).toMatchObject({ exitCode: EXIT.partial, errorCode: "budget_exhausted", callsUsed: 40 })
    expect(result.done).toEqual(["ekape:4304:1995-10"])
    expect(result.failed).toEqual(["ekape:4304:1995-09"])
    expect(Object.keys(await tasks()).length).toBe(22) // 1994-01 ~ 1995-10

    const [raw] = await sql<{ storage_path: string; load_status: string; target_from: string; target_to: string }[]>`
      select r.storage_path, r.load_status, r.target_from::text, r.target_to::text
        from price.raw_object r where r.ingest_run_id = ${result.runId!} order by r.id limit 1`
    expect(raw).toMatchObject({ load_status: "loaded", target_from: "1995-10-01", target_to: "1995-10-11" })
    expect(raw!.storage_path).toMatch(/^raw\/ekape\/1995\/10\/12\/backfill-4304-1995-10-19951011T22\d{4}000Z\.ndjson\.gz$/)
    const file = parseRawFile(await store.download(objectKeyOf(raw!.storage_path)))
    expect(file.header).toMatchObject({ source: "ekape", job: "backfill" })
    expect(file.header.requests.map((r) => r.params.standYmd)).toEqual(
      Array.from({ length: 11 }, (_, i) => `199510${String(i + 1).padStart(2, "0")}`),
    )
    const [observed] = await sql<{ days: number; rows: number }[]>`
      select count(distinct o.obs_date)::int as days, count(*)::int as rows from price.observation o
        join price.source_item si on si.id = o.source_item_id where si.source = 'ekape' and si.key_parts->>'grdNm' = ${TEST_GRADE}`
    expect(observed).toEqual({ days: 11, rows: 44 })
  })

  it("다음 실행은 done이 아닌 묶음부터 이어 받고, 다 받은 뒤에는 실행 기록 없이 끝난다", async () => {
    const result = await runBackfill({ source: "ekape", items: ["4304"], years: 1, budget: 950 }, deps())
    expect(result).toMatchObject({ exitCode: EXIT.ok, errorCode: null, remaining: 0 })
    expect(result.done[0]).toBe("ekape:4304:1995-09")
    expect(Object.values(await tasks()).every((s) => s === "done")).toBe(true)

    const after = await runBackfill({ source: "ekape", items: ["4304"], years: 1 }, deps())
    expect(after).toMatchObject({ exitCode: EXIT.ok, runId: null, callsUsed: 0, done: [] })
  })

  it("다른 축평원 백필이 돌고 있으면 끝낸다", async () => {
    const holder = await admin.reserve()
    try {
      await holder`select pg_advisory_lock(hashtext('backfill:ekape'))`
      const result = await runBackfill({ source: "ekape", items: ["4304"], years: 1 }, deps())
      expect(result).toMatchObject({ exitCode: EXIT.partial, errorCode: "already_running", runId: null, callsUsed: 0 })
    } finally {
      await holder`select pg_advisory_unlock(hashtext('backfill:ekape'))`
      holder.release()
    }
  })
})
