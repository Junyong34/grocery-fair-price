-- ① 수집 기반: 표 40개와 인덱스 (pipeline.md 3-1 ~ 3-7)
-- 만드는 순서는 3-0 "만드는 순서"다. FK가 가리키는 표를 먼저 만든다.
-- 규칙 (3-0):
--   - 마스터 ID는 integer identity, 계속 쌓이는 기록 ID는 bigint identity.
--   - 복합 PK·인덱스는 같음(=) 조건 열을 앞에, 날짜 열을 맨 뒤에 둔다.
--   - FK 열은 인덱스를 둔다. 두지 않는 곳은 3-0 생략 목록에 있고 여기에도 이유를 적는다.
--   - 유효 기간은 [valid_from, valid_to), valid_to null = 지금까지. 기간 check와 btree_gist exclusion을 둔다.
--   - 품종·규격을 함께 드는 표는 (variety_id, spec_id)를 spec(variety_id, id)에 복합 FK로 잇는다.

-- ── 3-2 지역 (다른 마스터가 가리키므로 먼저) ─────────────────────────────

create table price.region (
  code           text primary key,          -- 법정동 코드 앞 2(시도)·5(시군구)자리, 전국 '00' (6-1)
  name           text not null,
  level          text not null check (level in ('nation', 'sido', 'sigungu')),
  parent_code    text null references price.region (code),
  valid_from     date null,
  valid_to       date null,
  successor_code text null references price.region (code),   -- FK 인덱스 생략: 수백 행이고 지우지 않는다
  check (valid_to is null or valid_from is null or valid_to > valid_from)
);
create index region_parent_code_idx on price.region (parent_code);

-- ── 3-1 분류 ─────────────────────────────────────────────────────────

create table price.category (
  id   integer generated always as identity primary key,
  slug text not null unique,
  name text not null,
  sort smallint null
);

create table price.item (
  id          integer generated always as identity primary key,
  category_id integer not null references price.category (id),
  slug        text not null unique,
  name        text not null
);
create index item_category_id_idx on price.item (category_id);

create table price.variety (
  id            integer generated always as identity primary key,
  item_id       integer not null references price.item (id),
  slug          text not null unique,      -- 가격 품종 ID의 바깥 이름 (URL, payload)
  name          text not null,
  base_unit     text not null check (base_unit in ('g', 'ml', 'ea')),
  base_unit_qty numeric not null check (base_unit_qty > 0),   -- 기준 단위: 100 g, 1 ea, 30 ea(계란) …
  status        text not null check (status in ('active', 'hidden'))
);
create index variety_item_id_idx on price.variety (item_id);

create table price.spec (
  id         integer generated always as identity primary key,
  variety_id integer not null references price.variety (id),   -- FK 인덱스는 아래 unique가 덮는다
  slug       text not null,
  name       text not null,
  is_default boolean not null,
  sort       smallint null,
  unique (variety_id, slug),
  unique (variety_id, id)                  -- 복합 FK (variety_id, spec_id)의 대상
);
-- 품종마다 기본 규격은 많아야 하나. "하나는 있다"는 검사 질의로 본다 (3-1, 시드 끝과 테스트).
create unique index spec_one_default on price.spec (variety_id) where is_default;

create table price.unit_rule (
  id         integer generated always as identity primary key,
  rule_code  text not null,
  version    smallint not null,
  price_tier text not null check (price_tier in ('retail', 'wholesale')),
  kind       text not null check (kind in ('same_unit', 'weight_to_ea', 'ea_to_weight')),
  params     jsonb not null,               -- {"from_unit":"g"} / {"from_unit":"ea","g_per_ea":300} …
  note       text null,
  created_at timestamptz not null default now(),
  unique (rule_code, version)
);

create table price.source_code_table (
  source            text not null check (source in ('kamis', 'ekape', 'chamga')),
  code_class        text not null,         -- KAMIS se·ctgry·item·vrty·grd·sgg·mrkt, 축평원 judge_kind·item, 참가격 AL·UT·AR·BU
  code              text not null,
  name              text not null,
  parent_code       text null,             -- 참가격 highCode, KAMIS 품종의 품목
  in_official_table boolean not null,      -- 코드표에 있나 (응답에만 있는 코드가 온다)
  first_seen_on     date not null,
  last_seen_on      date not null,
  retired_on        date null,
  attrs             jsonb null,
  primary key (source, code_class, code),
  check (last_seen_on >= first_seen_on)
);

