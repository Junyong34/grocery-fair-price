// KAMIS 재등록 감시 (ingest-schedule/09): --job reregistration_watch를 끝까지. 가짜 KAMIS(1996년, 품목 8213, 시장 9xxxxxx)와 로컬 DB·Storage.
//   보존 기간 안: 값이 바뀐 재등록 → revision·observation_revision·correction_count (병합 길)
//   보존 기간 밖: 관측값에 넣지 않고 원본에서 이전 값을 찾아 observation_revision(rebuild_result)만 남긴다. 값이 같으면 남기지 않는다
// 8213은 카탈로그에 매핑이 없어 집계 밖(not_aggregated)이다. 집계를 다시 만드는 길(rebuilt·kept)은 여기서 보지 않는다.
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { EXIT, runIngest, type IngestDeps } from "../../src/ingest/run.ts"
import type { Sql } from "../../src/load/db.ts"
import { dayPrefix } from "../../src/load/window.ts"
import type { KamisRow } from "../../src/sources/kamis.ts"
import { FAKE_KEY } from "../helpers.ts"
import { fakeKamis, syntheticKamisRows } from "../fixtures/fake-api.ts"
import { connectLocalAdmin, connectLocalIngest, localStore } from "./local.ts"

const INGEST_URL = "postgresql://ingest_writer:local-only-password@127.0.0.1:55322/postgres"
const store = localStore()
const admin = connectLocalAdmin()
let sql: Sql

const rows = syntheticKamisRows({ year: "1996", itemCd: "8213" })
const firstDay = rows[0]!.exmn_ymd
const reRegistered = (priceDelta: number, registeredAt: string): KamisRow[] =>
  syntheticKamisRows({ year: "1996", itemCd: "8213", priceDelta })
    .filter((r) => r.exmn_ymd === firstDay && r.mrkt_cd !== null)
    .slice(0, 3)
    .map((r) => ({ ...r, orgnl_reg_dt: registeredAt }))
const only211 = (data: KamisRow[]) => fakeKamis((item) => (item === "211" ? data : []))

function deps(startIso: string, data: KamisRow[]): IngestDeps {
  let tick = 0
  return {
    env: { serviceKey: FAKE_KEY, supabaseUrl: "unused", secretKey: "unused", databaseUrl: INGEST_URL },
    store,
    fetch: only211(data),
    now: () => new Date(Date.parse(startIso) + 1000 * tick++),
    sleep: async () => {},
    log: () => {},
  }
}

const revisions = () =>
  sql<{ revision: number; old_price_raw: number | null; new_price_raw: number; rebuild_result: string | null }[]>`
    select r.revision, r.old_price_raw, r.new_price_raw, r.rebuild_result from price.observation_revision r
      join price.source_item s on s.id = r.source_item_id
     where s.key_parts->>'item_cd' = '8213' order by r.id`

beforeAll(async () => {
  sql = await connectLocalIngest()
})

afterAll(async () => {
  const keys = []
  for (const d of ["1996-10-02", "1997-03-01"]) keys.push(...(await store.list(dayPrefix("kamis", d))))
  await store.remove(keys)
  await admin.begin(async (tx) => {
    const items = tx`select id from price.source_item where source = 'kamis' and key_parts->>'item_cd' = '8213'`
    await tx`delete from price.observation_revision where source_item_id in (${items})`
    await tx`delete from price.observation where source_item_id in (${items})`
    await tx`delete from price.source_code_map where source_item_id in (${items})`
    await tx`delete from price.source_item where source = 'kamis' and key_parts->>'item_cd' = '8213'`
    const places = tx`select id from price.obs_place where source = 'kamis' and kind = 'market' and source_place_code like '9%'`
    await tx`delete from price.market where place_id in (${places})`
    await tx`delete from price.obs_place where source = 'kamis' and kind = 'market' and source_place_code like '9%'`
    await tx`delete from price.source_day where source = 'kamis' and target_date < '1998-01-01'`
    const runs = tx`select id from price.ingest_run where started_at < '1998-01-01'`
    await tx`delete from price.raw_object where duplicate_of in (select id from price.raw_object where ingest_run_id in (${runs}))`
    await tx`delete from price.raw_object where ingest_run_id in (${runs})`
    await tx`delete from price.ingest_run where started_at < '1998-01-01'`
  })
  await Promise.all([sql.end(), admin.end()])
})

describe("재등록 감시 (커밋, 순서대로)", () => {
  it("매일 수집으로 먼저 받는다", async () => {
    const result = await runIngest({ source: "kamis", day: "1996-10-02" }, deps("1996-10-01T22:00:00Z", rows))
    expect(result.exitCode).toBe(EXIT.ok)
  })

  it("보존 기간 안: 값이 바뀐 재등록은 revision·observation_revision·correction_count를 올린다", async () => {
    const result = await runIngest(
      { source: "kamis", day: "1996-10-02", job: "reregistration_watch" },
      deps("1996-10-01T22:10:00Z", reRegistered(50, "1996-10-01T23:00:00Z")),
    )
    expect(result.exitCode).toBe(EXIT.ok)
    const [run] = await sql<{ job: string; status: string }[]>`select job, status from price.ingest_run where id = ${result.runId!}`
    expect(run).toEqual({ job: "reregistration_watch", status: "ok" })
    const revs = await revisions()
    expect(revs).toHaveLength(3)
    expect(revs.every((r) => r.revision === 2 && r.rebuild_result === null && r.new_price_raw === r.old_price_raw! + 50)).toBe(true)
    const [day] = await sql<{ correction_count: number }[]>`
      select correction_count from price.source_day where source = 'kamis' and target_date = ${`${firstDay.slice(0, 4)}-${firstDay.slice(4, 6)}-${firstDay.slice(6)}`}`
    expect(day?.correction_count).toBeGreaterThanOrEqual(1)
  })

  it("보존 기간 밖: 관측값은 그대로 두고, 원본에서 찾은 이전 값으로 observation_revision만 남긴다", async () => {
    const before = await sql<{ price_raw: number }[]>`
      select o.price_raw from price.observation o join price.source_item s on s.id = o.source_item_id
       where s.key_parts->>'item_cd' = '8213' order by o.place_id, o.obs_date`
    const result = await runIngest(
      { source: "kamis", day: "1997-03-01", job: "reregistration_watch" },
      deps("1997-02-28T22:00:00Z", reRegistered(80, "1997-02-28T00:00:00Z")),
    )
    expect(result.exitCode).toBe(EXIT.ok)
    const after = await sql<{ price_raw: number }[]>`
      select o.price_raw from price.observation o join price.source_item s on s.id = o.source_item_id
       where s.key_parts->>'item_cd' = '8213' order by o.place_id, o.obs_date`
    expect(after).toEqual(before)
    const revs = (await revisions()).slice(3)
    expect(revs).toHaveLength(3)
    expect(revs.every((r) => r.rebuild_result === "not_aggregated" && r.new_price_raw === r.old_price_raw! + 30)).toBe(true)
  })

  it("보존 기간 밖이라도 등록 시각만 바뀌면 정정이 아니라 아무것도 남기지 않는다", async () => {
    const result = await runIngest(
      { source: "kamis", day: "1997-03-01", job: "reregistration_watch" },
      deps("1997-02-28T22:10:00Z", reRegistered(80, "1997-02-28T22:05:00Z")),
    )
    expect(result.exitCode).toBe(EXIT.ok)
    expect(await revisions()).toHaveLength(6)
  })
})
