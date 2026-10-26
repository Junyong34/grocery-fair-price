// 품종·규격별 일자 요약(daily_quote)을 관측값에서 다시 계산한다 (pipeline 3-4, ingest-foundation/10).
// 대표값 계산식은 로드맵 ② 판정 설계가 정한다. 그 전까지는 중앙값이고 calc_version으로 구분한다.
//
//   시세(quote): KAMIS·축평원. 원천 키 매핑이 mapped·primary인 행만 센다 (축산은 두 출처 중 대표만, 6-1)
//     national: 시장 표본(quote_sample) 전부, 또는 전국 값(region_avg 중 scope national). 시도 평균은 세지 않는다
//     market_type:<유형>: 시장 표본을 시장 유형별로
//   판매가(shelf_price): 참가격. national, channel:<업태>. 행사(true)는 값에서 빼고 promo_excluded_n으로 센다.
//     점포 수(n)는 재등록 사슬(lineage) 기준
//   이상치(flags outlier)와 기준 단위 가격이 없는 행은 세지 않는다.
//
// 날짜 하나를 다시 계산하면 그날 그 기준의 행을 새 결과로 맞춘다 (없어진 품종·범위의 행은 지운다).
// 관측값이 보존 기간으로 지워진 날은 다시 계산하지 않는다. 남은 행(축평원)만으로 계산하면 집계가 망가진다 (3-3).
import { addDays } from "../ingest/collect.ts"

import type { Sql, Tx } from "./db.ts"

export const CALC_VERSION = "median-1"

// KAMIS 관측값 보존 일수 (3-9 보관 1, 6-1). 이보다 오래된 날의 시세는 다시 계산하지 않는다
export const KAMIS_KEEP_DAYS = 90

export type Basis = "quote" | "shelf_price"

const SAMPLES: Record<Basis, string> = {
  quote: `
    select o.variety_id, o.spec_id, o.price_tier, o.obs_date, o.price_per_base as price, false as on_promo,
           o.place_id as unit_id, si.source, sc.scope_key
      from price.observation o
      join price.source_item si on si.id = o.source_item_id and si.source in ('kamis', 'ekape')
      join price.source_code_map m
        on m.source_item_id = o.source_item_id and m.status = 'mapped' and m.role = 'primary'
       and daterange(m.valid_from, m.valid_to) @> o.obs_date
      join price.obs_place p on p.id = o.place_id
      left join price.market mk on mk.place_id = o.place_id
      cross join lateral (values
        (case when o.obs_kind = 'quote_sample' or p.scope = 'national' then 'national' end),
        ('market_type:' || mk.market_type)
      ) sc (scope_key)
     where o.obs_date = any($1::date[]) and o.obs_date >= $2::date
       and o.obs_kind in ('quote_sample', 'quote_aggregate')
       and not ('outlier' = any(coalesce(o.flags, '{}')))`,
  shelf_price: `
    select o.variety_id, o.spec_id, o.price_tier, o.obs_date, o.price_per_base as price,
           coalesce(o.promo_discount, false) or coalesce(o.promo_one_plus_one, false) as on_promo,
           st.lineage_id as unit_id, 'chamga' as source, sc.scope_key
      from price.observation o
      join price.store st on st.place_id = o.place_id
      cross join lateral (values ('national'), ('channel:' || st.channel)) sc (scope_key)
     where o.obs_date = any($1::date[]) and o.obs_kind = 'shelf_price' and $2::date is not null
       and not ('outlier' = any(coalesce(o.flags, '{}')))`,
}

export type RecomputeResult = { written: number; removed: number }