create table price.source_item (
  id            integer generated always as identity primary key,
  source        text not null check (source in ('kamis', 'ekape', 'chamga')),
  source_key    text not null,             -- 'kamis:01-200-224-01-04' | 'ekape:4304-27-구분없음' | 'chamga:1000'
  key_parts     jsonb not null,            -- 원천 필드명 그대로 {"se_cd":"01","item_cd":"224",…}
  label         text null,                 -- 운영자 화면용
  first_seen_on date not null,
  last_seen_on  date not null,
  unique (source, source_key),
  check (last_seen_on >= first_seen_on)
);

-- ── 3-5·3-7 수집 실행과 원본 (관측값·마스터 변경이 가리키므로 먼저) ──────────

create table price.ingest_run (
  id           bigint generated always as identity primary key,
  source       text not null check (source in ('kamis', 'ekape', 'chamga', 'all')),   -- 'all': recompute처럼 출처를 가리지 않는 작업
  job          text not null check (job in ('daily', 'recheck', 'reregistration_watch', 'master', 'backfill', 'recompute')),
  started_at   timestamptz not null,
  finished_at  timestamptz null,
  status       text not null check (status in ('running', 'ok', 'partial', 'failed')),
  calls_used   integer not null default 0,
  call_budget  integer not null,
  error_code   text null,
  error_detail text null,                  -- 인증키·원천 오류 문구는 남기지 않는다
  git_sha      text null
);
create index ingest_run_source_started_at_idx on price.ingest_run (source, started_at);

create table price.raw_object (
  id                bigint generated always as identity primary key,
  source            text not null check (source in ('kamis', 'ekape', 'chamga')),
  endpoint          text not null,         -- 'perDay/price' | 'consumerPriceDaily' | 'getProductPriceInfoSvc' …
  storage_path      text not null unique,  -- raw/{source}/{YYYY}/{MM}/{DD}/{call-key}.ndjson.gz (DD = KST 수집일)
  requests          jsonb not null,        -- 호출마다 파라미터(serviceKey 제외), pageNo, HTTP 상태, resultCode, 행 수
  call_count        smallint not null,
  row_count         integer not null,
  bytes_gz          integer not null,
  content_sha256    text not null,
  target_from       date null,             -- 담긴 조사일 범위
  target_to         date null,
  fetched_at        timestamptz not null,
  ingest_run_id     bigint not null references price.ingest_run (id),
  contract_baseline text not null,         -- 계약 테스트 baseline 버전 (p2/12)
  adapter_version   text not null,
  load_status       text not null check (load_status in ('pending_load', 'loaded', 'partially_rejected', 'rejected', 'duplicate')),
  rejected_rows     integer not null default 0,
  duplicate_of      bigint null references price.raw_object (id),
  loaded_at         timestamptz null,
  purged_at         timestamptz null,      -- Storage 파일을 지운 시각. 행은 남긴다 (FK가 가리킨다)
  check (target_from is null or target_to is null or target_to >= target_from),
  check ((load_status = 'duplicate') = (duplicate_of is not null))
);
create index raw_object_source_target_from_idx on price.raw_object (source, target_from);
create index raw_object_ingest_run_id_idx on price.raw_object (ingest_run_id);
create index raw_object_pending_load_idx on price.raw_object (load_status) where load_status = 'pending_load';
create index raw_object_duplicate_of_idx on price.raw_object (duplicate_of);

create table price.source_day (
  source                   text not null check (source in ('kamis', 'ekape', 'chamga')),
  target_date              date not null,
  -- 수집이 얼마나 됐나만 뜻한다. 정정은 상태가 아니라 corrected_at·correction_count로 남긴다 (3-5).
  status                   text not null check (status in ('pending', 'ok', 'partial', 'empty_expected', 'empty_unexpected', 'failed')),
  corrected_at             timestamptz null,
  correction_count         integer not null default 0,
  expected_rows            integer null,
  row_count                integer not null default 0,
  item_count               integer null,
  place_count              integer null,
  attempts                 smallint not null default 0,
  first_ok_at              timestamptz null,
  last_checked_at          timestamptz null,
  last_changed_at          timestamptz null,
  max_source_registered_at timestamptz null,
  stable_checks            smallint not null default 0,
  closed_at                timestamptz null,
  last_error_code          text null,
  checksum                 text null,
  note                     text null,
  primary key (source, target_date)
);
create index source_day_unsettled_idx on price.source_day (status) where status not in ('ok', 'empty_expected');

