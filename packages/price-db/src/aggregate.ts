// ③ 집계·판정을 테스트 데이터로 채운다 (pipeline.md 3-4). 값의 모양만 맞춘 간이 계산이다.
// 대표값·평소가·판정 계산식은 로드맵 ②에서 정하고 수집 패키지의 recompute가 만든다.
import { transaction, type Sql } from "./db.ts"

const CALC_VERSION = "fixture-1"

// 관측값 모양의 표(관측값 또는 백필 임시 표)에서 품종·규격 × 날짜 × 범위별 대표값을 낸다.
// 대표 출처(source_code_map.role = 'primary')의 매핑된 행만 센다. 시장 행은 시장 유형 범위도 만든다.
export async function aggregateDailyQuote(tx: Sql, from: string): Promise<number> {
  const result = await tx.unsafe(
    `insert into price.daily_quote as q
       (variety_id, spec_id, price_tier, basis, scope_key, obs_date, value, median, min, max, n,
        sources, promo_excluded_n, calc_version, computed_at)
     select o.variety_id, o.spec_id, o.price_tier,
            case when o.obs_kind = 'shelf_price' then 'shelf_price' else 'quote' end,
            sc.scope_key, o.obs_date,
            percentile_cont(0.5) within group (order by o.price_per_base),
            percentile_cont(0.5) within group (order by o.price_per_base),
            min(o.price_per_base), max(o.price_per_base), count(*),
            array_agg(distinct si.source order by si.source), 0, '${CALC_VERSION}', now()
     from ${from} o
     join price.source_item si on si.id = o.source_item_id
     join price.source_code_map m
       on m.source_item_id = o.source_item_id and m.status = 'mapped' and m.role = 'primary'
      and daterange(m.valid_from, m.valid_to) @> o.obs_date
     left join price.market mk on mk.place_id = o.place_id
     cross join lateral (values ('national'), ('market_type:' || mk.market_type)) sc (scope_key)
     where o.price_per_base is not null and sc.scope_key is not null
     group by 1, 2, 3, 4, 5, 6   -- 품종, 규격, 단계, 기준, 범위, 날짜
     on conflict (variety_id, spec_id, price_tier, basis, scope_key, obs_date) do update
       set value = excluded.value, median = excluded.median, min = excluded.min, max = excluded.max,
           n = excluded.n, sources = excluded.sources, calc_version = excluded.calc_version,
           computed_at = excluded.computed_at
       where (q.value, q.median, q.min, q.max, q.n, q.sources)
             is distinct from (excluded.value, excluded.median, excluded.min, excluded.max, excluded.n, excluded.sources)`,
  )
  return result.count
}

// 상품별 일자 요약: 전국, 업태별, 판매처별. 점포 수는 lineage 기준이다.
async function aggregateProductDailySummary(tx: Sql): Promise<void> {
  await tx`
    with obs as (
      select o.product_id, o.obs_date, o.price_raw, o.promo_discount, o.promo_one_plus_one,
             st.lineage_id, st.channel, ss.seller_id,
             coalesce(o.promo_discount, false) or coalesce(o.promo_one_plus_one, false) as on_promo,
             o.promo_discount is null and o.promo_one_plus_one is null as promo_unknown
      from price.observation o
      join price.store st on st.place_id = o.place_id
      left join price.store_seller ss
        on ss.place_id = st.place_id and daterange(ss.valid_from, ss.valid_to) @> o.obs_date
      where o.product_id is not null
    ),
    scoped as (
      select obs.*, sc.scope_key
      from obs
      cross join lateral (values ('national'), ('channel:' || obs.channel), ('seller:' || obs.seller_id)) sc (scope_key)
      where sc.scope_key is not null
    ),
    per_seller as (
      select product_id, obs_date, scope_key, seller_id, avg(price_raw) as seller_mean
      from scoped where seller_id is not null
      group by product_id, obs_date, scope_key, seller_id
    )
    insert into price.product_daily_summary
      (product_id, scope_key, obs_date, min, median, max, median_excl_promo, seller_avg,
       n_stores, n_sellers, promo_n, promo_unknown_n, computed_at)
    select s.product_id, s.scope_key, s.obs_date,
           min(s.price_raw), percentile_cont(0.5) within group (order by s.price_raw), max(s.price_raw),
           percentile_cont(0.5) within group (order by s.price_raw) filter (where not s.on_promo),
           (select avg(p.seller_mean) from per_seller p
             where p.product_id = s.product_id and p.obs_date = s.obs_date and p.scope_key = s.scope_key),
           count(distinct s.lineage_id), count(distinct s.seller_id),
           count(*) filter (where s.on_promo), count(*) filter (where s.promo_unknown), now()
    from scoped s
    group by s.product_id, s.scope_key, s.obs_date
    on conflict (product_id, scope_key, obs_date) do nothing`
}

