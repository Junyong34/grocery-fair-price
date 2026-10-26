// 제약·적재 (ingest-foundation/02 완료 기준 6~9, pipeline.md 3-1·3-3·3-5·3-9)
import { afterAll, describe, expect, test } from "vitest"

import { copyInto } from "@workspace/price-ingest/load/copy"
import { connectAdmin, connectAs } from "../src/db.ts"
import {
  CHAMGA_PRICE_FILES,
  KAMIS_BACKFILL_FILE,
  newContext,
  prepareChamgaFile,
  prepareKamisFile,
  startRun,
} from "../src/load-samples.ts"
import { backfillKamisBundle, loadObservationFile } from "../src/observation-load.ts"
import { inRollback, sqlState } from "./helpers.ts"

const admin = connectAdmin()
const ingest = connectAs("ingest_writer")

afterAll(async () => {
  await Promise.all([admin.end(), ingest.end()])
})

// pipeline.md 3-1 "기본 규격이 꼭 하나 있게 한다"의 검사 질의
const MISSING_DEFAULT_SPEC = `
  select v.id, v.slug from price.variety v
  where v.status = 'active'
    and not exists (select 1 from price.spec s where s.variety_id = v.id and s.is_default)`

describe("(6) 기본 규격 검사", () => {
  test("시드 뒤 0행", async () => {
    expect(await admin.unsafe(MISSING_DEFAULT_SPEC)).toHaveLength(0)
  })

  test("기본 규격을 지운 품종이 있으면 1행", async () => {
    await inRollback(admin, async (tx) => {
      await tx`update price.spec set is_default = false
               where variety_id = (select id from price.variety where slug = 'aehobak')`
      const rows = await tx.unsafe(MISSING_DEFAULT_SPEC)
      expect(rows.map((r) => r.slug)).toEqual(["aehobak"])
    })
  })

  test("기본 규격은 많아야 하나 (spec_one_default)", async () => {
    const state = await sqlState(() =>
      inRollback(admin, (tx) => tx`update price.spec set is_default = true
                                    where variety_id = (select id from price.variety where slug = 'hanwoo-sirloin')`.then(() => {})),
    )
    expect(state).toBe("23505")
  })
})

describe("규격 일관성·종류 보장·기간 겹침", () => {
  test("다른 품종의 규격을 가리키는 관측값은 복합 FK가 막는다", async () => {
    const state = await sqlState(() =>
      inRollback(ingest, (tx) => tx`
        update price.observation o
           set spec_id = (select s.id from price.spec s join price.variety v on v.id = s.variety_id where v.slug = 'egg')
         where o.variety_id = (select id from price.variety where slug = 'baechu')`.then(() => {})),
    )
    expect(state).toBe("23503")
  })

  test("mapped인데 규격이 비면 check가 막는다", async () => {
    const state = await sqlState(() =>
      inRollback(ingest, (tx) => tx`
        update price.source_code_map set variety_id = null, spec_id = null where status = 'mapped'`.then(() => {})),
    )
    expect(state).toBe("23514")
  })

  test("조사 시장 위치에는 점포 행을 붙일 수 없다 (store·obs_place 복합 FK)", async () => {
    const state = await sqlState(() =>
      inRollback(ingest, (tx) => tx`
        insert into price.store (place_id, name, channel, region_scope, status, lineage_id)
        select id, 'x', 'ssm', 'local', 'active', id from price.obs_place where kind = 'market' limit 1`.then(() => {})),
    )
    expect(state).toBe("23503")
  })

  test("같은 원천 키의 매핑 기간이 겹치면 exclusion 제약이 막는다", async () => {
    const state = await sqlState(() =>
      inRollback(ingest, (tx) => tx`
        insert into price.source_code_map (source_item_id, valid_from, status)
        select source_item_id, '2025-01-01', 'pending' from price.source_code_map limit 1`.then(() => {})),
    )
    expect(state).toBe("23P01")
  })

  test("기간 check: valid_to는 valid_from보다 뒤", async () => {
    const state = await sqlState(() =>
      inRollback(ingest, (tx) => tx`
        update price.store_seller set valid_to = valid_from where true`.then(() => {})),
    )
    expect(state).toBe("23514")
  })

  test("observation 저장 설정", async () => {
    const [row] = await admin`select reloptions from pg_class where oid = 'price.observation'::regclass`
    expect(row!.reloptions).toEqual(expect.arrayContaining(["fillfactor=90", "autovacuum_vacuum_scale_factor=0.05"]))
  })
})

