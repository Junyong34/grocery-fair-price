// KAMIS 백필 (ingest-foundation/04).
// 적재: 백필 원본은 90일 밖의 날을 관측값에 넣지 않고 임시 표에서 바로 시세 요약으로 낸다. 모두 되돌린다 (1999년 날짜).
// 실행: 가짜 KAMIS 응답(품목 8279, 시장 9xxxxxx)과 로컬 DB·Storage로 끝까지 돈다. 시각을 1997년으로 고정하고 끝에 만든 것을 지운다.
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { runBackfill, type BackfillDeps } from "../../src/backfill/run.ts"
import { applyClasses } from "../../src/catalog/apply.ts"
import type { FetchLike } from "../../src/http.ts"
import { EXIT } from "../../src/ingest/run.ts"
import { recomputeDailyQuote } from "../../src/load/daily-quote.ts"
import type { Sql, Tx } from "../../src/load/db.ts"
import { loadRawFile } from "../../src/load/load-file.ts"
import { parseRawFile, objectKeyOf, type RawFile } from "../../src/load/raw-file.ts"
import { dayPrefix } from "../../src/load/window.ts"
import { FAKE_KEY } from "../helpers.ts"
import { kamisBody, syntheticKamisRows } from "../fixtures/fake-api.ts"
import { kamisFile, kamisSample, pending } from "./files.ts"
import { connectLocalAdmin, connectLocalIngest, inRollback, localStore } from "./local.ts"

const admin = connectLocalAdmin()

// 알배기배추 코드로 바꾼 배추 샘플 (1999-09-28~10-11, 시장 48곳)
const babyCabbage = () => kamisSample("1999", (row) => Object.assign(row, { item_cd: "279", vrty_cd: "00" }))

function backfillFile(file: RawFile): RawFile {
  return { ...file, header: { ...file.header, job: "backfill" } }
}

type Quote = { scope_key: string; obs_date: string; value: string; n: number }

async function quotesOf(tx: Tx): Promise<Quote[]> {
  return tx<Quote[]>`
    select q.scope_key, q.obs_date::text, q.value::text, q.n
      from price.daily_quote q join price.variety v on v.id = q.variety_id
     where v.slug = 'baby-napa-cabbage' and q.obs_date < '2000-01-01' order by q.obs_date, q.scope_key`
}

async function observedDays(tx: Tx): Promise<string[]> {
  const rows = await tx<{ day: string }[]>`
    select distinct o.obs_date::text as day from price.observation o join price.source_item si on si.id = o.source_item_id
     where si.source_key = 'kamis:01-200-279-00-04' order by 1`
  return rows.map((r) => r.day)
}

// 정기 경로(관측값 → 재계산)로 낸 요약. 백필 요약이 이것과 같아야 한다
let regular: Quote[] = []