create table price.source_day_part (
  source      text not null,
  target_date date not null,
  part_kind   text not null check (part_kind in ('item', 'seller', 'store', 'fresh_panel')),
  part_key    text not null,               -- KAMIS item_cd / seller_id / entpId / 'chamga-fresh-9'
  row_count   integer not null,
  baseline    integer null,
  status      text not null check (status in ('ok', 'partial', 'missing')),
  primary key (source, target_date, part_kind, part_key),   -- 앞 두 열이 FK 인덱스를 덮는다
  foreign key (source, target_date) references price.source_day (source, target_date)
);

create table price.backfill_task (
  source          text not null check (source in ('kamis', 'ekape', 'chamga')),
  task_key        text not null,           -- 'kamis:01-211:2023', 'ekape:4304:2024-03-01'
  status          text not null check (status in ('pending', 'running', 'done', 'failed')),
  rows            integer null,
  calls           integer null,
  finished_at     timestamptz null,
  last_error_code text null,
  primary key (source, task_key)
);

-- ── 3-2 판매처·관측 위치·점포·조사 시장 ────────────────────────────────

create table price.seller (
  id      integer generated always as identity primary key,
  name    text not null unique,
  channel text not null check (channel in ('large_mart', 'department', 'ssm', 'convenience', 'traditional_market', 'online_mall')),
  note    text null
);

create table price.obs_place (
  id                integer generated always as identity primary key,
  source            text not null check (source in ('kamis', 'ekape', 'chamga')),
  kind              text not null check (kind in ('store', 'market', 'region_avg')),
  scope             text not null check (scope in ('store', 'market', 'sigungu', 'sido', 'national')),
  source_place_code text not null,         -- 참가격 entpId / KAMIS mrkt_cd / KAMIS 축산 sgg_cd / 축평원 'national'
  region_code       text null references price.region (code),   -- region_code_map으로 붙인 우리 지역 (매핑 전 null)
  first_seen_on     date null,             -- 가격 응답에서 처음·마지막으로 본 조사일. 마스터로만 아는 점포는 null
  last_seen_on      date null,
  unique (source, kind, source_place_code),
  unique (id, kind),                       -- 하위 표 복합 FK의 대상
  check ((kind = 'store') = (scope = 'store') and (kind = 'market') = (scope = 'market')),
  check ((first_seen_on is null) = (last_seen_on is null) and last_seen_on >= first_seen_on)
);
create index obs_place_region_code_idx on price.obs_place (region_code);

create table price.store (
  place_id             integer primary key,   -- (place_id, kind) FK 인덱스는 PK가 덮는다
  kind                 text not null default 'store' check (kind = 'store'),
  name                 text not null,          -- entpName
  channel              text not null check (channel in ('large_mart', 'department', 'ssm', 'convenience')),   -- BU LM·DP·SM·CS
  region_scope         text not null check (region_scope in ('local', 'national_only')),   -- 편의점 본사 4곳 = national_only
  area_code_raw        text null,              -- AR 원천값 (entpAreaCode, areaDetailCode)
  area_detail_code_raw text null,
  region_code          text null references price.region (code),
  lat                  numeric(9, 6) null,     -- xMapCoord = 위도
  lng                  numeric(9, 6) null,     -- yMapCoord = 경도
  road_addr            text null,
  jibun_addr           text null,
  status               text not null check (status in ('active', 'inactive', 'superseded')),
  missing_streak       smallint not null default 0,
  lineage_id           integer not null references price.store (place_id),   -- 재등록 사슬의 첫 점포
  foreign key (place_id, kind) references price.obs_place (id, kind),
  check ((lat is null) = (lng is null))
);
create index store_lineage_id_idx on price.store (lineage_id);
create index store_region_code_idx on price.store (region_code);

create table price.market (
  place_id          integer primary key,   -- (place_id, kind) FK 인덱스는 PK가 덮는다
  kind              text not null default 'market' check (kind = 'market'),
  name              text not null,         -- mrkt_nm
  sgg_code_raw      text not null,         -- 시장 행의 sgg_cd. 시장이 정한다
  market_type       text not null check (market_type in ('traditional', 'large_retail', 'wholesale', 'eco_channel', 'online', 'other')),
  type_source       text not null check (type_source in ('name_rule', 'operator')),
  in_official_table boolean not null,
  foreign key (place_id, kind) references price.obs_place (id, kind)
);

