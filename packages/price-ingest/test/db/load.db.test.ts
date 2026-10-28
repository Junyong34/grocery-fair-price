// 원본 파일 적재 (ingest-schedule/05, pipeline 3-0 "접속"·3-3·3-5·3-7).
// 롤백 묶음 안의 테스트는 저장 샘플을 1999년으로 옮겨 쓴다 (price-db 샘플 데이터와 겹치지 않게).
// 동시 실행·대조 테스트는 커밋해야 해서 없는 코드(품목 8xxx, 시장 9xxxxxx, 1998년)로 쓰고 끝에 지운다.
import { randomUUID } from "node:crypto"

import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { ADAPTER_VERSION } from "../../src/adapt/draft.ts"
import type { Sql, Tx } from "../../src/load/db.ts"
import { loadRawFile } from "../../src/load/load-file.ts"
import { loadPendingFiles } from "../../src/load/load-pending.ts"
import { buildRawFile, callKeyOf, rawObjectKey, storagePathOf, type Json, type RawFile } from "../../src/load/raw-file.ts"
import { reconcileRawFiles } from "../../src/load/reconcile.ts"
import { EKAPE_ENDPOINT, parseEkapeConsumerPrice, type EkapeRow } from "../../src/sources/ekape.ts"
import type { KamisRow } from "../../src/sources/kamis.ts"
import { readSampleText } from "../helpers.ts"
import { FETCHED_AT, kamisFile, kamisSample, pending } from "./files.ts"
import { connectLocalAdmin, connectLocalIngest, inRollback, localStore } from "./local.ts"

let sql: Sql
let other: Sql // 동시 실행용 두 번째 접속
const admin = connectLocalAdmin()

beforeAll(async () => {
  sql = await connectLocalIngest()
  other = await connectLocalIngest()
})

// 없는 품목·시장 코드로 바꾼 행. 커밋하는 테스트는 1998년으로 쓴다.
function syntheticKamis(itemCd: string, year = "1998"): KamisRow[] {
  return kamisSample(year, (row) => {
    row.item_cd = itemCd
    if (row.mrkt_cd) row.mrkt_cd = `9${row.mrkt_cd.slice(1)}`
  })
}