describe("백필 원본 적재 (되돌림)", () => {
  beforeAll(async () => {
    await inRollback(admin, async (tx) => {
      await applyClasses(tx)
      const file = kamisFile(babyCabbage(), null)
      await loadRawFile(tx, await pending(tx, file), file)
      await recomputeDailyQuote(tx, "quote", await observedDays(tx), "1999-10-12")
      regular = await quotesOf(tx)
    })
    expect(regular.some((q) => q.scope_key.startsWith("market_type:"))).toBe(true)
  })

  it("90일 밖의 날은 관측값에 넣지 않고 정기 경로와 같은 요약을 낸다. 90일 안의 날은 관측값으로 간다", async () => {
    await inRollback(admin, async (tx) => {
      await applyClasses(tx)
      const file = backfillFile(kamisFile(babyCabbage(), null))
      const today = "2000-01-03" // 보존 기준 1999-10-05, 모든 범위 기준 1999-07-05
      const outcome = await loadRawFile(tx, await pending(tx, file), file, { today })

      const days = await observedDays(tx)
      expect(days.length).toBeGreaterThan(0)
      expect(days.every((d) => d >= "1999-10-05")).toBe(true)
      const old = regular.filter((q) => q.obs_date < "1999-10-05")
      expect(outcome.backfill).toEqual({ written: old.length, days: new Set(old.map((q) => q.obs_date)).size })
      expect(await quotesOf(tx)).toEqual(old)

      // 90일 안의 날은 정기 재계산이 관측값에서 낸다. 합치면 정기 경로와 같다
      await recomputeDailyQuote(tx, "quote", days, today)
      expect(await quotesOf(tx)).toEqual(regular)
    })
  })

  it("182일보다 오래된 날은 전국 범위만 낸다", async () => {
    await inRollback(admin, async (tx) => {
      await applyClasses(tx)
      const file = backfillFile(kamisFile(babyCabbage(), null))
      await loadRawFile(tx, await pending(tx, file), file, { today: "2000-06-01" })
      expect(await observedDays(tx)).toEqual([])
      expect(await quotesOf(tx)).toEqual(regular.filter((q) => q.scope_key === "national"))
    })
  })

  it("같은 원본을 다시 적재해도 요약이 바뀌지 않는다", async () => {
    await inRollback(admin, async (tx) => {
      await applyClasses(tx)
      const file = backfillFile(kamisFile(babyCabbage(), null))
      await loadRawFile(tx, await pending(tx, file), file, { today: "2000-06-01" })
      const again = await loadRawFile(tx, await pending(tx, file), file, { today: "2000-06-01" })
      expect(again.backfill?.written).toBe(0)
    })
  })

  it("오늘을 받지 않으면 백필 원본을 적재하지 않는다", async () => {
    await inRollback(admin, async (tx) => {
      const file = backfillFile(kamisFile(babyCabbage(), null))
      await expect(loadRawFile(tx, await pending(tx, file), file)).rejects.toThrow(/백필/)
    })
  })
})

// ── 실행 (커밋) ─────────────────────────────────────────────

const INGEST_URL = "postgresql://ingest_writer:local-only-password@127.0.0.1:55322/postgres"
const store = localStore()
let sql: Sql

// 1997-10-11 22:00Z = 10-12 07:00 KST. 묶음: 1997(01-01~10-11), 1996, 1995, 1994
function clock(): () => Date {
  let tick = 0
  return () => new Date(Date.UTC(1997, 9, 11, 22, 0, tick++))
}

// 요청한 해의 샘플 날짜(09-28~10-11)로 옮긴 행. 품목 코드는 카탈로그에 없는 8279라 품종에 잇지 않는다
const byYear: FetchLike = async (url) => {
  const year = new URL(url).searchParams.get("cond[exmn_ymd::GTE]")!.slice(0, 4)
  return new Response(kamisBody(syntheticKamisRows({ year, itemCd: "8279" })), { status: 200 })
}

function deps(over: Partial<BackfillDeps> = {}): BackfillDeps {
  return {
    env: { serviceKey: FAKE_KEY, supabaseUrl: "unused", secretKey: "unused", databaseUrl: INGEST_URL },
    store,
    fetch: byYear,
    now: clock(),
    sleep: async () => {},
    log: () => {},
    ...over,
  }
}

async function tasks(): Promise<Record<string, string>> {
  const rows = await sql<{ task_key: string; status: string }[]>`
    select task_key, status from price.backfill_task where source = 'kamis' and task_key like 'kamis:01-279:199_'`
  return Object.fromEntries(rows.map((r) => [r.task_key, r.status]))
}

beforeAll(async () => {
  sql = await connectLocalIngest()
})

afterAll(async () => {
  await store.remove(await store.list(dayPrefix("kamis", "1997-10-12")))
  await admin.begin(async (tx) => {
    const items = tx`select id from price.source_item where source = 'kamis' and key_parts->>'item_cd' = '8279'`
    await tx`delete from price.observation where source_item_id in (${items})`
    await tx`delete from price.source_code_map where source_item_id in (${items})`
    await tx`delete from price.source_item where source = 'kamis' and key_parts->>'item_cd' = '8279'`
    const places = tx`select id from price.obs_place where source = 'kamis' and kind = 'market' and source_place_code like '9%'`
    await tx`delete from price.market where place_id in (${places})`
    await tx`delete from price.obs_place where source = 'kamis' and kind = 'market' and source_place_code like '9%'`
    await tx`delete from price.source_day where source = 'kamis' and target_date < '1999-01-01'`
    const runs = tx`select id from price.ingest_run where started_at < '1999-01-01'`
    await tx`delete from price.raw_object where ingest_run_id in (${runs})`
    await tx`delete from price.ingest_run where started_at < '1999-01-01'`
    await tx`delete from price.backfill_task where source = 'kamis' and task_key like 'kamis:01-279:199_'`
  })
  await Promise.all([sql.end(), admin.end()])
})