create table price.store_seller (
  place_id   integer not null references price.store (place_id),   -- PK 앞 열이 FK 인덱스를 덮는다
  seller_id  integer not null references price.seller (id),
  valid_from date not null,
  valid_to   date null,
  primary key (place_id, valid_from),
  check (valid_to is null or valid_to > valid_from),
  exclude using gist (place_id with =, daterange(valid_from, valid_to) with &&)
);
create index store_seller_seller_id_idx on price.store_seller (seller_id);

create table price.store_link (
  old_place_id integer not null references price.store (place_id),   -- PK 앞 열이 FK 인덱스를 덮는다
  new_place_id integer not null references price.store (place_id),
  reason       text not null check (reason in ('re_registered', 'duplicate')),
  evidence     jsonb not null,             -- 이름(띄어쓰기 무시)·도로명 주소 일치 등
  linked_on    date not null,
  linked_by    text not null,              -- 'auto' | 운영자
  primary key (old_place_id, new_place_id),
  check (old_place_id <> new_place_id)
);
create index store_link_new_place_id_idx on price.store_link (new_place_id);

create table price.region_code_map (
  source             text not null check (source in ('kamis', 'ekape', 'chamga')),
  code_class         text not null,        -- 'AR' | 'sgg' | 'region_prc_index'
  source_region_code text not null,
  valid_from         date not null,
  valid_to           date null,
  region_code        text null references price.region (code),   -- null = 지역 없음 (KAMIS 9998 온라인)
  note               text null,
  primary key (source, code_class, source_region_code, valid_from),
  check (valid_to is null or valid_to > valid_from),
  exclude using gist (source with =, code_class with =, source_region_code with =,
                      daterange(valid_from, valid_to) with &&)
);
create index region_code_map_region_code_idx on price.region_code_map (region_code);

create table price.source_master_change (
  id            bigint generated always as identity primary key,
  source        text not null check (source in ('kamis', 'ekape', 'chamga')),
  entity        text not null check (entity in ('product', 'store', 'code')),
  source_key    text not null,             -- goodId / entpId / 'AR:021800000'
  change_kind   text not null check (change_kind in ('added', 'removed', 'changed')),
  field         text null,
  old_value     text null,
  new_value     text null,
  detected_on   date not null,
  raw_object_id bigint null references price.raw_object (id),
  action        text not null check (action in ('recorded', 'mapping_reset', 'linked', 'attr_versioned', 'merged')),
  check (action = 'merged' or raw_object_id is not null)   -- 상품 병합은 운영자 작업이라 원본 파일이 없다
);
create index source_master_change_key_idx on price.source_master_change (source, entity, source_key);
create index source_master_change_raw_object_id_idx on price.source_master_change (raw_object_id);

-- ── 3-6 상품 (참가격) ──────────────────────────────────────────────────

create table price.product (
  id                integer generated always as identity primary key,   -- 재사용하지 않는다. 지우지 않는다
  name              text not null,         -- 속성 이력의 최신 값을 복사
  status            text not null check (status in ('surveyed', 'not_surveyed', 'merged')),
  registered_on     date not null,         -- 마스터나 가격 응답에서 처음 본 날
  first_price_on    date null,             -- 처음 가격이 관측된 조사일
  last_price_on     date null,
  missing_streak    smallint not null default 0,
  status_changed_on date null,
  merged_into       integer null references price.product (id),   -- FK 인덱스 생략: 지우지 않고 수백 행이다
  check ((first_price_on is null) = (last_price_on is null) and first_price_on <= last_price_on),
  check ((status = 'merged') = (merged_into is not null) and merged_into <> id)
);

create table price.product_source_key (
  source_item_id integer not null references price.source_item (id),   -- PK·exclusion이 덮는다
  valid_from     date not null,
  valid_to       date null,
  product_id     integer not null references price.product (id),
  primary key (source_item_id, valid_from),
  check (valid_to is null or valid_to > valid_from),
  exclude using gist (source_item_id with =, daterange(valid_from, valid_to) with &&)
);
create index product_source_key_product_id_idx on price.product_source_key (product_id);

