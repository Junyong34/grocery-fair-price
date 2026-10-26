import { randomUUID } from "node:crypto"

import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { buildRawFile, callKeyOf, rawObjectKey, storagePathOf, type Json } from "../../src/load/raw-file.ts"
import { reconcileRawFiles } from "../../src/load/reconcile.ts"
import type { Sql } from "../../src/load/db.ts"
import { registerRun } from "../../src/load/ledger.ts"
import type { ObjectStore } from "../../src/load/storage.ts"
import { connectLocalIngest, localStore } from "./local.ts"

// 로컬 Supabase(supabase start)가 떠 있어야 한다. 루트 pnpm test에는 들어가지 않는다.
const TODAY = "2026-10-22"
const store: ObjectStore = localStore()

const testLabel = `reconcile-${randomUUID().slice(0, 8)}`
const storedKeys: string[] = []
const runIds: number[] = []
let sql: Sql

// 테스트용 원본 파일. 폴더 날짜는 rawObjectKey에 주는 날짜다.
function testFile(options: { fetchedAt: string; runStartedAt: string; ingestRunId: number | null; rows: Json[] }) {
  return buildRawFile(
    {
      source: "kamis",
      endpoint: "test-endpoint",
      job: "daily",
      ingestRunId: options.ingestRunId,
      runStartedAt: options.runStartedAt,
      fetchedAt: options.fetchedAt,
      requests: [{ endpoint: "test-endpoint", params: { pageNo: "1" }, httpStatus: 200, resultCode: "0", rowCount: options.rows.length }],
      targetFrom: "2026-10-21",
      targetTo: "2026-10-21",
      contractBaseline: "baseline:test",
      adapterVersion: "test",
    },
    options.rows,
  )
}

async function put(day: string, label: string, file: ReturnType<typeof testFile>): Promise<string> {
  const key = rawObjectKey("kamis", day, callKeyOf(label, file.header.fetchedAt))
  storedKeys.push(key)
  expect(await store.upload(key, file.bytes)).toBe("uploaded")
  return key
}

type RawRow = { load_status: string; row_count: number; content_sha256: string; endpoint: string; ingest_run_id: string }
type RunRow = { status: string; error_code: string | null; started_at: Date; job: string }

async function rawRow(key: string): Promise<RawRow | undefined> {
  const [row] = await sql<RawRow[]>`
    select load_status, row_count, content_sha256, endpoint, ingest_run_id
      from price.raw_object where storage_path = ${storagePathOf(key)}`
  return row
}

beforeAll(async () => {
  sql = await connectLocalIngest()
})

afterAll(async () => {
  await store.remove(storedKeys)
  const paths = storedKeys.map(storagePathOf)
  const removed = await sql<{ ingest_run_id: string }[]>`
    delete from price.raw_object
     where storage_path in (select jsonb_array_elements_text(${sql.json(paths)}))
    returning ingest_run_id`
  const ids = [...new Set([...runIds, ...removed.map((row) => Number(row.ingest_run_id))])]
  await sql`delete from price.ingest_run where id in (select (jsonb_array_elements_text(${sql.json(ids)}))::bigint)`
  await sql.end()
})

describe("대조: DB 기록 없이 Storage에만 있는 원본을 다음 실행이 등록한다", () => {
  const RUN_STARTED_AT = "2026-10-21T21:30:00.000Z" // DB가 안 되어 기록을 못 만든 실행

  it("DB가 처음부터 안 되었던 실행의 원본: pending_load로 등록하고, 받은 실행을 실패로 기록해 가리킨다", async () => {
    const file = testFile({ fetchedAt: "2026-10-21T21:30:05Z", runStartedAt: RUN_STARTED_AT, ingestRunId: null, rows: [{ a: 1 }, { a: 2 }] })
    const key = await put(TODAY, testLabel, file)

    const result = await reconcileRawFiles({ sql, store, source: "kamis", today: TODAY })
    expect(result.registered).toContain(storagePathOf(key))

    const row = await rawRow(key)
    expect(row).toMatchObject({ load_status: "pending_load", row_count: 2, content_sha256: file.contentSha256, endpoint: "test-endpoint" })
    const [run] = await sql<RunRow[]>`select status, error_code, started_at, job from price.ingest_run where id = ${row!.ingest_run_id}`
    expect(run).toMatchObject({ status: "failed", error_code: "db_unreachable", job: "daily" })
    expect(run?.started_at.toISOString()).toBe(RUN_STARTED_AT)
  })

  it("같은 실행의 다른 원본은 같은 실행 기록을 가리킨다 (실행 기록을 원본마다 만들지 않는다)", async () => {
    const file = testFile({ fetchedAt: "2026-10-21T21:31:00Z", runStartedAt: RUN_STARTED_AT, ingestRunId: null, rows: [{ b: 1 }] })
    const key = await put(TODAY, `${testLabel}-second`, file)
    await reconcileRawFiles({ sql, store, source: "kamis", today: TODAY })
    expect((await rawRow(key))?.ingest_run_id).toBe((await rawRow(storedKeys[0]!))?.ingest_run_id)
  })

  it("실행 기록은 있었는데 적재 전에 DB가 끊긴 원본: 헤더의 실행 번호를 그대로 쓴다", async () => {
    const runId = await registerRun(sql, { source: "kamis", job: "daily", callBudget: 100 })
    runIds.push(runId)
    const file = testFile({ fetchedAt: "2026-10-21T21:40:00Z", runStartedAt: "2026-10-21T21:39:00Z", ingestRunId: runId, rows: [{ c: 1 }] })
    const key = await put(TODAY, `${testLabel}-known`, file)
    await reconcileRawFiles({ sql, store, source: "kamis", today: TODAY })
    expect(Number((await rawRow(key))?.ingest_run_id)).toBe(runId)
  })

  it("이미 기록된 파일은 다시 등록하지 않는다", async () => {
    const again = await reconcileRawFiles({ sql, store, source: "kamis", today: TODAY })
    for (const key of storedKeys) expect(again.registered).not.toContain(storagePathOf(key))
  })

  it("같은 파일을 다시 올리면 이미 있다고 돌려준다 (겹쳐 올리지 않는다)", async () => {
    const file = testFile({ fetchedAt: "2026-10-21T21:30:05Z", runStartedAt: RUN_STARTED_AT, ingestRunId: null, rows: [{ a: 1 }, { a: 2 }] })
    expect(await store.upload(storedKeys[0]!, file.bytes)).toBe("exists")
  })

  it("대조 기간(7일)보다 오래된 폴더의 파일은 대조하지 않는다", async () => {
    const old = testFile({ fetchedAt: "2026-10-09T21:30:00Z", runStartedAt: "2026-10-09T21:29:00Z", ingestRunId: null, rows: [{ old: true }] })
    const key = await put("2026-10-10", `${testLabel}-old`, old)
    const result = await reconcileRawFiles({ sql, store, source: "kamis", today: TODAY })
    expect(result.registered).not.toContain(storagePathOf(key))
    expect(await rawRow(key)).toBeUndefined()
  })
})