describe("백필 실행 (커밋, 순서대로)", () => {
  it("DB가 크면 묶음을 시작하지 않는다", async () => {
    const result = await runBackfill({ items: ["279"] }, deps({ maxDbBytes: 1 }))
    expect(result).toMatchObject({ exitCode: EXIT.partial, errorCode: "db_size_limit", done: [], callsUsed: 0, remaining: 4 })
    expect(Object.values(await tasks())).toEqual(["pending", "pending", "pending", "pending"])
  })

  it("예산을 다 쓰면 멈추고, 부르지 못한 묶음은 pending으로 둔다", async () => {
    const result = await runBackfill({ items: ["279"], budget: 2 }, deps())
    expect(result).toMatchObject({ exitCode: EXIT.partial, errorCode: "budget_exhausted", callsUsed: 2, remaining: 2 })
    expect(result.done).toEqual(["kamis:01-279:1997", "kamis:01-279:1996"])
    expect(await tasks()).toEqual({
      "kamis:01-279:1997": "done",
      "kamis:01-279:1996": "done",
      "kamis:01-279:1995": "pending",
      "kamis:01-279:1994": "pending",
    })

    // 1997 묶음: 원본은 백필 원본으로 올라가 적재되고, 90일 안의 날(09-28~10-11)은 관측값에 있다
    const [raw] = await sql<{ storage_path: string; load_status: string; target_from: string; target_to: string }[]>`
      select r.storage_path, r.load_status, r.target_from::text, r.target_to::text
        from price.raw_object r where r.ingest_run_id = ${result.runId!} order by r.id limit 1`
    expect(raw).toMatchObject({ load_status: "loaded", target_from: "1997-01-01", target_to: "1997-10-11" })
    expect(raw!.storage_path).toMatch(/^raw\/kamis\/1997\/10\/12\/backfill-01-279-1997-19971011T22\d{4}000Z\.ndjson\.gz$/)
    expect(parseRawFile(await store.download(objectKeyOf(raw!.storage_path))).header.job).toBe("backfill")
    const observed = await sql<{ y: string; n: number }[]>`
      select extract(year from o.obs_date)::text as y, count(*)::int as n from price.observation o
        join price.source_item si on si.id = o.source_item_id where si.key_parts->>'item_cd' = '8279' group by 1`
    // 1996 묶음은 모두 90일 밖이라 관측값에 없다
    expect(observed).toEqual([{ y: "1997", n: syntheticKamisRows({ year: "1997", itemCd: "8279" }).length }])

    const [run] = await sql<{ job: string; status: string; error_code: string; calls_used: number }[]>`
      select job, status, error_code, calls_used from price.ingest_run where id = ${result.runId!}`
    expect(run).toEqual({ job: "backfill", status: "partial", error_code: "budget_exhausted", calls_used: 2 })
  })

  it("다음 실행은 done이 아닌 묶음부터 이어 받는다", async () => {
    const result = await runBackfill({ items: ["279"] }, deps())
    expect(result).toMatchObject({ exitCode: EXIT.ok, errorCode: null, callsUsed: 2, remaining: 0 })
    expect(result.done).toEqual(["kamis:01-279:1995", "kamis:01-279:1994"])
    expect(Object.values(await tasks()).every((s) => s === "done")).toBe(true)
  })

  it("다른 백필이 돌고 있으면 끝낸다", async () => {
    const holder = await admin.reserve()
    try {
      await holder`select pg_advisory_lock(hashtext('backfill:kamis'))`
      const result = await runBackfill({ items: ["279"] }, deps())
      expect(result).toMatchObject({ exitCode: EXIT.partial, errorCode: "already_running", runId: null, callsUsed: 0 })
    } finally {
      await holder`select pg_advisory_unlock(hashtext('backfill:kamis'))`
      holder.release()
    }
  })
})
