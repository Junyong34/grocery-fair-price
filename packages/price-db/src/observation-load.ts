// 관측값 적재의 두 길 (pipeline.md 3-0 "접속", 3-3 "적재와 정정", 3-9 보관 1).
//   정기 적재: 임시 표 COPY → 정정 이력 → 바뀐 행만 고쳐 쓰는 병합
//   백필: 임시 표 COPY → daily_quote → 최근 90일만 observation에 insert … select
// 둘 다 원본 파일 하나 = 트랜잭션 하나이고, 출처별 advisory lock을 잡는다.
// 정식 구현은 수집 패키지(ingest-foundation/03)가 만든다. 이것은 스키마 검증과 테스트 데이터용이다.
import { aggregateDailyQuote } from "./aggregate.ts"
import { copyInto, type CopyValue } from "./copy.ts"
import { transaction, type Sql } from "./db.ts"

export type Source = "kamis" | "ekape" | "chamga"

export type ObservationRow = {
  source_item_id: number
  obs_date: string
  place_id: number
  price_tier: "retail" | "wholesale"
  obs_kind: "quote_sample" | "quote_aggregate" | "shelf_price"
  product_id: number | null
  variety_id: number | null
  spec_id: number | null
  price_raw: number
  qty_raw: number | null
  unit_raw: string | null
  price_per_base: number | null
  unit_rule_id: number | null
  promo_discount: boolean | null
  promo_one_plus_one: boolean | null
  promo_from: string | null
  promo_to: string | null
  flags: readonly string[] | null
  source_registered_at: string | null
  first_seen_at: string
  raw_object_id: number
} & Record<string, CopyValue>

const COLUMNS = [
  "source_item_id", "obs_date", "place_id", "price_tier", "obs_kind", "product_id", "variety_id", "spec_id",
  "price_raw", "qty_raw", "unit_raw", "price_per_base", "unit_rule_id",
  "promo_discount", "promo_one_plus_one", "promo_from", "promo_to", "flags",
  "source_registered_at", "first_seen_at", "raw_object_id",
] as const

export async function lockSource(tx: Sql, source: Source): Promise<void> {
  await tx`select pg_advisory_xact_lock(hashtext(${"ingest:" + source}))`
}

// 관측값과 같은 열의 세션 임시 표. RLS가 없고 WAL도 쓰지 않으며 commit 때 사라진다.
async function stageRows(tx: Sql, table: string, rows: readonly ObservationRow[]): Promise<void> {
  await tx.unsafe(`create temp table ${table} (like price.observation including defaults) on commit drop`)
  await copyInto(tx, table, COLUMNS, rows)
}

// 그날 source_day 행을 먼저 만든다 (없으면 pending, 3-5).
async function ensureSourceDays(tx: Sql, source: Source, table: string): Promise<void> {
  await tx.unsafe(
    `insert into price.source_day (source, target_date, status)
     select distinct $1, obs_date, 'pending' from ${table}
     on conflict do nothing`,
    [source],
  )
}

export type MergeResult = { changed: number; corrections: number }

