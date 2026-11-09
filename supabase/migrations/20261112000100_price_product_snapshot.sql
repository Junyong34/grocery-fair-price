-- 참가격 상품의 화면용 payload (catalog-scale/09, ADR 0004).
-- 판정과 같은 묶음(judgment_batch)에 쓰고 같은 포인터(judgment_current)로 함께 공개한다. 판정 배치가 묶음마다 처음부터 다시 쓴다.
-- 상품은 판정을 내지 않으므로 judgment_snapshot(품종·규격·판정 열)과 따로 둔다.

create table price.product_snapshot (
  batch_id   bigint not null references price.judgment_batch (id) on delete cascade,   -- PK 앞 열이 덮는다
  product_id integer not null references price.product (id),   -- FK 인덱스 생략: 상품은 지우지 않는다. 묶음으로만 읽고 지운다
  surveyed_on date not null,
  status     text not null check (status in ('active', 'stale', 'discontinued')),
  payload    jsonb not null,
  primary key (batch_id, product_id)
);

-- 화면이 읽는 현재 상품 payload. 읽는 롤의 권한과 RLS가 그대로 적용된다.
create view price.current_product with (security_invoker = true) as
  select s.*
  from price.product_snapshot s
  join price.judgment_current c on c.batch_id = s.batch_id;

comment on table price.product_snapshot is '참가격 상품별 화면 payload (묶음 단위, catalog-scale/09). 판정은 없다. 화면은 뷰 current_product로 현재 묶음만 읽는다';
comment on column price.product_snapshot.batch_id is '속한 판정 묶음';
comment on column price.product_snapshot.product_id is '상품';
comment on column price.product_snapshot.surveyed_on is '이 payload의 최근 조사일 (KST, 상품 요약의 전국 범위 마지막 날)';
comment on column price.product_snapshot.status is '상품 상태: active 최근 조사에 있다, stale 최근 조사에서 빠졌다(묶음의 최근 조사일보다 28일 넘게 이르다), discontinued 참가격이 조사를 멈췄다';
comment on column price.product_snapshot.payload is '화면이 읽는 상품 payload 그대로 (JSON, packages/price의 productDetailSchema 모양)';

comment on view price.current_product is '현재 묶음(judgment_current)의 상품 payload. security_invoker라 읽는 롤의 권한과 RLS가 적용된다. 화면은 이것을 읽는다';
comment on column price.current_product.batch_id is '현재 판정 묶음';
comment on column price.current_product.product_id is '상품';
comment on column price.current_product.surveyed_on is '최근 조사일 (KST)';
comment on column price.current_product.status is '상품 상태: active, stale, discontinued';
comment on column price.current_product.payload is '화면이 읽는 상품 payload (JSON)';

grant select, insert, update, delete on price.product_snapshot to ingest_writer;
grant select on price.current_product to ingest_writer;
grant select on price.product_snapshot, price.current_product to web_reader;

alter table price.product_snapshot enable row level security;
create policy ingest_rw on price.product_snapshot for all to ingest_writer using (true) with check (true);
create policy web_select on price.product_snapshot for select to web_reader using (true);