describe("KAMIS 원본 적재 (롤백)", () => {
  it("관측값·원천 키·관측 위치·시장을 만들고, 원천 키 매핑은 pending, 품종은 비운다", async () => {
    const rows = syntheticKamis("8299", "1999") // 처음 보는 원천 키·시장
    await inRollback(sql, async (tx) => {
      const file = kamisFile(rows, null)
      const id = await pending(tx, file)
      const outcome = await loadRawFile(tx, id, file)
      expect(outcome).toMatchObject({ status: "loaded", rejected: [], observations: { inserted: rows.length, corrections: 0 } })

      const [obs] = await tx<{ n: number; with_variety: number; first_seen: Date }[]>`
        select count(*)::int as n, count(variety_id)::int as with_variety, min(first_seen_at) as first_seen
          from price.observation where raw_object_id = ${id}`
      expect(obs).toMatchObject({ n: rows.length, with_variety: 0 })
      expect(obs?.first_seen.toISOString()).toBe(FETCHED_AT)

      const maps = await tx<{ status: string }[]>`
        select m.status from price.source_code_map m join price.source_item s on s.id = m.source_item_id
         where s.source = 'kamis' and s.key_parts->>'item_cd' = '8299'`
      expect(maps.length).toBeGreaterThan(0)
      expect(new Set(maps.map((m) => m.status))).toEqual(new Set(["pending"]))

      const markets = await tx<{ code: string; name: string; market_type: string; type_source: string; sgg_code_raw: string }[]>`
        select p.source_place_code as code, m.name, m.market_type, m.type_source, m.sgg_code_raw
          from price.market m join price.obs_place p on p.id = m.place_id
         where p.source_place_code in ('9110212', '9110403')`
      expect(markets).toContainEqual({ code: "9110212", name: "경동", market_type: "traditional", type_source: "name_rule", sgg_code_raw: "1101" })
      expect(markets.find((m) => m.code === "9110403")?.market_type).toBe("large_retail")

      const days = await tx<{ status: string; row_count: number }[]>`
        select status, row_count from price.source_day where source = 'kamis' and target_date between '1999-01-01' and '1999-12-31'`
      expect(new Set(days.map((d) => d.status))).toEqual(new Set(["ok"]))
      expect(days.reduce((sum, d) => sum + d.row_count, 0)).toBe(rows.length)

      const [raw] = await tx<{ load_status: string; loaded_at: Date | null }[]>`select load_status, loaded_at from price.raw_object where id = ${id}`
      expect(raw?.load_status).toBe("loaded")
      expect(raw?.loaded_at).not.toBeNull()
    })
  })

  it("같은 내용을 다시 적재하면 고쳐 쓰는 행이 0이고 그날 행 수도 그대로다", async () => {
    const rows = kamisSample("1999")
    await inRollback(sql, async (tx) => {
      await loadRawFile(tx, await pending(tx, kamisFile(rows, null)), kamisFile(rows, null))
      const again = kamisFile(rows, null, "2026-10-23T21:30:05.000Z")
      const outcome = await loadRawFile(tx, await pending(tx, again), again)
      expect(outcome.observations).toEqual({ inserted: 0, changed: 0, corrections: 0 })
      const [day] = await tx<{ total: number }[]>`
        select sum(row_count)::int as total from price.source_day where source = 'kamis' and target_date < '2000-01-01'`
      expect(day?.total).toBe(rows.length)
    })
  })

  it("가격이 바뀐 행은 정정이다: revision·정정 이력·correction_count가 오르고 상태는 그대로다", async () => {
    const rows = kamisSample("1999")
    const changed = kamisSample("1999")
    changed[0] = { ...changed[0]!, exmn_dd_prc: String(Number(changed[0]!.exmn_dd_prc) + 100) }
    await inRollback(sql, async (tx) => {
      await loadRawFile(tx, await pending(tx, kamisFile(rows, null)), kamisFile(rows, null))
      await tx`update price.source_day set status = 'partial' where source = 'kamis' and target_date = ${ymd(changed[0]!.exmn_ymd)}`
      const file = kamisFile(changed, null, "2026-10-23T21:30:05.000Z")
      const id = await pending(tx, file)
      const outcome = await loadRawFile(tx, id, file)
      expect(outcome.observations).toEqual({ inserted: 0, changed: 1, corrections: 1 })

      const [rev] = await tx<{ old_price_raw: number; new_price_raw: number; revision: number }[]>`
        select old_price_raw, new_price_raw, revision from price.observation_revision where raw_object_id = ${id}`
      expect(rev).toEqual({
        old_price_raw: Number(rows[0]!.exmn_dd_prc),
        new_price_raw: Number(rows[0]!.exmn_dd_prc) + 100,
        revision: 1,
      })
      const [day] = await tx<{ status: string; correction_count: number }[]>`
        select status, correction_count from price.source_day where source = 'kamis' and target_date = ${ymd(changed[0]!.exmn_ymd)}`
      expect(day).toEqual({ status: "partial", correction_count: 1 })
    })
  })

  it("등록 시각만 바뀐 행은 고쳐 쓰지만 정정이 아니다", async () => {
    const rows = kamisSample("1999")
    const reRegistered = kamisSample("1999")
    reRegistered[0] = { ...reRegistered[0]!, orgnl_reg_dt: "1999-12-31T16:10:00Z" }
    await inRollback(sql, async (tx) => {
      await loadRawFile(tx, await pending(tx, kamisFile(rows, null)), kamisFile(rows, null))
      const file = kamisFile(reRegistered, null, "2026-10-23T21:30:05.000Z")
      const outcome = await loadRawFile(tx, await pending(tx, file), file)
      expect(outcome.observations).toEqual({ inserted: 0, changed: 1, corrections: 0 })
      const [obs] = await tx<{ revision: number }[]>`
        select o.revision from price.observation o join price.source_item s on s.id = o.source_item_id
         where o.source_registered_at = '1999-12-31T16:10:00Z'`
      expect(obs?.revision).toBe(0)
    })
  })

  it("형식이 다른 행, 가격이 0인 행, 시장의 시군구 코드가 처음과 다른 행은 거부하고 나머지는 적재한다", async () => {
    const rows = kamisSample("1999")
    const first = rows[0]!
    const bad: unknown[] = [
      ...rows,
      { ...first, unit_sz: undefined }, // 필드가 빠짐
      { ...first, exmn_ymd: "19990101", exmn_dd_prc: "0" }, // 가격 0
      { ...first, exmn_ymd: "19990102", sgg_cd: "2100" }, // 같은 시장인데 다른 시군구
    ]
    await inRollback(sql, async (tx) => {
      const file = kamisFile(bad as KamisRow[], null)
      const id = await pending(tx, file)
      const outcome = await loadRawFile(tx, id, file)
      expect(outcome.status).toBe("partially_rejected")
      expect(outcome.rejected.map((r) => r.index)).toEqual([rows.length, rows.length + 1, rows.length + 2])
      expect(outcome.observations.inserted).toBe(rows.length)
      const [raw] = await tx<{ load_status: string; rejected_rows: number }[]>`
        select load_status, rejected_rows from price.raw_object where id = ${id}`
      expect(raw).toEqual({ load_status: "partially_rejected", rejected_rows: 3 })
    })
  })
})