// 정정 비교 → 정정 이력과 source_day 정정 표시 → 바뀐 행만 덮는 병합.
async function mergeStaged(tx: Sql, source: Source, table: string): Promise<MergeResult> {
  // 가격·행사가 바뀐 행은 바뀌기 전 값을 남기고, 그날의 corrected_at·correction_count를 올린다.
  // 상태(status)는 바꾸지 않는다: partial인 날이 정정돼도 partial로 남는다 (3-5).
  const corrections = await tx.unsafe(
    `with rev as (
       insert into price.observation_revision
         (source_item_id, obs_date, place_id, revision, old_price_raw, new_price_raw, old_promo, new_promo,
          old_source_registered_at, new_source_registered_at, detected_at, raw_object_id)
       select l.source_item_id, l.obs_date, l.place_id, o.revision + 1, o.price_raw, l.price_raw,
              jsonb_build_object('discount', o.promo_discount, 'one_plus_one', o.promo_one_plus_one,
                                 'from', o.promo_from, 'to', o.promo_to),
              jsonb_build_object('discount', l.promo_discount, 'one_plus_one', l.promo_one_plus_one,
                                 'from', l.promo_from, 'to', l.promo_to),
              o.source_registered_at, l.source_registered_at, now(), l.raw_object_id
       from ${table} l
       join price.observation o using (source_item_id, obs_date, place_id)
       where (o.price_raw, o.promo_discount, o.promo_one_plus_one, o.promo_from, o.promo_to)
             is distinct from (l.price_raw, l.promo_discount, l.promo_one_plus_one, l.promo_from, l.promo_to)
       returning obs_date
     )
     update price.source_day d
        set corrected_at = now(), correction_count = d.correction_count + 1
      where d.source = $1 and d.target_date in (select obs_date from rev)
     returning d.target_date`,
    [source],
  )

  // pipeline.md 3-3의 병합. 값이 같으면 행을 고쳐 쓰지 않는다. first_seen_at은 set에 넣지 않는다.
  const merged = await tx.unsafe(
    `insert into price.observation as o (${COLUMNS.join(", ")})
     select ${COLUMNS.join(", ")} from ${table}
     on conflict (source_item_id, obs_date, place_id) do update
       set price_raw = excluded.price_raw, qty_raw = excluded.qty_raw, unit_raw = excluded.unit_raw,
           price_per_base = excluded.price_per_base, unit_rule_id = excluded.unit_rule_id,
           promo_discount = excluded.promo_discount, promo_one_plus_one = excluded.promo_one_plus_one,
           promo_from = excluded.promo_from, promo_to = excluded.promo_to, flags = excluded.flags,
           product_id = excluded.product_id, variety_id = excluded.variety_id, spec_id = excluded.spec_id,
           source_registered_at = excluded.source_registered_at, raw_object_id = excluded.raw_object_id,
           revision = o.revision + case when (o.price_raw, o.promo_discount, o.promo_one_plus_one, o.promo_from, o.promo_to)
                                              is distinct from (excluded.price_raw, excluded.promo_discount,
                                                                excluded.promo_one_plus_one, excluded.promo_from, excluded.promo_to)
                                            then 1 else 0 end
       where (o.price_raw, o.qty_raw, o.unit_raw, o.price_per_base, o.unit_rule_id, o.product_id, o.variety_id, o.spec_id,
              o.promo_discount, o.promo_one_plus_one, o.promo_from, o.promo_to, o.flags, o.source_registered_at)
             is distinct from
             (excluded.price_raw, excluded.qty_raw, excluded.unit_raw, excluded.price_per_base, excluded.unit_rule_id,
              excluded.product_id, excluded.variety_id, excluded.spec_id, excluded.promo_discount, excluded.promo_one_plus_one,
              excluded.promo_from, excluded.promo_to, excluded.flags, excluded.source_registered_at)`,
  )
  return { changed: merged.count, corrections: corrections.count }
}

// 처음 정상으로 받은 날을 ok로 둔다. 이미 판정된 상태(partial 등)는 건드리지 않는다.
async function settleSourceDays(tx: Sql, source: Source, table: string): Promise<void> {
  await tx.unsafe(
    `update price.source_day d
        set status = 'ok', row_count = s.n, first_ok_at = coalesce(d.first_ok_at, now()), last_checked_at = now()
       from (select obs_date, count(*)::int as n from ${table} group by obs_date) s
      where d.source = $1 and d.target_date = s.obs_date and d.status = 'pending'`,
    [source],
  )
}

async function markLoaded(tx: Sql, rawObjectId: number): Promise<void> {
  await tx`update price.raw_object set load_status = 'loaded', loaded_at = now() where id = ${rawObjectId}`
}

// 정기 적재: 원본 파일 하나를 트랜잭션 하나로.
export async function loadObservationFile(
  sql: Sql,
  source: Source,
  rawObjectId: number,
  rows: readonly ObservationRow[],
): Promise<MergeResult> {
  return transaction(sql, async (tx) => {
    await lockSource(tx, source)
    await stageRows(tx, "obs_load", rows)
    await ensureSourceDays(tx, source, "obs_load")
    const result = await mergeStaged(tx, source, "obs_load")
    await settleSourceDays(tx, source, "obs_load")
    await markLoaded(tx, rawObjectId)
    await tx`drop table obs_load`   // commit 때 사라지지만, 바깥 트랜잭션 안에서 다시 부를 수 있게 지운다
    return result
  })
}

export type BackfillResult = { dailyQuotes: number; observations: number }

// KAMIS 백필 묶음 하나: 임시 표에서 집계를 만들고, 최근 90일에 드는 행만 관측값에 넣는다 (3-9 보관 1).
export async function backfillKamisBundle(
  sql: Sql,
  rawObjectId: number,
  rows: readonly ObservationRow[],
  today: string,
): Promise<BackfillResult> {
  return transaction(sql, async (tx) => {
    await lockSource(tx, "kamis")
    await stageRows(tx, "kamis_backfill", rows)
    await tx.unsafe(`create index on kamis_backfill (variety_id, spec_id, obs_date)`)
    const dailyQuotes = await aggregateDailyQuote(tx, "kamis_backfill")
    await ensureSourceDays(tx, "kamis", "kamis_backfill")
    await settleSourceDays(tx, "kamis", "kamis_backfill")
    await tx.unsafe(`delete from kamis_backfill where obs_date < $1::date - 90`, [today])
    const { changed } = await mergeStaged(tx, "kamis", "kamis_backfill")
    await markLoaded(tx, rawObjectId)
    await tx`drop table kamis_backfill`
    return { dailyQuotes, observations: changed }
  })
}
