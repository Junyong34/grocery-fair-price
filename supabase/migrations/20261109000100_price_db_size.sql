-- DB 크기 기록 (catalog-scale/03). KAMIS 워크플로가 매일 수집 뒤에 한 행 남기고(size 명령), heartbeat가 문턱을 넘으면 알린다.
-- Free 플랜은 500MB를 넘으면 읽기 전용이 되어 수집이 멈춘다. 2026-11-09 운영 369MB.
-- 행은 하루 하나라 지우지 않는다 (1년 365행, tables jsonb 약 2KB).
create table price.db_size (
  taken_at timestamptz not null default now() primary key,
  db_bytes bigint not null check (db_bytes > 0),
  tables   jsonb not null
);

grant select, insert on price.db_size to ingest_writer;
alter table price.db_size enable row level security;
create policy ingest_rw on price.db_size for all to ingest_writer using (true) with check (true);

comment on table price.db_size is 'DB 크기 기록: 수집 실행 뒤 하루 한 행 (catalog-scale/03). 문턱은 calc_param db.size_alert_mb';
comment on column price.db_size.taken_at is '잰 시각';
comment on column price.db_size.db_bytes is 'pg_database_size(현재 DB) 바이트. 지운 행의 자리는 파일 크기로 돌아오지 않으므로 보존 정리 뒤에도 줄지 않을 수 있다';
comment on column price.db_size.tables is 'price 스키마 표별 {"표 이름": {"bytes": pg_total_relation_size, "rows": pg_class.reltuples 추정 행 수}}. 통계가 없는 표는 rows 0';

insert into price.calc_param (key, value, status, decided_in, note) values
  ('db.size_alert_mb', '400', 'decided', 'catalog-scale/03', 'DB 크기가 이 MB 이상이면 heartbeat가 알린다. Free 500MB의 80%. 플랜을 바꾸면 그 용량의 80%로 고친다 (catalog-scale/02)');
