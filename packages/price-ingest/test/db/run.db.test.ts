// 수집 실행 한 번을 끝까지 (ingest-schedule/07): 실행 기록 → 호출 → 업로드 → 대조 → 적재 → 마감.
// 가짜 KAMIS 응답(1997년, 품목 8211, 시장 9xxxxxx)과 로컬 DB·Storage로 돈다. 시각도 1997년으로 고정해
// Storage 날짜 폴더·대조 기간이 실제 데이터와 겹치지 않게 한다. 끝에 만든 것을 지운다.
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { EXIT, runIngest, type IngestDeps } from "../../src/ingest/run.ts"
import { connectIngest, type Sql } from "../../src/load/db.ts"
import { objectKeyOf } from "../../src/load/raw-file.ts"
import { dayPrefix } from "../../src/load/window.ts"
import { FAKE_KEY } from "../helpers.ts"
import { fakeKamis, KEY_ERROR_BODY, syntheticKamisRows } from "../fixtures/fake-api.ts"
import { connectLocalAdmin, connectLocalIngest, localStore } from "./local.ts"

const INGEST_URL = "postgresql://ingest_writer:local-only-password@127.0.0.1:55322/postgres"
const DAY = "1997-10-02" // 기준일. 1997-09-29~10-01을 받는다
const store = localStore()
const admin = connectLocalAdmin()
const runIds: number[] = []
let sql: Sql

beforeAll(async () => {
  sql = await connectLocalIngest() // 롤 비밀번호를 넣는다
})

// 1997-10-01 22:00Z(= 10-02 07:00 KST)부터 부를 때마다 1초씩 간다 (호출마다 걸린 시간을 재느라 몇 분 지난다)
function clock(startMinute: number): () => Date {
  let tick = 0
  return () => new Date(Date.UTC(1997, 9, 1, 22, startMinute, tick++))
}

function deps(over: Partial<IngestDeps> & { startMinute: number }): IngestDeps {
  return {
    env: { serviceKey: FAKE_KEY, supabaseUrl: "unused", secretKey: "unused", databaseUrl: INGEST_URL },
    store,
    now: clock(over.startMinute),
    sleep: async () => {},
    log: () => {},
    ...over,
  }
}

const rows = syntheticKamisRows({ year: "1997", itemCd: "8211" })
const only211 = (data = rows) => fakeKamis((item) => (item === "211" ? data : []))

async function run(over: Partial<IngestDeps> & { startMinute: number }) {
  const result = await runIngest({ source: "kamis", day: DAY }, deps(over))
  if (result.runId !== null) runIds.push(result.runId)
  return result
}

async function runRow(id: number) {
  const [row] = await sql<{ status: string; error_code: string | null; calls_used: number; finished_at: Date | null }[]>`
    select status, error_code, calls_used, finished_at from price.ingest_run where id = ${id}`
  return row
}

afterAll(async () => {
  const keys = [...(await store.list(dayPrefix("kamis", "1997-10-02"))), ...(await store.list(dayPrefix("kamis", "1997-10-01")))]
  await store.remove(keys)
  await admin.begin(async (tx) => {
    const items = tx`select id from price.source_item where source = 'kamis' and key_parts->>'item_cd' = '8211'`
    await tx`delete from price.observation_revision where source_item_id in (${items})`
    await tx`delete from price.observation where source_item_id in (${items})`
    await tx`delete from price.source_code_map where source_item_id in (${items})`
    await tx`delete from price.source_item where source = 'kamis' and key_parts->>'item_cd' = '8211'`
    const places = tx`select id from price.obs_place where source = 'kamis' and kind = 'market' and source_place_code like '9%'`
    await tx`delete from price.market where place_id in (${places})`
    await tx`delete from price.obs_place where source = 'kamis' and kind = 'market' and source_place_code like '9%'`
    await tx`delete from price.source_day where source = 'kamis' and target_date < '1999-01-01'`
    const runs = tx`select id from price.ingest_run where started_at < '1999-01-01'`
    await tx`delete from price.raw_object where duplicate_of in (select id from price.raw_object where ingest_run_id in (${runs}))`
    await tx`delete from price.raw_object where ingest_run_id in (${runs})`
    await tx`delete from price.ingest_run where started_at < '1999-01-01'`
  })
  await Promise.all([sql.end(), admin.end()])
})

