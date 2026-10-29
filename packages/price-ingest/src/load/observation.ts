// 관측값 병합 (pipeline 3-0 "접속", 3-3 "적재와 정정", 3-5).
// 원본 파일 하나 = 트랜잭션 하나: 출처별 advisory lock → 임시 표 COPY → 정정 이력 → 바뀐 행만 고쳐 쓰는 병합 → source_day.
// RLS가 켜진 영구 표에는 COPY FROM을 못 하므로 세션 임시 표를 거친다 (3-0).
import { copyInto, type CopyValue } from "./copy.ts"
import type { Tx } from "./db.ts"
import type { DbSource } from "./types.ts"

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

export async function lockSource(tx: Tx, source: DbSource): Promise<void> {
  await tx`select pg_advisory_xact_lock(hashtext(${"ingest:" + source}))`
}

// 관측값과 같은 열의 세션 임시 표. RLS가 없고 WAL도 쓰지 않으며 commit 때 사라진다.
export async function stageObservations(tx: Tx, table: string, rows: readonly ObservationRow[]): Promise<void> {
  await tx.unsafe(`create temp table ${table} (like price.observation including defaults) on commit drop`)
  await copyInto(tx, table, COLUMNS, rows)
}

// 그날 source_day 행을 먼저 만든다 (없으면 pending, 3-5). daysFrom보다 오래된 날은 만들지 않는다
export async function ensureSourceDays(tx: Tx, source: DbSource, table: string, daysFrom = "0001-01-01"): Promise<void> {
  await tx.unsafe(
    `insert into price.source_day (source, target_date, status)
     select distinct $1, obs_date, 'pending' from ${table} where obs_date >= $2::date
     on conflict do nothing`,
    [source, daysFrom],
  )
}

// inserted: 새로 생긴 행, changed: 새로 생기거나 고쳐 쓴 행, corrections: 가격·행사가 바뀐 행 (정정)
export type MergeResult = { inserted: number; changed: number; corrections: number }

// 정정 비교 → 정정 이력과 source_day 정정 표시 → 바뀐 행만 덮는 병합 → source_day 갱신.
// sourceDaysFrom: 이보다 오래된 날은 source_day를 만들지 않는다. 축평원 백필은 축종 묶음 하나로 그날을 ok로 둘 수 없다
// (KAMIS 백필은 90일 밖의 행을 관측값에 넣지 않아 같은 결과다, ingest-foundation/04)
export async function mergeObservations(
  tx: Tx,
  source: DbSource,
  table: string,
  options: { sourceDaysFrom?: string } = {},
): Promise<MergeResult> {
  await ensureSourceDays(tx, source, table, options.sourceDaysFrom)

  // 가격·행사가 바뀐 행은 바뀌기 전 값을 남기고, 그날의 corrected_at·correction_count를 올린다.
  // 상태(status)는 바꾸지 않는다: partial인 날이 정정돼도 partial로 남는다 (3-5).
  const [revised] = await tx.unsafe<{ revisions: number }[]>(
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
     ), marked as (
       update price.source_day d
          set corrected_at = now(), correction_count = d.correction_count + 1
        where d.source = $1 and d.target_date in (select obs_date from rev)
     )
     select count(*)::int as revisions from rev`,
    [source],
  )

  // pipeline 3-3의 병합. 값이 같으면 행을 고쳐 쓰지 않는다. first_seen_at은 set에 넣지 않는다.
  // xmax = 0이면 이번에 새로 넣은 행이다 (고쳐 쓴 행은 xmax가 이 트랜잭션 번호다).
  const merged = await tx.unsafe<{ obs_date: string; inserted: boolean }[]>(
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
              excluded.promo_from, excluded.promo_to, excluded.flags, excluded.source_registered_at)
     returning o.obs_date::text, (o.xmax = 0) as inserted`,
  )

  const byDate = new Map<string, { obs_date: string; inserted: number; changed: number }>()
  for (const row of merged) {
    const day = byDate.get(row.obs_date) ?? { obs_date: row.obs_date, inserted: 0, changed: 0 }
    day.changed += 1
    if (row.inserted) day.inserted += 1
    byDate.set(row.obs_date, day)
  }
  await settleSourceDays(tx, source, table, [...byDate.values()])

  return {
    inserted: merged.filter((row) => row.inserted).length,
    changed: merged.length,
    corrections: revised?.revisions ?? 0,
  }
}

// 행이 온 날을 ok로 둔다. 아직 안 옴·실패·와야 하는데 빔이었던 날도 행이 왔으면 ok다.
// partial·empty_expected처럼 판정이 끝난 상태는 건드리지 않는다 (판정 규칙은 ingest-schedule/08).
// row_count는 그날 이 출처의 관측값 행 수다. 새로 생긴 행만큼 늘린다.
async function settleSourceDays(
  tx: Tx,
  source: DbSource,
  table: string,
  counts: { obs_date: string; inserted: number; changed: number }[],
): Promise<void> {
  await tx.unsafe(
    `update price.source_day d
        set status = case when d.status in ('pending', 'failed', 'empty_unexpected') then 'ok' else d.status end,
            row_count = d.row_count + coalesce(c.inserted, 0),
            first_ok_at = coalesce(d.first_ok_at, now()),
            last_checked_at = now(),
            last_changed_at = case when coalesce(c.changed, 0) > 0 then now() else d.last_changed_at end,
            max_source_registered_at = greatest(d.max_source_registered_at, s.max_registered_at)
       from (select obs_date, max(source_registered_at) as max_registered_at from ${table} group by obs_date) s
       left join jsonb_to_recordset($2::text::jsonb) as c (obs_date date, inserted int, changed int) on c.obs_date = s.obs_date
      where d.source = $1 and d.target_date = s.obs_date`,
    [source, JSON.stringify(counts)],
  )
}