// 축평원 평년 행을 품종·규격 단위 비교값으로 옮긴다. 축평원 단위가 곧 기준 단위다 (100g, 30구).
async function aggregateReferencePrice(tx: Sql): Promise<void> {
  await tx`
    insert into price.reference_price (variety_id, spec_id, ref_type, source, scope_key, ref_date, value, method, computed_at)
    select m.variety_id, m.spec_id, r.ref_type, 'ekape', 'national', r.ref_date, r.value_raw, 'ekape_response', now()
    from price.reference_observation r
    join price.source_code_map m
      on m.source_item_id = r.source_item_id and m.status = 'mapped'
     and daterange(m.valid_from, m.valid_to) @> r.ref_date
    on conflict do nothing`
}

// 평소가 자리: 전국 대표값의 중앙값. 계산식은 ②가 정한다.
async function aggregateUsualPrice(tx: Sql): Promise<void> {
  await tx`
    insert into price.usual_price (variety_id, spec_id, as_of, value, method, components)
    select variety_id, spec_id, max(obs_date), percentile_cont(0.5) within group (order by value), 'fixture_median',
           jsonb_build_object('days', count(*), 'from', min(obs_date), 'to', max(obs_date), 'scope', 'national')
    from price.daily_quote
    where scope_key = 'national' and price_tier = 'retail'
    group by variety_id, spec_id
    on conflict do nothing`
}

// 판정 묶음: building으로 만들고 행을 다 넣은 뒤 한 트랜잭션에서 ready와 포인터를 바꾼다 (3-4).
async function buildJudgmentBatch(tx: Sql): Promise<void> {
  const [batch] = await tx<{ id: string }[]>`
    insert into price.judgment_batch (started_at, status, trigger) values (now(), 'building', 'fixture')
    returning id`
  await tx`
    insert into price.judgment_snapshot
      (batch_id, variety_id, spec_id, as_of, today_price, usual, verdict, diff_pct, payload)
    select ${batch!.id}, u.variety_id, u.spec_id, u.as_of, q.value, u.value,
           case when q.value < u.value * 0.9 then 'cheap' when q.value > u.value * 1.1 then 'expensive' else 'normal' end,
           round((q.value / u.value - 1) * 100, 2),
           jsonb_build_object('variety', v.slug, 'spec', s.slug, 'as_of', u.as_of, 'today', q.value, 'usual', u.value)
    from price.usual_price u
    join price.daily_quote q
      on (q.variety_id, q.spec_id, q.obs_date) = (u.variety_id, u.spec_id, u.as_of)
     and q.scope_key = 'national' and q.price_tier = 'retail'
    join price.spec s on s.id = u.spec_id
    join price.variety v on v.id = u.variety_id`
  await tx`update price.judgment_batch set status = 'ready', finished_at = now() where id = ${batch!.id}`
  await tx`
    insert into price.judgment_current (batch_id, swapped_at) values (${batch!.id}, now())
    on conflict (singleton) do update set batch_id = excluded.batch_id, swapped_at = excluded.swapped_at`
}

// recompute 자리: 정기 적재가 끝난 뒤 ③을 다시 만든다.
export async function recomputeFixture(sql: Sql): Promise<void> {
  await transaction(sql, async (tx) => {
    await tx`select pg_advisory_xact_lock(hashtext('recompute'))`
    await aggregateDailyQuote(tx, "price.observation")
    await aggregateProductDailySummary(tx)
    await aggregateReferencePrice(tx)
    await aggregateUsualPrice(tx)
    await buildJudgmentBatch(tx)
  })
}