// dates: 다시 계산할 날 (YYYY-MM-DD). today: 보존 기간 기준일 (KST). 트랜잭션 안에서 부른다
export async function recomputeDailyQuote(tx: Tx, basis: Basis, dates: readonly string[], today: string): Promise<RecomputeResult> {
  if (dates.length === 0) return { written: 0, removed: 0 }
  // 시세는 보존 기간 안의 날만, 판매가는 관측값이 남아 있는 날만
  const keepFrom = basis === "quote" ? addDays(today, -KAMIS_KEEP_DAYS) : "0001-01-01"
  const params = [dates as string[], keepFrom]
  // KAMIS와 축평원 실행이 같은 날의 시세를 함께 고칠 수 있다. 기준마다 한 번에 하나만
  await tx`select pg_advisory_xact_lock(hashtext(${"recompute:" + basis}))`

  await tx.unsafe(
    `create temp table dq_new on commit drop as
     with s as (${SAMPLES[basis]}),
     ok as (
       select * from s
        where s.scope_key is not null and s.variety_id is not null and s.price is not null
     )
     select variety_id, spec_id, price_tier, scope_key, obs_date,
            percentile_cont(0.5) within group (order by price) filter (where not on_promo) as median,
            min(price) filter (where not on_promo) as min, max(price) filter (where not on_promo) as max,
            count(distinct unit_id) filter (where not on_promo)::int as n,
            array_agg(distinct source order by source) as sources,
            count(*) filter (where on_promo)::int as promo_excluded_n
       from ok
      group by variety_id, spec_id, price_tier, scope_key, obs_date
     having count(*) filter (where not on_promo) > 0`,
    params,
  )
  // 이번에 계산한 날 중 실제로 계산 대상이었던 날만 지운다 (보존 기간 밖·관측값 없는 날은 그대로 둔다)
  const removed = await tx.unsafe(
    `delete from price.daily_quote q
      where q.basis = $1 and q.obs_date = any($2::date[]) and q.obs_date >= $3::date
        and ($1 <> 'shelf_price' or exists (
              select 1 from price.observation o where o.obs_date = q.obs_date and o.obs_kind = 'shelf_price'))
        and not exists (
              select 1 from dq_new n
               where (n.variety_id, n.spec_id, n.price_tier, n.scope_key, n.obs_date)
                   = (q.variety_id, q.spec_id, q.price_tier, q.scope_key, q.obs_date))`,
    [basis, dates as string[], keepFrom],
  )
  const written = await tx.unsafe(
    `insert into price.daily_quote as q
       (variety_id, spec_id, price_tier, basis, scope_key, obs_date, value, median, min, max, n,
        sources, promo_excluded_n, calc_version, computed_at)
     select variety_id, spec_id, price_tier, $1, scope_key, obs_date, round(median::numeric, 2), round(median::numeric, 2),
            min, max, n, sources, promo_excluded_n, $2, now()
       from dq_new
     on conflict (variety_id, spec_id, price_tier, basis, scope_key, obs_date) do update
       set value = excluded.value, median = excluded.median, min = excluded.min, max = excluded.max, n = excluded.n,
           sources = excluded.sources, promo_excluded_n = excluded.promo_excluded_n,
           calc_version = excluded.calc_version, computed_at = excluded.computed_at
     where (q.value, q.median, q.min, q.max, q.n, q.sources, q.promo_excluded_n, q.calc_version)
           is distinct from (excluded.value, excluded.median, excluded.min, excluded.max, excluded.n, excluded.sources,
                             excluded.promo_excluded_n, excluded.calc_version)`,
    [basis, CALC_VERSION],
  )
  await tx.unsafe(`drop table dq_new`)
  return { written: written.count, removed: removed.count }
}

// 원본 파일들이 담은 날. 적재가 끝난 원본의 대상 기간(target_from~target_to)을 날짜로 편다
export async function datesOfRawObjects(tx: Sql | Tx, rawObjectIds: readonly number[]): Promise<string[]> {
  if (rawObjectIds.length === 0) return []
  const rows = await tx<{ day: string }[]>`
    select distinct d::date::text as day
      from price.raw_object r, generate_series(r.target_from, r.target_to, interval '1 day') d
     where r.id = any(${rawObjectIds as number[]}) and r.target_from is not null
     order by 1`
  return rows.map((r) => r.day)
}