create table price.product_attr_history (
  product_id    integer not null references price.product (id),   -- PK·exclusion이 덮는다
  valid_from    date not null,
  valid_to      date null,
  name          text not null,             -- goodName
  total_qty     numeric not null,          -- goodTotalCnt
  total_unit    text not null,             -- goodTotalDivCode (UT 코드)
  al_code       text not null,             -- goodSmlclsCode (AL 소분류)
  maker_code    text null,                 -- productEntpCode
  detail_mean   text null,
  raw_object_id bigint not null references price.raw_object (id),
  primary key (product_id, valid_from),
  check (valid_to is null or valid_to > valid_from),
  exclude using gist (product_id with =, daterange(valid_from, valid_to) with &&)
);
create index product_attr_history_raw_object_id_idx on price.product_attr_history (raw_object_id);

create table price.al_variety_rule (
  al_code      text primary key,
  variety_id   integer not null,
  spec_id      integer not null,           -- 규격을 가르지 않으면 기본 규격
  unit_rule_id integer not null references price.unit_rule (id),   -- FK 인덱스 생략: unit_rule은 지우지 않는다
  note         text null,
  foreign key (variety_id, spec_id) references price.spec (variety_id, id)
);
create index al_variety_rule_variety_spec_idx on price.al_variety_rule (variety_id, spec_id);

create table price.product_variety_map (
  product_id   integer not null references price.product (id),   -- PK·exclusion이 덮는다
  valid_from   date not null,
  valid_to     date null,
  status       text not null check (status in ('pending', 'mapped', 'ignored')),
  variety_id   integer null,
  spec_id      integer null,
  unit_rule_id integer null references price.unit_rule (id),   -- FK 인덱스 생략: unit_rule은 지우지 않는다
  origin       text not null check (origin in ('al_rule', 'operator')),
  primary key (product_id, valid_from),
  foreign key (variety_id, spec_id) references price.spec (variety_id, id),
  check (status <> 'mapped' or (variety_id is not null and spec_id is not null and unit_rule_id is not null)),
  check ((variety_id is null) = (spec_id is null)),
  check (valid_to is null or valid_to > valid_from),
  exclude using gist (product_id with =, daterange(valid_from, valid_to) with &&)
);
create index product_variety_map_variety_spec_idx on price.product_variety_map (variety_id, spec_id);

-- ── 3-1 매핑 ─────────────────────────────────────────────────────────

create table price.source_code_map (
  id             integer generated always as identity primary key,
  source_item_id integer not null references price.source_item (id),   -- exclusion이 만드는 GiST 인덱스가 덮는다
  valid_from     date not null,
  valid_to       date null,
  status         text not null check (status in ('pending', 'mapped', 'ignored')),
  variety_id     integer null,
  spec_id        integer null,
  unit_rule_id   integer null references price.unit_rule (id),   -- FK 인덱스 생략: unit_rule은 지우지 않는다
  role           text not null default 'primary' check (role in ('primary', 'secondary')),   -- 출처 중복 시 대표 여부
  note           text null,
  updated_at     timestamptz not null default now(),
  foreign key (variety_id, spec_id) references price.spec (variety_id, id),
  check (status <> 'mapped' or (variety_id is not null and spec_id is not null and unit_rule_id is not null)),
  check ((variety_id is null) = (spec_id is null)),
  check (valid_to is null or valid_to > valid_from),
  exclude using gist (source_item_id with =, daterange(valid_from, valid_to) with &&)
);
create index source_code_map_variety_spec_idx on price.source_code_map (variety_id, spec_id);
create index source_code_map_pending_idx on price.source_code_map (status) where status = 'pending';

create table price.alias (
  id         integer generated always as identity primary key,
  text       text not null,
  item_id    integer null references price.item (id),
  variety_id integer null references price.variety (id),
  check (num_nonnulls(item_id, variety_id) = 1)
);
create index alias_item_id_idx on price.alias (item_id);
create index alias_variety_id_idx on price.alias (variety_id);
create index alias_lower_text_idx on price.alias (lower(text));

create table price.variety_seasonal_map (
  variety_id       integer not null references price.variety (id),   -- PK 앞 열이 덮는다
  seasonal_food_id text not null,          -- packages/seasonal의 품종 id
  primary key (variety_id, seasonal_food_id)
);
create index variety_seasonal_map_seasonal_food_id_idx on price.variety_seasonal_map (seasonal_food_id);

-- ── 3-3 ② 관측값 ─────────────────────────────────────────────────────