describe("(7) ingest_writer 롤로 백필 묶음 하나를 적재한다", () => {
  test("임시 표 COPY → daily_quote → 최근 90일만 observation", async () => {
    await inRollback(ingest, async (tx) => {
      // 샘플로 이미 적재된 배추를 지우고, 기준일을 늦춰 90일 경계가 묶음 가운데에 오게 다시 넣는다.
      await tx`delete from price.daily_quote where variety_id = (select id from price.variety where slug = 'baechu')`
      await tx`delete from price.observation where variety_id = (select id from price.variety where slug = 'baechu')`
      const ctx = newContext(tx)
      ctx.runs.set("kamis", await startRun(tx, "kamis", "backfill"))
      const { rawObjectId, rows } = await prepareKamisFile(ctx, KAMIS_BACKFILL_FILE, "-test7")
      const today = "2026-12-31"   // today - 90 = 2026-10-02
      const result = await backfillKamisBundle(tx, rawObjectId, rows, today)

      const dates = [...new Set(rows.map((r) => r.obs_date))].sort()
      const recent = rows.filter((r) => r.obs_date >= "2026-10-02")
      expect(dates[0]! < "2026-10-02" && recent.length > 0 && recent.length < rows.length).toBe(true)
      expect(result.observations).toBe(recent.length)

      const [obs] = await tx`
        select count(*)::int as n, min(obs_date)::text as first from price.observation where raw_object_id = ${rawObjectId}`
      expect(obs).toEqual({ n: recent.length, first: recent.map((r) => r.obs_date).sort()[0] })
      // 집계는 90일 밖 날짜도 만든다 (평년 계산용 5년 이력)
      const quoteDates = await tx`
        select distinct obs_date::text as d from price.daily_quote
        where variety_id = (select id from price.variety where slug = 'baechu') and scope_key = 'national' order by 1`
      expect(quoteDates.map((r) => r.d)).toEqual(dates)
      const [raw] = await tx`select load_status from price.raw_object where id = ${rawObjectId}`
      expect(raw!.load_status).toBe("loaded")
    })
  })

  test("같은 롤로 RLS 표 observation에 바로 COPY하면 실패한다", async () => {
    const state = await sqlState(() =>
      inRollback(ingest, (tx) => copyInto(tx, "price.observation", ["obs_date"], [{ obs_date: "2026-10-01" }])),
    )
    expect(state).toBe("0A000")   // COPY FROM not supported with row-level security
  })
})

describe("정기 적재: 바뀐 행만 고쳐 쓴다", () => {
  test("값이 같은 다시 받기는 갱신 0행", async () => {
    await inRollback(ingest, async (tx) => {
      const ctx = newContext(tx)
      ctx.runs.set("chamga", await startRun(tx, "chamga", "recheck"))
      const { rawObjectId, rows } = await prepareChamgaFile(ctx, CHAMGA_PRICE_FILES[1]!, "-same")
      const result = await loadObservationFile(tx, "chamga", rawObjectId, rows)
      expect(result).toEqual({ changed: 0, corrections: 0 })
    })
  })

  test("(8) 상품 연결만 바뀐 파일을 다시 적재하면 product_id가 바뀌고 revision은 그대로다", async () => {
    await inRollback(ingest, async (tx) => {
      const [key] = await tx<{ source_item_id: number; product_id: number }[]>`
        select k.source_item_id, k.product_id from price.product_source_key k
        join price.source_item si on si.id = k.source_item_id where si.source_key = 'chamga:1001'`
      const [other] = await tx<{ id: number }[]>`
        insert into price.product (name, status, registered_on) values ('연결 바뀐 상품', 'surveyed', '2026-10-12') returning id`
      await tx`update price.product_source_key set product_id = ${other!.id} where source_item_id = ${key!.source_item_id}`

      const ctx = newContext(tx)
      ctx.runs.set("chamga", await startRun(tx, "chamga", "recheck"))
      const { rawObjectId, rows } = await prepareChamgaFile(ctx, CHAMGA_PRICE_FILES[1]!, "-relink")
      const result = await loadObservationFile(tx, "chamga", rawObjectId, rows)

      const relinked = rows.filter((r) => r.source_item_id === key!.source_item_id)
      expect(result).toEqual({ changed: relinked.length, corrections: 0 })
      const obs = await tx`select product_id, revision, raw_object_id::int as raw from price.observation
                           where source_item_id = ${key!.source_item_id}`
      expect(obs.length).toBeGreaterThan(0)
      const fromThisFile = obs.filter((o) => o.raw === rawObjectId)
      expect(fromThisFile).toHaveLength(relinked.length)
      for (const o of fromThisFile) expect(o).toMatchObject({ product_id: other!.id, revision: 0 })
      const [rev] = await tx`select count(*)::int as n from price.observation_revision where raw_object_id = ${rawObjectId}`
      expect(rev!.n).toBe(0)
    })
  })

  test("(9) partial인 날에 가격 정정이 오면 상태는 partial, corrected_at이 차고 correction_count가 1 오른다", async () => {
    await inRollback(ingest, async (tx) => {
      const ctx = newContext(tx)
      ctx.runs.set("chamga", await startRun(tx, "chamga", "recheck"))
      const { rawObjectId, rows } = await prepareChamgaFile(ctx, CHAMGA_PRICE_FILES[1]!, "-corrected")
      const day = rows[0]!.obs_date
      await tx`update price.source_day set status = 'partial' where source = 'chamga' and target_date = ${day}`
      const changedRow = { ...rows[0]!, price_raw: rows[0]!.price_raw + 100 }

      const result = await loadObservationFile(tx, "chamga", rawObjectId, [changedRow, ...rows.slice(1)])
      expect(result).toEqual({ changed: 1, corrections: 1 })

      const [sd] = await tx`select status, corrected_at, correction_count from price.source_day
                            where source = 'chamga' and target_date = ${day}`
      expect(sd!.status).toBe("partial")
      expect(sd!.corrected_at).not.toBeNull()
      expect(sd!.correction_count).toBe(1)
      const [obs] = await tx`select price_raw, revision from price.observation
                             where (source_item_id, obs_date, place_id) = (${changedRow.source_item_id}, ${day}, ${changedRow.place_id})`
      expect(obs).toEqual({ price_raw: changedRow.price_raw, revision: 1 })
      const revs = await tx`select old_price_raw, new_price_raw, revision from price.observation_revision
                            where raw_object_id = ${rawObjectId}`
      expect(revs).toEqual([{ old_price_raw: rows[0]!.price_raw, new_price_raw: changedRow.price_raw, revision: 1 }])
    })
  })
})

