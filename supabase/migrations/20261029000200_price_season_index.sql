-- 계절비율 표 (judgment.md 1-3·1-4, 로드맵 ②).
-- 평소가 = 수준 × 계절비율. 계절비율은 품종·규격마다 한 해의 날(0~364)별 값 하나다.
-- judgment.md 1-4는 처음에 reference_price(ref_type season_index)에 두려 했다. 하지만 그 표의 value는 원 단위(소수 둘째 자리)이고
-- 키가 날짜다. 비율과 한 해의 날을 담기에 맞지 않아 따로 둔다 (2026-10-29).
-- 지금 쓰는 판 하나만 둔다. 다시 만들면 품종·규격의 행을 모두 바꾼다 (재료인 daily_quote national은 영구라 언제든 다시 만든다).
create table price.season_index (
  variety_id  integer not null,
  spec_id     integer not null,
  slot        smallint not null check (slot between 0 and 364),
  value       numeric(8, 4) not null check (value > 0),
  n           integer not null check (n > 0),
  as_of       date not null,
  method      text not null,
  computed_at timestamptz not null,
  primary key (variety_id, spec_id, slot),   -- 복합 FK도 덮는다
  foreign key (variety_id, spec_id) references price.spec (variety_id, id)
);

grant select, insert, update, delete on price.season_index to ingest_writer;
alter table price.season_index enable row level security;
create policy ingest_rw on price.season_index for all to ingest_writer using (true) with check (true);

comment on table price.season_index is '계절비율: 품종·규격의 한 해 날별 "이맘때 시세 ÷ 그해 연중앙값" (judgment.md 1-3). 평소가 = 수준 × 계절비율. 지금 쓰는 판 하나만 둔다';
comment on column price.season_index.variety_id is '품종';
comment on column price.season_index.spec_id is '규격';
comment on column price.season_index.slot is '한 해의 날 번호 0~364 (윤년이 아닌 해 기준, 1월 1일 = 0. 2월 29일은 2월 28일과 같은 번호)';
comment on column price.season_index.value is '계절비율 (비율, 1 = 한 해 평소와 같음). 앞뒤 7일 창 안 비율의 중앙값';
comment on column price.season_index.n is '중앙값을 낸 비율 수 (3년 × 15일이면 최대 45)';
comment on column price.season_index.as_of is '기준일 (KST): 이 날을 끝으로 하는 3년의 소매 national 시세(daily_quote)로 만들었다';
comment on column price.season_index.method is '계산 방법 이름 (예: median-ratio-3y-7d-1)';
comment on column price.season_index.computed_at is '계산한 시각';

comment on column price.usual_price.method is '계산 방법 이름. level-x-season-1: 수준(최근 26주) × 계절비율 (judgment.md 1-3). 로컬 샘플은 fixture_median';
comment on column price.usual_price.components is '계산 재료 (JSON). level-x-season-1: level 수준(원), season_index 그날 계절비율, level_weeks, season_years, window_days. 가장 최근 행에는 band(판정 구간 low·high, basis variety|category)';