function ymd(compact: string): string {
  return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`
}

describe("축평원 원본 적재 (롤백)", () => {
  const sample = parseEkapeConsumerPrice(200, readSampleText("ekape/pork-all-items.xml"))
  const rows: EkapeRow[] = sample.map((row) => (row.standYmd === "평년" ? row : { ...row, standYmd: `1999${row.standYmd.slice(4)}` }))
  const requestYmd = "19991011"

  function ekapeFile(fetchedAt = FETCHED_AT): RawFile {
    return buildRawFile(
      {
        source: "ekape",
        endpoint: EKAPE_ENDPOINT,
        job: "daily",
        ingestRunId: null,
        runStartedAt: "2026-10-22T21:40:00.000Z",
        fetchedAt,
        requests: [
          {
            endpoint: EKAPE_ENDPOINT,
            params: { standYmd: requestYmd, judgeKind: "4304" },
            httpStatus: 200,
            resultCode: "00",
            rowCount: rows.length,
          },
        ],
        targetFrom: ymd(requestYmd),
        targetTo: ymd(requestYmd),
        contractBaseline: "baseline:test",
        adapterVersion: ADAPTER_VERSION,
      },
      rows as unknown as Json[],
    )
  }

  it("당일 행은 관측값으로, 평년 행은 요청 기준일을 붙여 평년 값으로 넣는다", async () => {
    const days = rows.filter((row) => row.standYmd !== "평년").length
    await inRollback(sql, async (tx) => {
      const id = await pending(tx, ekapeFile(), "ekape")
      const outcome = await loadRawFile(tx, id, ekapeFile())
      expect(outcome).toMatchObject({ status: "loaded", references: rows.length - days, observations: { inserted: days } })

      const [ref] = await tx<{ n: number; ref_date: string }[]>`
        select count(*)::int as n, min(ref_date)::text as ref_date from price.reference_observation where raw_object_id = ${id}`
      expect(ref).toEqual({ n: rows.length - days, ref_date: ymd(requestYmd) })
      const [day] = await tx<{ status: string; row_count: number }[]>`
        select status, row_count from price.source_day where source = 'ekape' and target_date = ${ymd(requestYmd)}`
      expect(day).toEqual({ status: "ok", row_count: days })

      const again = ekapeFile("2026-10-23T21:40:00.000Z")
      const second = await loadRawFile(tx, await pending(tx, again, "ekape"), again)
      expect(second).toMatchObject({ references: 0, observations: { changed: 0 } })
    })
  })
})

// ── 커밋하는 테스트: 끝에 지운다 ─────────────────────────────────────────

const committedRawIds: number[] = []
const storedKeys: string[] = []

afterAll(async () => {
  await localStore().remove(storedKeys)
  const runs = await admin<{ ingest_run_id: string }[]>`
    select ingest_run_id from price.raw_object
     where id in (select (jsonb_array_elements_text(${admin.json(committedRawIds)}))::bigint)
        or storage_path in (select jsonb_array_elements_text(${admin.json(storedKeys.map(storagePathOf))}))`
  await admin.begin(async (tx) => {
    const items = tx`select id from price.source_item where source = 'kamis' and key_parts->>'item_cd' like '8%'`
    await tx`delete from price.observation_revision where source_item_id in (${items})`
    await tx`delete from price.observation where source_item_id in (${items})`
    await tx`delete from price.source_code_map where source_item_id in (${items})`
    await tx`delete from price.source_item where source = 'kamis' and key_parts->>'item_cd' like '8%'`
    const places = tx`select id from price.obs_place where source = 'kamis' and kind = 'market' and source_place_code like '9%'`
    await tx`delete from price.market where place_id in (${places})`
    await tx`delete from price.obs_place where source = 'kamis' and kind = 'market' and source_place_code like '9%'`
    await tx`delete from price.source_day where source = 'kamis' and target_date < '1999-01-01'`
    await tx`delete from price.raw_object where ingest_run_id in (select (jsonb_array_elements_text(${tx.json(runs.map((r) => r.ingest_run_id))}))::bigint)`
    await tx`delete from price.ingest_run where id in (select (jsonb_array_elements_text(${tx.json(runs.map((r) => r.ingest_run_id))}))::bigint)`
  })
  await Promise.all([sql.end(), other.end(), admin.end()])
})

describe("같은 출처 적재가 겹칠 때 (커밋)", () => {
  it("출처 lock을 다른 접속이 잡고 있으면 적재가 기다렸다가 이어서 돈다", async () => {
    const rows = syntheticKamis("8211")
    const file = kamisFile(rows, null)
    const id = await pending(sql, file)
    committedRawIds.push(id)

    let release: () => void = () => {}
    const held = new Promise<void>((resolve) => (release = resolve))
    let locked: () => void = () => {}
    const lockTaken = new Promise<void>((resolve) => (locked = resolve))
    const holder = other.begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(hashtext('ingest:kamis'))`
      locked()
      await held
    })
    await lockTaken

    let finished = false
    const load = loadRawFile(sql, id, file).then((outcome) => {
      finished = true
      return outcome
    })
    await new Promise((resolve) => setTimeout(resolve, 500))
    const [waiting] = await admin<{ n: number }[]>`
      select count(*)::int as n from pg_locks where locktype = 'advisory' and not granted`
    expect(finished).toBe(false)
    expect(waiting?.n).toBeGreaterThan(0)

    release()
    await holder
    expect((await load).observations.inserted).toBe(rows.length)
  })

  it("두 적재를 동시에 돌려도 결과는 하나만 돌린 것과 같다", async () => {
    const rows = syntheticKamis("8212")
    const a = kamisFile(rows, null)
    const b = kamisFile(rows, null, "2026-10-22T21:30:06.000Z")
    const [idA, idB] = [await pending(sql, a), await pending(sql, b)]
    committedRawIds.push(idA, idB)

    const [ra, rb] = await Promise.all([loadRawFile(sql, idA, a), loadRawFile(other, idB, b)])
    expect(ra.observations.inserted + rb.observations.inserted).toBe(rows.length)
    expect(ra.observations.corrections + rb.observations.corrections).toBe(0)

    const [obs] = await admin<{ n: number; revisions: number }[]>`
      select count(*)::int as n, coalesce(sum(o.revision), 0)::int as revisions
        from price.observation o join price.source_item s on s.id = o.source_item_id
       where s.key_parts->>'item_cd' = '8212'`
    expect(obs).toEqual({ n: rows.length, revisions: 0 })
  })
})

describe("DB에 기록하지 못한 원본 (커밋)", () => {
  it("Storage에만 있는 원본을 다음 실행의 대조가 찾아 적재까지 한다", async () => {
    const today = "2026-10-22"
    const store = localStore()
    const rows = syntheticKamis("8213")
    const file = kamisFile(rows, null) // DB가 안 되어 실행 번호가 없는 원본
    const key = rawObjectKey("kamis", today, callKeyOf(`load-test-${randomUUID().slice(0, 8)}`, file.header.fetchedAt))
    storedKeys.push(key)
    expect(await store.upload(key, file.bytes)).toBe("uploaded")

    const reconciled = await reconcileRawFiles({ sql, store, source: "kamis", today })
    expect(reconciled.registered).toContain(storagePathOf(key))

    const result = await loadPendingFiles({ sql, store, source: "kamis", today: "2026-10-23" })
    const [raw] = await sql<{ id: string; load_status: string }[]>`
      select id, load_status from price.raw_object where storage_path = ${storagePathOf(key)}`
    expect(raw?.load_status).toBe("loaded")
    expect(result.loaded.find((outcome) => outcome.rawObjectId === Number(raw?.id))?.observations.inserted).toBe(rows.length)
  })
})
