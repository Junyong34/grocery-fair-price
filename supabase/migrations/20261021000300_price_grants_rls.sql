-- ① 수집 기반: 롤별 권한과 RLS (pipeline.md 3-0 "역할", "RLS")
-- 접근은 GRANT가 정한다. RLS는 실수로 권한이 새어 나갔을 때를 막는 이중 장치로 모든 표에 켠다.
-- 정책이 없는 롤은 행이 0개로 보인다 (오류가 나지 않는다). 그래서 정책을 롤마다 명시하고,
-- anon·authenticated 정책은 만들지 않는다.

-- ── ingest_writer: 수집·재계산·백필 ───────────────────────────────────

-- 운영자가 정하는 표는 읽기만. 고치는 일은 지금은 로컬 소유자(postgres) 접속으로 한다.
grant select on
  price.category, price.item, price.variety, price.spec, price.alias, price.variety_seasonal_map,
  price.unit_rule, price.al_variety_rule, price.seller, price.calc_param
to ingest_writer;

-- 그 밖의 표는 읽고 쓴다.
grant select, insert, update, delete on
  price.region, price.region_code_map,
  price.source_code_table, price.source_item, price.source_code_map,
  price.obs_place, price.store, price.store_link, price.store_seller, price.market, price.source_master_change,
  price.observation, price.observation_revision, price.reference_observation,
  price.daily_quote, price.product_daily_summary, price.reference_price, price.usual_price,
  price.judgment_batch, price.judgment_current, price.judgment_snapshot,
  price.ingest_run, price.source_day, price.source_day_part, price.backfill_task,
  price.product, price.product_source_key, price.product_attr_history, price.product_variety_map,
  price.raw_object
to ingest_writer;
grant select on price.current_judgment to ingest_writer;
grant usage on all sequences in schema price to ingest_writer;

-- ── web_reader: 웹앱 서버 컴포넌트 (화면이 쓰는 표만) ─────────────────────

grant select on
  price.category, price.item, price.variety, price.spec, price.alias, price.variety_seasonal_map,
  price.daily_quote, price.product_daily_summary, price.reference_price, price.usual_price,
  price.judgment_current, price.judgment_snapshot, price.current_judgment,
  price.product, price.product_attr_history,
  price.seller, price.region
to web_reader;
-- 보류: 상품 화면의 점포별 가격 블록이 ③에서 정해지면 observation(참가격 행만,
-- 정책 using (product_id is not null)), obs_place, store를 더한다.

-- ── RLS: 모든 표에 켜고 롤마다 정책을 둔다 ────────────────────────────

do $$
declare
  t text;
  web_tables text[] := array[
    'category', 'item', 'variety', 'spec', 'alias', 'variety_seasonal_map',
    'daily_quote', 'product_daily_summary', 'reference_price', 'usual_price',
    'judgment_current', 'judgment_snapshot',
    'product', 'product_attr_history',
    'seller', 'region'
  ];
begin
  for t in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'price' and c.relkind = 'r'
    order by c.relname
  loop
    execute format('alter table price.%I enable row level security', t);
    -- 운영자 표에도 둔다. 쓰기는 GRANT(select만)가 막는다.
    execute format('create policy ingest_rw on price.%I for all to ingest_writer using (true) with check (true)', t);
    if t = any (web_tables) then
      execute format('create policy web_select on price.%I for select to web_reader using (true)', t);
    end if;
  end loop;
end
$$;
