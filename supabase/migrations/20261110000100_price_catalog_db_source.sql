-- 카탈로그 원본을 코드에서 DB로 옮긴다 (catalog-scale/04, ADR 0005).
-- 분류 표(카테고리·품목·품종·규격·제철 매핑)는 이미 DB에 있다. 코드에만 있던 것을 표로 옮긴다:
--   1. 아직 들어온 적 없는 원천 키를 미리 정해 둔 규칙(catalog_key_rule). 철마다 코드가 바뀌는 KAMIS 품종 `*`, 철이 와야 처음 오는 품목,
--      일부러 잇지 않는 키(제외), 근거가 없어 미룬 키(보류). 적재는 처음 본 키를 이 표로 잇는다.
--   2. 순서(item.sort, variety.sort)와 쌀 같은 품종의 가격 편차 안내(variety.price_spread)
-- 그리고 상품이 언제나 품목에 속하도록 product.item_id를 더한다 (GLOSSARY "상품", catalog-scale/01).
-- 제안(catalog_proposal)과 변경 기록(catalog_change)은 로컬 어드민(07)과 승인 적용(08)이 쓴다. 지금은 표만 만든다.
-- 고치는 길은 소유자 접속뿐이다. ingest_writer는 읽기만 한다.

alter table price.item add column sort smallint null;
alter table price.variety add column sort smallint null;
alter table price.variety add column price_spread text null check (price_spread in ('brand'));
alter table price.product add column item_id integer null references price.item (id);
create index product_item_id_idx on price.product (item_id);

comment on column price.item.sort is '카탈로그 전체에서 보이는 순서 (작을수록 앞, 카테고리 순서와 함께 쓴다). 정하지 않았으면 null';
comment on column price.variety.sort is '카탈로그 전체에서 보이는 순서 (작을수록 앞). 정하지 않았으면 null';
comment on column price.variety.price_spread is '같은 품종 안에서도 값이 크게 갈리는 이유. brand: 품종(신동진 등)·브랜드·도정일마다 달라 화면이 판정 아래 안내 한 줄을 붙인다 (judgment.md 5-3). 없으면 null';
comment on column price.product.item_id is '상품이 속한 품목 (GLOSSARY "상품": 언제나 품목에 속하고 품종은 선택). 아직 분류하지 않았으면 null';

create table price.catalog_key_rule (
  id           integer generated always as identity primary key,
  source       text not null check (source in ('kamis', 'ekape', 'chamga')),
  key_pattern  text not null,
  action       text not null check (action in ('map', 'ignore', 'hold')),
  variety_id   integer null,
  spec_id      integer null,
  unit_rule_id integer null references price.unit_rule (id),   -- FK 인덱스 생략: unit_rule은 몇 행이고 지우지 않는다
  role         text null check (role in ('primary', 'secondary')),
  reason       text null,
  unique (source, key_pattern),
  foreign key (variety_id, spec_id) references price.spec (variety_id, id),
  check ((action = 'map') = (variety_id is not null and spec_id is not null and unit_rule_id is not null and role is not null)),
  check (action = 'map' or reason is not null)
);
create index catalog_key_rule_spec_idx on price.catalog_key_rule (variety_id, spec_id);

comment on table price.catalog_key_rule is '원천 키를 어느 규격에 이을지 미리 정한 규칙 (ADR 0005). 적재가 처음 본 키를 이 표로 잇고, 없으면 source_code_map을 pending으로 둔다. 소유자만 고친다';
comment on column price.catalog_key_rule.id is '규칙 번호 (재사용하지 않는다)';
comment on column price.catalog_key_rule.source is '출처: kamis, ekape, chamga';
comment on column price.catalog_key_rule.key_pattern is 'KAMIS `품목-품종-등급`(구분 01 소매만, 품종 `*`는 철마다 바뀌는 코드), 축평원 `축종-품목코드-구분명`, 참가격 goodId';
comment on column price.catalog_key_rule.action is 'map: 규격에 잇는다. ignore: 일부러 잇지 않는다(그 키의 매핑을 ignored로). hold: 근거가 없어 미룬다(pending으로 둔다)';
comment on column price.catalog_key_rule.variety_id is '이을 품종 (map일 때만)';
comment on column price.catalog_key_rule.spec_id is '이을 규격 (map일 때만)';
comment on column price.catalog_key_rule.unit_rule_id is '기준 단위로 나눌 단위 규칙 (map일 때만)';
comment on column price.catalog_key_rule.role is 'primary: 시세에 센다. secondary: 같은 규격에 대표 출처가 따로 있어(축산은 축평원) 세지 않는다 (pipeline 6-1). map일 때만';
comment on column price.catalog_key_rule.reason is '이렇게 정한 이유. ignore·hold면 꼭 적는다';