create table price.observation (
  source_item_id       integer not null references price.source_item (id),   -- PK 앞 열이 덮는다
  obs_date             date not null,
  place_id             integer not null references price.obs_place (id),     -- FK 인덱스 생략: 위치는 지우지 않는다
  price_tier           text not null check (price_tier in ('retail', 'wholesale')),
  obs_kind             text not null check (obs_kind in ('quote_sample', 'quote_aggregate', 'shelf_price')),
  product_id           integer null references price.product (id),           -- 참가격만. 부분 인덱스가 덮는다
  variety_id           integer null,       -- 적재 시점의 매핑. 매핑 전이면 null
  spec_id              integer null,
  price_raw            integer not null check (price_raw > 0),   -- 원천 가격 (원). 참가격은 행사 반영가
  qty_raw              numeric null,
  unit_raw             text null,
  price_per_base       numeric(12, 2) null,   -- 기준 단위 가격. 환산 실패·매핑 전이면 null
  unit_rule_id         integer null references price.unit_rule (id),   -- FK 인덱스 생략: unit_rule은 지우지 않는다
  promo_discount       boolean null,       -- true/false/null(모름)
  promo_one_plus_one   boolean null,
  promo_from           date null,
  promo_to             date null,
  flags                text[] null,        -- 'carried_over' 'outlier' 'duplicate_of_ekape' 'unit_mismatch' 'one_plus_one_unverified'
  source_registered_at timestamptz null,
  first_seen_at        timestamptz not null,   -- last_seen_at은 두지 않는다 (3-0)
  revision             smallint not null default 0,
  raw_object_id        bigint not null references price.raw_object (id),   -- BRIN이 원본 하나에서 다시 적재를 받친다
  primary key (source_item_id, obs_date, place_id),
  foreign key (variety_id, spec_id) references price.spec (variety_id, id),
  check (obs_kind <> 'shelf_price' or product_id is not null),
  check ((variety_id is null) = (spec_id is null))
) with (fillfactor = 90, autovacuum_vacuum_scale_factor = 0.05);
create index observation_variety_spec_date_idx on price.observation (variety_id, spec_id, obs_date) where variety_id is not null;
create index observation_product_date_idx on price.observation (product_id, obs_date) where product_id is not null;
create index observation_obs_date_brin on price.observation using brin (obs_date);
create index observation_raw_object_id_brin on price.observation using brin (raw_object_id);

create table price.observation_revision (
  id                       bigint generated always as identity primary key,
  -- 관측값 PK. FK는 두지 않는다 (관측값이 보존 기간으로 지워져도 이력은 남긴다)
  source_item_id           integer not null,
  obs_date                 date not null,
  place_id                 integer not null,
  revision                 smallint not null,   -- 바뀐 뒤 번호
  old_price_raw            integer null,
  new_price_raw            integer null,
  old_promo                jsonb null,          -- {"discount":true,"one_plus_one":null,"from":…,"to":…}
  new_promo                jsonb null,
  old_source_registered_at timestamptz null,
  new_source_registered_at timestamptz null,
  rebuild_result           text null check (rebuild_result in ('rebuilt', 'kept', 'not_aggregated')),
  detected_at              timestamptz not null,
  raw_object_id            bigint not null references price.raw_object (id)
);
create index observation_revision_key_idx on price.observation_revision (source_item_id, obs_date);
create index observation_revision_raw_object_id_idx on price.observation_revision (raw_object_id);

create table price.reference_observation (
  source_item_id integer not null references price.source_item (id),   -- PK 앞 열이 덮는다
  place_id       integer not null references price.obs_place (id),     -- FK 인덱스 생략: 축평원 전국 한 곳, 지우지 않는다
  ref_type       text not null check (ref_type in ('normal_year')),
  ref_date       date not null,            -- 요청 standYmd
  value_raw      integer not null,
  unit_raw       text not null,
  first_seen_at  timestamptz not null,
  revision       smallint not null default 0,
  raw_object_id  bigint not null references price.raw_object (id),
  primary key (source_item_id, place_id, ref_type, ref_date)
);
create index reference_observation_raw_object_id_idx on price.reference_observation (raw_object_id);

-- ── 3-4 ③ 집계·판정 ──────────────────────────────────────────────────