describe("보존 기간 정리 (KAMIS 90일, 참가격 6 조사일)", () => {
  test("90일이 지난 KAMIS 관측값만 지운다. 참가격은 조사일이 6개 미만이라 남는다", async () => {
    await inRollback(ingest, async (tx) => {
      const before = await tx`
        select si.source, count(*)::int as n from price.observation o
        join price.source_item si on si.id = o.source_item_id group by 1`
      const count = (s: string) => before.find((r) => r.source === s)?.n ?? 0
      const result = await tx`select source, deleted::int from price.purge_expired_observations('2027-01-31')`
      expect(result).toEqual([
        { source: "kamis", deleted: count("kamis") },
        { source: "chamga", deleted: 0 },
      ])
      const [ekape] = await tx`select count(*)::int as n from price.observation o
                               join price.source_item si on si.id = o.source_item_id where si.source = 'ekape'`
      expect(ekape!.n).toBe(count("ekape"))
    })
  })

  test("참가격은 상품 요약이 없으면 지우지 않는다", async () => {
    await inRollback(admin, async (tx) => {
      await tx`
        insert into price.observation
        select o.source_item_id, (o.obs_date + (14 * g))::date, o.place_id, o.price_tier, o.obs_kind, o.product_id,
               o.variety_id, o.spec_id, o.price_raw, o.qty_raw, o.unit_raw, o.price_per_base, o.unit_rule_id,
               o.promo_discount, o.promo_one_plus_one, o.promo_from, o.promo_to, o.flags, o.source_registered_at,
               o.first_seen_at, o.revision, o.raw_object_id
        from price.observation o join price.source_item si on si.id = o.source_item_id
        cross join generate_series(1, 8) g
        where si.source = 'chamga'`
      await tx`delete from price.product_daily_summary`
      const result = await tx`select source, deleted::int from price.purge_expired_observations('2027-01-31')`
      expect(result.find((r) => r.source === "chamga")).toEqual({ source: "chamga", deleted: 0 })
    })
  })

  test("참가격은 최근 6 조사일보다 오래된 날만 지운다", async () => {
    await inRollback(admin, async (tx) => {
      // 같은 행을 격주 금요일로 복제해 조사일 9개를 만든다 (소유자 접속, 롤백). 오래된 3개가 지워진다.
      await tx`
        insert into price.observation
        select o.source_item_id, (o.obs_date + (14 * g))::date, o.place_id, o.price_tier, o.obs_kind, o.product_id,
               o.variety_id, o.spec_id, o.price_raw, o.qty_raw, o.unit_raw, o.price_per_base, o.unit_rule_id,
               o.promo_discount, o.promo_one_plus_one, o.promo_from, o.promo_to, o.flags, o.source_registered_at,
               o.first_seen_at, o.revision, o.raw_object_id
        from price.observation o join price.source_item si on si.id = o.source_item_id
        cross join generate_series(1, 8) g
        where si.source = 'chamga'`
      // 지우려면 그 조사일의 상품 요약이 있어야 한다 (ingest-foundation/10)
      await tx`
        insert into price.product_daily_summary
        select s.product_id, s.scope_key, (s.obs_date + (14 * g))::date, s.min, s.median, s.max, s.median_excl_promo,
               s.seller_avg, s.n_stores, s.n_sellers, s.promo_n, s.promo_unknown_n, s.meets_min_n, s.computed_at
        from price.product_daily_summary s cross join generate_series(1, 8) g`
      const [oldest] = await tx`select count(*)::int as n from price.observation o join price.source_item si
                                on si.id = o.source_item_id
                                where si.source = 'chamga' and o.obs_date < date '2026-09-25' + 14 * 3`
      const result = await tx`select source, deleted::int from price.purge_expired_observations('2027-01-31')`
      expect(result.find((r) => r.source === "chamga")).toEqual({ source: "chamga", deleted: oldest!.n })
      const [left] = await tx`select count(distinct o.obs_date)::int as n from price.observation o
                              join price.source_item si on si.id = o.source_item_id where si.source = 'chamga'`
      expect(left!.n).toBe(6)
    })
  })
})