create table price.catalog_proposal (
  id          bigint generated always as identity primary key,
  source      text not null check (source in ('kamis', 'ekape', 'chamga')),
  key_pattern text not null,
  kind        text not null check (kind in ('map', 'new_spec', 'new_variety', 'product_item', 'ignore', 'hold', 'merge')),
  proposal    jsonb not null,
  rationale   text not null,
  confidence  text null check (confidence in ('high', 'medium', 'low')),
  proposed_by text not null,
  status      text not null check (status in ('proposed', 'approved', 'rejected', 'applied')),
  created_at  timestamptz not null default now(),
  decided_at  timestamptz null,
  check ((status = 'proposed') = (decided_at is null))
);
create unique index catalog_proposal_open_idx on price.catalog_proposal (source, key_pattern) where status in ('proposed', 'approved');

comment on table price.catalog_proposal is '카탈로그 변경 제안 (catalog-scale/06). 로컬 에이전트가 쓰고 사람이 어드민에서 승인한다. 승인 전에는 매핑·화면에 영향이 없다';
comment on column price.catalog_proposal.id is '제안 번호 (재사용하지 않는다)';
comment on column price.catalog_proposal.source is '제안 대상 원천 키의 출처';
comment on column price.catalog_proposal.key_pattern is '제안 대상 원천 키 (catalog_key_rule.key_pattern과 같은 표기). 같은 키에 열린 제안은 하나';
comment on column price.catalog_proposal.kind is 'map: 기존 규격에 잇기, new_spec: 새 규격, new_variety: 새 품종, product_item: 상품의 품목 정하기, ignore: 제외, hold: 보류, merge: 묶기';
comment on column price.catalog_proposal.proposal is '제안 내용 (JSON). 모양은 kind마다 다르다 (예: map이면 {"variety": slug, "spec": slug})';
comment on column price.catalog_proposal.rationale is '근거 한 줄 (원문 이름·단위·출처 분류 중 무엇을 보고 정했나)';
comment on column price.catalog_proposal.confidence is '제안한 쪽의 확신: high, medium, low. 모르면 null';
comment on column price.catalog_proposal.proposed_by is '제안한 주체 (예: agent:catalog-propose, 사람 이름)';
comment on column price.catalog_proposal.status is 'proposed: 승인 대기, approved: 승인됨(적용 전), rejected: 반려, applied: 적용됨';
comment on column price.catalog_proposal.created_at is '제안한 시각';
comment on column price.catalog_proposal.decided_at is '승인·반려한 시각. 대기 중이면 null';

create table price.catalog_change (
  id          bigint generated always as identity primary key,
  changed_at  timestamptz not null default now(),
  actor       text not null,
  target      text not null,
  target_key  text not null,
  action      text not null check (action in ('insert', 'update', 'delete')),
  before      jsonb null,
  after       jsonb null,
  proposal_id bigint null references price.catalog_proposal (id),
  check ((action = 'insert') = (before is null) and (action = 'delete') = (after is null))
);
create index catalog_change_proposal_id_idx on price.catalog_change (proposal_id);

comment on table price.catalog_change is '카탈로그 변경 기록 (ADR 0005). git 기록이 하던 감사·되돌리기를 맡는다. 승인 적용(08)과 가져오기(catalog import)가 남긴다';
comment on column price.catalog_change.id is '변경 기록 번호 (재사용하지 않는다)';
comment on column price.catalog_change.changed_at is '바꾼 시각';
comment on column price.catalog_change.actor is '바꾼 주체 (예: import:snapshot.json, admin)';
comment on column price.catalog_change.target is '바뀐 표 이름 (예: variety, catalog_key_rule)';
comment on column price.catalog_change.target_key is '바뀐 행을 가리키는 바깥 키 (예: 품종 slug, `kamis:111-10-04`)';
comment on column price.catalog_change.action is 'insert, update, delete';
comment on column price.catalog_change.before is '바뀌기 전 값 (JSON). insert면 null';
comment on column price.catalog_change.after is '바뀐 뒤 값 (JSON). delete면 null';
comment on column price.catalog_change.proposal_id is '이 변경을 낳은 제안. 제안 없이 바꿨으면 null';

grant select on price.catalog_key_rule, price.catalog_proposal, price.catalog_change to ingest_writer;
alter table price.catalog_key_rule enable row level security;
alter table price.catalog_proposal enable row level security;
alter table price.catalog_change enable row level security;
create policy ingest_rw on price.catalog_key_rule for all to ingest_writer using (true) with check (true);
create policy ingest_rw on price.catalog_proposal for all to ingest_writer using (true) with check (true);
create policy ingest_rw on price.catalog_change for all to ingest_writer using (true) with check (true);