create table price.daily_quote (
  variety_id       integer not null,
  spec_id          integer not null,
  price_tier       text not null check (price_tier in ('retail', 'wholesale')),
  basis            text not null check (basis in ('quote', 'shelf_price')),
  scope_key        text not null,          -- 'national' | 'market_type:traditional' | 'channel:large_mart' | 'region:<code>'
  obs_date         date not null,
  value            numeric(12, 2) not null,
  median           numeric(12, 2) null,
  min              numeric(12, 2) null,
  max              numeric(12, 2) null,
  n                integer not null,
  n_sellers        integer null,
  sources          text[] not null,
  promo_excluded_n integer not null default 0,
  stale_days       smallint null,
  meets_min_n      boolean null,
  flags            text[] null,
  calc_version     text not null,
  computed_at      timestamptz not null,
  primary key (variety_id, spec_id, price_tier, basis, scope_key, obs_date),   -- 복합 FK도 덮는다
  foreign key (variety_id, spec_id) references price.spec (variety_id, id)
);
create index daily_quote_obs_date_idx on price.daily_quote (obs_date);

create table price.product_daily_summary (
  product_id        integer not null references price.product (id),   -- PK 앞 열이 덮는다
  scope_key         text not null,         -- 'national' | 'channel:<업태>' | 'seller:<seller_id>' | 'region:<code>'
  obs_date          date not null,
  min               integer null,
  median            numeric(12, 2) null,
  max               integer null,
  median_excl_promo numeric(12, 2) null,
  seller_avg        numeric(12, 2) null,   -- 판매처별 평균을 다시 평균 낸 2단 평균
  n_stores          integer not null,
  n_sellers         integer null,
  promo_n           integer not null,
  promo_unknown_n   integer not null,
  meets_min_n       boolean null,
  computed_at       timestamptz not null,
  primary key (product_id, scope_key, obs_date)
);
create index product_daily_summary_obs_date_idx on price.product_daily_summary (obs_date);

create table price.reference_price (
  variety_id  integer not null,
  spec_id     integer not null,
  ref_type    text not null check (ref_type in ('normal_year', 'year_ago', 'month_ago')),
  source      text not null check (source in ('ekape', 'computed')),
  scope_key   text not null,
  ref_date    date not null,
  value       numeric(12, 2) not null,
  method      text not null,
  computed_at timestamptz not null,
  primary key (variety_id, spec_id, ref_type, source, scope_key, ref_date),   -- 복합 FK도 덮는다
  foreign key (variety_id, spec_id) references price.spec (variety_id, id)
);

create table price.usual_price (
  variety_id integer not null,
  spec_id    integer not null,
  as_of      date not null,
  value      numeric(12, 2) not null,
  method     text not null,
  components jsonb not null,
  confidence smallint null,
  primary key (variety_id, spec_id, as_of),   -- 복합 FK도 덮는다
  foreign key (variety_id, spec_id) references price.spec (variety_id, id)
);

create table price.calc_param (
  key        text primary key,
  value      jsonb null,
  status     text not null check (status in ('decided', 'placeholder')),
  decided_in text null,
  note       text null
);

create table price.judgment_batch (
  id          bigint generated always as identity primary key,
  started_at  timestamptz not null,
  finished_at timestamptz null,
  status      text not null check (status in ('building', 'ready', 'failed')),
  trigger     text not null,
  note        text null
);

create table price.judgment_current (
  singleton  boolean primary key default true check (singleton),   -- 한 줄짜리 포인터
  batch_id   bigint not null references price.judgment_batch (id),   -- FK 인덱스 생략: 한 줄짜리 표
  swapped_at timestamptz not null
);

create table price.judgment_snapshot (
  batch_id    bigint not null references price.judgment_batch (id) on delete cascade,   -- PK 앞 열이 덮는다
  variety_id  integer not null,
  spec_id     integer not null,
  as_of       date not null,
  today_price numeric(12, 2) null,
  usual       numeric(12, 2) null,
  verdict     text null check (verdict in ('cheap', 'normal', 'expensive')),   -- 판정 못 하면 null
  diff_pct    numeric(6, 2) null,
  confidence  smallint null,
  payload     jsonb not null,              -- 4-1 모양 그대로
  primary key (batch_id, variety_id, spec_id),
  -- FK 인덱스 생략: 규격 행은 지우지 않는다. 판정은 묶음(batch_id)으로만 읽고 지운다
  foreign key (variety_id, spec_id) references price.spec (variety_id, id)
);

-- 화면이 읽는 현재 판정. 읽는 롤의 권한과 RLS가 그대로 적용된다.
create view price.current_judgment with (security_invoker = true) as
  select s.*
  from price.judgment_snapshot s
  join price.judgment_current c on c.batch_id = s.batch_id;
