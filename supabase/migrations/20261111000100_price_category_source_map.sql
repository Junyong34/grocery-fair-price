-- 출처 분류 → 카테고리 대응표 (catalog-scale/05, GLOSSARY "카테고리").
-- 출처마다 분류가 다르다(참가격 AL 소분류, KAMIS 부류, 축평원 축종). 새 원천 키·상품이 들어오면 이 표로 카테고리를 먼저 정하고,
-- AI 제안(06)은 그 카테고리 안에서 품목·품종을 고른다. 화면 분류로 출처 분류를 그대로 쓰지 않는다.
-- 원본은 이 표이고 저장소 사본(snapshot.json의 sourceCategories)이 백업이다 (ADR 0005). 고치는 길은 소유자 접속뿐이다.

create table price.category_source_map (
  id           integer generated always as identity primary key,
  source       text not null check (source in ('kamis', 'ekape', 'chamga')),
  source_class text not null,
  class_name   text not null,
  category_id  integer not null references price.category (id),
  item_id      integer null references price.item (id),   -- FK 인덱스 생략: 수백 행이고 품목을 지우지 않는다
  note         text null,
  unique (source, source_class)
);
create index category_source_map_category_id_idx on price.category_source_map (category_id);

comment on table price.category_source_map is '출처 분류를 우리 카테고리에 잇는 대응표 (catalog-scale/05). 새 원천 키·상품의 카테고리를 먼저 정하는 데 쓴다. 소유자만 고친다';
comment on column price.category_source_map.id is '대응 번호 (재사용하지 않는다)';
comment on column price.category_source_map.source is '출처: kamis, ekape, chamga';
comment on column price.category_source_map.source_class is '출처 분류 코드. 참가격 AL 소분류(goodSmlclsCode, 예 030201001), KAMIS 부류(ctgry_cd, 예 200), 축평원 축종(judgeKind, 예 4304)';
comment on column price.category_source_map.class_name is '출처 분류 이름 그대로 (예 라면, 채소류, 돼지). 사람이 읽기 위한 값';
comment on column price.category_source_map.category_id is '이 출처 분류가 들어갈 카테고리';
comment on column price.category_source_map.item_id is '이 출처 분류가 곧 한 품목이면 그 품목. 정하지 않았거나 여러 품목에 걸치면 null';
comment on column price.category_source_map.note is '이렇게 정한 이유나 예외 (예: KAMIS 특용작물은 품목마다 카테고리가 다르다). 없으면 null';

grant select on price.category_source_map to ingest_writer;
alter table price.category_source_map enable row level security;
create policy ingest_rw on price.category_source_map for all to ingest_writer using (true) with check (true);