describe("수집 실행 (커밋, 순서대로)", () => {
  it("정상: 140회 부르고, 원본 하나를 올려 적재하고, 실행을 ok로 닫는다", async () => {
    const result = await run({ startMinute: 0, fetch: only211() })
    expect(result).toMatchObject({ exitCode: EXIT.ok, errorCode: null, callsUsed: 140, loadFailed: 0 })
    expect(result.uploaded).toHaveLength(1)
    expect(result.uploaded[0]).toMatch(/^raw\/kamis\/1997\/10\/02\/daily-19971001T22\d{4}000Z\.ndjson\.gz$/)
    expect(await runRow(result.runId!)).toMatchObject({ status: "ok", error_code: null, calls_used: 140 })

    const [raw] = await sql<{ load_status: string; target_from: string; target_to: string; row_count: number }[]>`
      select load_status, target_from::text, target_to::text, row_count from price.raw_object where storage_path = ${result.uploaded[0]!}`
    expect(raw).toEqual({ load_status: "loaded", target_from: "1997-09-29", target_to: "1997-10-01", row_count: rows.length })
    const [obs] = await sql<{ n: number }[]>`
      select count(*)::int as n from price.observation o join price.source_item s on s.id = o.source_item_id
       where s.key_parts->>'item_cd' = '8211'`
    expect(obs?.n).toBe(rows.length)
  })

  it("같은 대상을 다시 받아 내용이 같으면 올리지 않고 중복으로만 기록한다", async () => {
    const result = await run({ startMinute: 10, fetch: only211() })
    expect(result).toMatchObject({ exitCode: EXIT.ok, uploaded: [] })
    expect(result.duplicates).toHaveLength(1)
    const [dup] = await sql<{ load_status: string; duplicate_of: string | null }[]>`
      select load_status, duplicate_of from price.raw_object where storage_path = ${result.duplicates[0]!}`
    expect(dup?.load_status).toBe("duplicate")
    expect(dup?.duplicate_of).not.toBeNull()
    expect(await store.list(dayPrefix("kamis", "1997-10-02"))).not.toContain(objectKeyOf(result.duplicates[0]!))
  })

  it("값이 바뀌었다가 되돌아오면 둘 다 올린다 (바로 전 파일과만 비교한다)", async () => {
    const changed = await run({ startMinute: 20, fetch: only211(syntheticKamisRows({ year: "1997", itemCd: "8211", priceDelta: 100 })) })
    expect(changed.uploaded).toHaveLength(1)
    const reverted = await run({ startMinute: 30, fetch: only211() })
    expect(reverted.uploaded).toHaveLength(1)
    expect(reverted.duplicates).toHaveLength(0)
  })

  it("한 품목이 계속 실패하면 다시 세 번 부른 뒤 넘어가고, 부분 성공(1)으로 닫는다", async () => {
    const fetch = fakeKamis((item) => (item === "212" ? new Error("timeout") : item === "211" ? rows : []))
    const result = await run({ startMinute: 40, fetch })
    expect(result).toMatchObject({ exitCode: EXIT.partial, errorCode: "calls_failed", callsUsed: 143 })
    expect(await runRow(result.runId!)).toMatchObject({ status: "partial", error_code: "calls_failed" })
  })

  it("키 오류면 한 번만 부르고 멈추며 종료 코드 2, 실행은 실패(key_invalid)", async () => {
    const result = await run({ startMinute: 50, fetch: fakeKamis(() => new Response(KEY_ERROR_BODY, { status: 403 })) })
    expect(result).toMatchObject({ exitCode: EXIT.keyInvalid, errorCode: "key_invalid", callsUsed: 1 })
    expect(await runRow(result.runId!)).toMatchObject({ status: "failed", error_code: "key_invalid" })
  })

  it("DB에 못 붙어도 원본은 올리고 종료 코드 3, 다음 실행의 대조가 그 원본을 적재한다", async () => {
    const down = await run({
      startMinute: 60,
      fetch: only211(syntheticKamisRows({ year: "1997", itemCd: "8211", priceDelta: 7 })),
      connect: () => connectIngest("postgresql://ingest_writer:x@127.0.0.1:1/postgres"),
    })
    expect(down).toMatchObject({ exitCode: EXIT.dbUnreachable, runId: null, errorCode: "db_unreachable" })
    expect(down.uploaded).toHaveLength(1)

    const next = await run({ startMinute: 70, fetch: only211() })
    const [raw] = await sql<{ load_status: string; status: string; error_code: string }[]>`
      select r.load_status, i.status, i.error_code
        from price.raw_object r join price.ingest_run i on i.id = r.ingest_run_id
       where r.storage_path = ${down.uploaded[0]!}`
    expect(raw).toEqual({ load_status: "loaded", status: "failed", error_code: "db_unreachable" })
    expect(next.exitCode).toBe(EXIT.ok)
  })
})
