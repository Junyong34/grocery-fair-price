// 참가격 상품별 일자 요약(product_daily_summary)을 관측값에서 다시 계산한다 (pipeline 3-4, ingest-foundation/07).
//   범위: national, channel:<업태>, seller:<seller_id>. 지역(region:)은 점포 지역이 채워진 뒤 (07)
//   최저·중앙·최고: 그 범위의 모든 점포 가격 (행사가 포함, 사는 사람이 내는 값)
//   행사 뺀 중앙: 행사(true)인 행을 뺀 중앙값. null(모름)은 뺀다고 보지 않는다 (daily_quote와 같다)
//   판매처 2단 평균 (seller_avg, 정부 화면 "평균가격"과 같은 값, gov-price-sites.md 1장):
//     판매처 = 그 판매처 점포 가격의 평균, 업태 = 업태 안 판매처 평균의 평균, 전국 = 데이터가 있는 업태 평균의 평균.
//     반올림은 화면이 한다 (1,421.5 → 1,422). 판매처를 모르는 점포는 이 평균에 들어가지 않는다
//   점포 수는 재등록 사슬(lineage) 기준, 판매처는 조사일이 속한 기간의 store_seller로 센다
//   이상치(flags outlier)는 세지 않는다. 상품 → 품종 연결과 무관하게 만든다
//
// 조사일 하나를 다시 계산하면 그날의 행을 새 결과로 맞춘다 (없어진 상품·범위의 행은 지운다).
// 관측값이 보존 정리로 지워진 조사일은 건드리지 않는다. 그날은 요약만 남아 있다.
import type { Sql, Tx } from "./db.ts"

export type SummaryResult = { written: number; removed: number; days: number }

// 관측값은 있는데 요약이 없는 조사일. 요약 계산이 실패한 날을 다음 실행이 이어 받는다 (그 전에는 보존 정리가 지우지 않는다)
export async function surveyDaysWithoutSummary(tx: Sql | Tx): Promise<string[]> {
  const rows = await tx<{ day: string }[]>`
    select d.obs_date::text as day
      from (select distinct obs_date from price.observation where obs_kind = 'shelf_price') d
     where not exists (select 1 from price.product_daily_summary s where s.obs_date = d.obs_date)
     order by 1`
  return rows.map((r) => r.day)
}

// dates: 다시 계산할 조사일 (YYYY-MM-DD). 트랜잭션 안에서 부른다
export async function recomputeProductSummary(tx: Tx, dates: readonly string[]): Promise<SummaryResult> {
  if (dates.length === 0) return { written: 0, removed: 0, days: 0 }
  await tx`select pg_advisory_xact_lock(hashtext('recompute:product_summary'))`
  const days = await tx<{ day: string }[]>`
    select distinct o.obs_date::text as day
      from price.observation o
     where o.obs_date = any(${dates as string[]}::date[]) and o.obs_kind = 'shelf_price'`
  if (days.length === 0) return { written: 0, removed: 0, days: 0 }
  const live = days.map((d) => d.day)

  await tx.unsafe(
    `create temp table pds_new on commit drop as
     with obs as (
       select o.product_id, o.obs_date, o.price_raw, st.lineage_id, st.channel, ss.seller_id,
              coalesce(o.promo_discount, false) or coalesce(o.promo_one_plus_one, false) as on_promo,
              o.promo_discount is null and o.promo_one_plus_one is null as promo_unknown
         from price.observation o
         join price.store st on st.place_id = o.place_id
         left join price.store_seller ss
           on ss.place_id = o.place_id and daterange(ss.valid_from, ss.valid_to) @> o.obs_date
        where o.obs_date = any($1::date[]) and o.obs_kind = 'shelf_price' and o.product_id is not null
          and not ('outlier' = any(coalesce(o.flags, '{}')))
     ),
     scoped as (
       select obs.*, sc.scope_key
         from obs
        cross join lateral (values ('national'), ('channel:' || obs.channel), ('seller:' || obs.seller_id)) sc (scope_key)
        where sc.scope_key is not null
     ),
     per_seller as (
       select product_id, obs_date, channel, seller_id, avg(price_raw) as mean
         from obs where seller_id is not null
        group by product_id, obs_date, channel, seller_id
     ),
     per_channel as (
       select product_id, obs_date, channel, avg(mean) as mean
         from per_seller group by product_id, obs_date, channel
     ),
     two_level as (
       select product_id, obs_date, 'seller:' || seller_id as scope_key, mean as seller_avg from per_seller
       union all
       select product_id, obs_date, 'channel:' || channel, mean from per_channel
       union all
       select product_id, obs_date, 'national', avg(mean) from per_channel group by product_id, obs_date
     )
     select s.product_id, s.scope_key, s.obs_date,
            min(s.price_raw) as min,
            round(percentile_cont(0.5) within group (order by s.price_raw)::numeric, 2) as median,
            max(s.price_raw) as max,
            round((percentile_cont(0.5) within group (order by s.price_raw) filter (where not s.on_promo))::numeric, 2)
              as median_excl_promo,
            round(t.seller_avg, 2) as seller_avg,
            count(distinct s.lineage_id)::int as n_stores,
            count(distinct s.seller_id)::int as n_sellers,
            count(*) filter (where s.on_promo)::int as promo_n,
            count(*) filter (where s.promo_unknown)::int as promo_unknown_n
       from scoped s
       left join two_level t using (product_id, obs_date, scope_key)
      group by s.product_id, s.scope_key, s.obs_date, t.seller_avg`,
    [live],
  )

  const removed = await tx.unsafe(
    `delete from price.product_daily_summary p
      where p.obs_date = any($1::date[])
        and not exists (select 1 from pds_new n where (n.product_id, n.scope_key, n.obs_date) = (p.product_id, p.scope_key, p.obs_date))`,
    [live],
  )
  // 값이 같은 행은 고쳐 쓰지 않는다
  const written = await tx.unsafe(
    `insert into price.product_daily_summary as p
       (product_id, scope_key, obs_date, min, median, max, median_excl_promo, seller_avg,
        n_stores, n_sellers, promo_n, promo_unknown_n, computed_at)
     select product_id, scope_key, obs_date, min, median, max, median_excl_promo, seller_avg,
            n_stores, n_sellers, promo_n, promo_unknown_n, now()
       from pds_new
     on conflict (product_id, scope_key, obs_date) do update
       set min = excluded.min, median = excluded.median, max = excluded.max,
           median_excl_promo = excluded.median_excl_promo, seller_avg = excluded.seller_avg,
           n_stores = excluded.n_stores, n_sellers = excluded.n_sellers, promo_n = excluded.promo_n,
           promo_unknown_n = excluded.promo_unknown_n, computed_at = excluded.computed_at
     where (p.min, p.median, p.max, p.median_excl_promo, p.seller_avg, p.n_stores, p.n_sellers, p.promo_n, p.promo_unknown_n)
           is distinct from (excluded.min, excluded.median, excluded.max, excluded.median_excl_promo, excluded.seller_avg,
                             excluded.n_stores, excluded.n_sellers, excluded.promo_n, excluded.promo_unknown_n)`,
  )
  await tx.unsafe(`drop table pds_new`)
  return { written: written.count, removed: removed.count, days: live.length }
}
