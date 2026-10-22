import { execFileSync } from "node:child_process"
import { randomUUID } from "node:crypto"
import { fileURLToPath } from "node:url"

import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { buildRawFile, callKeyOf, rawObjectKey, type Json } from "../../src/load/raw-file.ts"
import { reconcileRawFiles } from "../../src/load/reconcile.ts"
import { connectIngest, type Sql } from "../../src/load/db.ts"
import { registerRun } from "../../src/load/ledger.ts"
import { createObjectStore, type ObjectStore } from "../../src/load/storage.ts"

// 로컬 Supabase(supabase start)가 떠 있어야 한다. 루트 pnpm test에는 들어가지 않는다.
const REPO_ROOT = fileURLToPath(new URL("../../../../", import.meta.url))
const ADMIN_URL = "postgresql://postgres:postgres@127.0.0.1:55322/postgres"
const INGEST_URL = "postgresql://ingest_writer:local-only-password@127.0.0.1:55322/postgres"
const TODAY = "2026-10-22"

// supabase status의 로컬 값 (키는 메모리에만 두고 출력하지 않는다)
function localStatus(): Record<string, string> {
  const text = execFileSync("pnpm", ["exec", "supabase", "status", "-o", "env"], { cwd: REPO_ROOT, encoding: "utf8" })
  const values: Record<string, string> = {}
  for (const line of text.split("\n")) {
    const match = /^([A-Z_]+)=(.*)$/.exec(line.trim())
    if (match?.[1] !== undefined) values[match[1]] = (match[2] ?? "").replace(/^"|"$/g, "")
  }
  return values
}

const local = localStatus()
const store: ObjectStore = createObjectStore({ url: local.API_URL ?? "", secretKey: local.SECRET_KEY ?? "" })

const testLabel = `reconcile-${randomUUID().slice(0, 8)}`
const storedKeys: string[] = []
const runIds: number[] = []
let sql: Sql

// 테스트용 원본 파일. fetchedAt의 KST 날짜가 폴더 날짜가 된다.
function testFile(fetchedAt: string, rows: Json[]) {
  return buildRawFile(
    {
      source: "kamis",
      endpoint: "test-endpoint",
      fetchedAt,
      requests: [{ test: true }],
      callCount: 1,
      targetFrom: "2026-10-21",
      targetTo: "2026-10-21",
      contractBaseline: "baseline:test",
      adapterVersion: "test",
    },
    rows,
  )
}

beforeAll(async () => {
  // 앱 롤에 로컬 비밀번호를 넣는다 (마이그레이션은 넣지 않는다). 이미 있으면 같은 값으로 바뀐다.
  const admin = connectIngest(ADMIN_URL)
  await admin.unsafe("alter role ingest_writer with password 'local-only-password'")
  await admin.end()
  sql = connectIngest(INGEST_URL)
})

afterAll(async () => {
  for (const key of storedKeys) await store.remove([key])
  await sql`delete from price.raw_object where storage_path = any(${sql.array(storedKeys)})`
  await sql`delete from price.ingest_run where id = any(${sql.array(runIds, 20)})`  // 20 = bigint
  await sql.end()
})

describe("대조: DB 기록 없이 Storage에만 있는 원본을 다음 실행이 등록한다", () => {
  it("DB를 쓰기 전에 올린 파일을 다음 실행이 pending_load로 등록한다 (DB 장애 뒤 복구)", async () => {
    // 이전 실행: 원본은 Storage에 올라갔지만 DB 기록은 못 남겼다
    const file = testFile("2026-10-21T16:30:00Z", [{ a: 1 }, { a: 2 }])
    const key = rawObjectKey("kamis", TODAY, callKeyOf(testLabel, file.sha256))
    storedKeys.push(key)
    expect(await store.upload(key, file.bytes)).toBe("uploaded")

    // 다음 실행: DB가 살아 있고, 대조해서 빠진 파일을 등록한다
    const runId = await registerRun(sql, { source: "kamis", job: "daily", callBudget: 100 })
    runIds.push(runId)
    const result = await reconcileRawFiles({ sql, store, ingestRunId: runId, source: "kamis", today: TODAY })
    expect(result.registered).toContain(key)

    const [row] = await sql<{ load_status: string; row_count: number; content_sha256: string; endpoint: string; ingest_run_id: string }[]>`
      select load_status, row_count, content_sha256, endpoint, ingest_run_id
        from price.raw_object where storage_path = ${key}`
    expect(row).toMatchObject({
      load_status: "pending_load",
      row_count: 2,
      content_sha256: file.sha256,
      endpoint: "test-endpoint",
    })
    expect(Number(row?.ingest_run_id)).toBe(runId)
  })

  it("이미 기록된 파일은 다시 등록하지 않는다 (두 번째 실행은 같은 파일을 건드리지 않는다)", async () => {
    const runId = await registerRun(sql, { source: "kamis", job: "daily", callBudget: 100 })
    runIds.push(runId)
    const second = await reconcileRawFiles({ sql, store, ingestRunId: runId, source: "kamis", today: TODAY })
    expect(second.registered).not.toContain(storedKeys[0])
  })

  it("같은 내용을 다시 올리면 이미 있다고 돌려준다 (중복 업로드 없음)", async () => {
    const file = testFile("2026-10-21T16:30:00Z", [{ a: 1 }, { a: 2 }])
    const key = rawObjectKey("kamis", TODAY, callKeyOf(testLabel, file.sha256))
    expect(await store.upload(key, file.bytes)).toBe("exists")
  })

  it("대조 기간(7일)보다 오래된 파일은 대조하지 않는다", async () => {
    // 2026-10-10 폴더는 기간 밖이다
    const old = testFile("2026-10-09T16:30:00Z", [{ old: true }])
    const key = rawObjectKey("kamis", "2026-10-10", callKeyOf(`${testLabel}-old`, old.sha256))
    storedKeys.push(key)
    expect(await store.upload(key, old.bytes)).toBe("uploaded")

    const runId = await registerRun(sql, { source: "kamis", job: "daily", callBudget: 100 })
    runIds.push(runId)
    const result = await reconcileRawFiles({ sql, store, ingestRunId: runId, source: "kamis", today: TODAY })
    expect(result.registered).not.toContain(key)
    const rows = await sql`select 1 from price.raw_object where storage_path = ${key}`
    expect(rows).toHaveLength(0)
  })
})
