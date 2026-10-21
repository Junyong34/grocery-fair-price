-- 로컬 기준 데이터. `supabase db reset`이 마이그레이션 뒤에 소유자(postgres)로 넣는다.
-- 운영 DB에는 자동으로 들어가지 않는다 (db push는 시드를 넣지 않는다).
--   - 지역: 전국과 시도. 시군구는 법정동 코드 파일을 들여올 때 더한다.
--   - 분류: 저장 샘플(grocery-price/reference/public-data/samples/)에 나오는 품종만 넣은 임시 목록이다.
--     운영 품종 목록은 p3-variety-catalog/01이 정한다.
--   - 환산 규칙 same_unit v1, 판매처 몇 곳.
-- 샘플 응답으로 만든 관측값·집계 테스트 데이터는 packages/price-db의 load-samples가 ingest_writer로 넣는다.

-- ── 지역 (pipeline.md 6-1: 법정동 코드 앞자리, 전국 '00') ─────────────────

insert into price.region (code, name, level, parent_code) values
  ('00', '전국', 'nation', null);

insert into price.region (code, name, level, parent_code) values
  ('11', '서울특별시', 'sido', '00'),
  ('26', '부산광역시', 'sido', '00'),
  ('27', '대구광역시', 'sido', '00'),
  ('28', '인천광역시', 'sido', '00'),
  ('29', '광주광역시', 'sido', '00'),
  ('30', '대전광역시', 'sido', '00'),
  ('31', '울산광역시', 'sido', '00'),
  ('36', '세종특별자치시', 'sido', '00'),
  ('41', '경기도', 'sido', '00'),
  ('43', '충청북도', 'sido', '00'),
  ('44', '충청남도', 'sido', '00'),
  ('46', '전라남도', 'sido', '00'),
  ('47', '경상북도', 'sido', '00'),
  ('48', '경상남도', 'sido', '00'),
  ('50', '제주특별자치도', 'sido', '00'),
  ('51', '강원특별자치도', 'sido', '00'),
  ('52', '전북특별자치도', 'sido', '00'),
  -- 표준 코드를 아직 확인하지 못했다. 확인 전까지 임시 코드 (6-1)
  ('T1', '전남광주통합특별시', 'sido', '00');

-- 옛 광주·전남 코드는 통합 시도로 잇는다. 원천의 옛 코드도 region_code_map에서 T1로 보낸다 (3-2).
update price.region set successor_code = 'T1' where code in ('29', '46');

-- ── 분류 (임시 목록) ───────────────────────────────────────────────────

insert into price.category (slug, name, sort) values
  ('vegetable', '채소', 1),
  ('fruit', '과일', 2),
  ('seafood', '수산', 3),
  ('meat', '축산', 4),
  ('processed', '가공식품', 5);

insert into price.item (category_id, slug, name)
select c.id, v.slug, v.name
from (values
  ('vegetable', 'baechu', '배추'),
  ('vegetable', 'hobak', '호박'),
  ('fruit', 'sagwa', '사과'),
  ('seafood', 'godeungeo', '고등어'),
  ('meat', 'pork', '돼지고기'),
  ('meat', 'beef', '소고기'),
  ('meat', 'egg', '계란')
) v (category_slug, slug, name)
join price.category c on c.slug = v.category_slug;

insert into price.variety (item_id, slug, name, base_unit, base_unit_qty, status)
select i.id, v.slug, v.name, v.base_unit, v.base_unit_qty, 'active'
from (values
  ('baechu', 'baechu', '배추', 'ea', 1),
  ('hobak', 'aehobak', '애호박', 'ea', 1),
  ('sagwa', 'sagwa-hongro', '사과(홍로)', 'ea', 1),
  ('godeungeo', 'godeungeo-salted', '고등어(염장)', 'ea', 1),
  ('pork', 'pork-belly-kr', '국산 삼겹살', 'g', 100),
  ('pork', 'pork-neck-kr', '국산 목심', 'g', 100),
  ('beef', 'hanwoo-sirloin', '한우 등심', 'g', 100),
  ('egg', 'egg', '계란', 'ea', 30)
) v (item_slug, slug, name, base_unit, base_unit_qty)
join price.item i on i.slug = v.item_slug;

insert into price.spec (variety_id, slug, name, is_default, sort)
select va.id, s.slug, s.name, s.is_default, s.sort
from (values
  ('baechu', 'top', '상품', true, 1),
  ('aehobak', 'top', '상품', true, 1),
  ('sagwa-hongro', 'top', '상품', true, 1),
  ('godeungeo-salted', 'default', '기본', true, 1),
  ('pork-belly-kr', 'default', '기본', true, 1),
  ('pork-neck-kr', 'default', '기본', true, 1),
  ('hanwoo-sirloin', 'grade-1plus', '1+등급', false, 1),
  ('hanwoo-sirloin', 'grade-1', '1등급', true, 2),
  ('egg', 'xl', '특란', true, 1)
) s (variety_slug, slug, name, is_default, sort)
join price.variety va on va.slug = s.variety_slug;

insert into price.alias (text, item_id, variety_id)
select a.text, i.id, va.id
from (values
  ('호박', 'hobak', null),
  ('고랭지배추', null, 'baechu'),
  ('대패삼겹', null, 'pork-belly-kr'),
  ('목살', null, 'pork-neck-kr'),
  ('달걀', 'egg', null)
) a (text, item_slug, variety_slug)
left join price.item i on i.slug = a.item_slug
left join price.variety va on va.slug = a.variety_slug;

-- 가격 품종 ↔ 제철 품종 (packages/seasonal의 id)
insert into price.variety_seasonal_map (variety_id, seasonal_food_id)
select va.id, m.seasonal_food_id
from (values
  ('baechu', 'napa-cabbage'),
  ('aehobak', 'korean-zucchini'),
  ('sagwa-hongro', 'apple'),
  ('godeungeo-salted', 'mackerel')
) m (variety_slug, seasonal_food_id)
join price.variety va on va.slug = m.variety_slug;

-- ── 환산 규칙 ──────────────────────────────────────────────────────────

-- 원천 단위가 품종의 기준 단위와 같을 때: price_raw ÷ qty_raw × base_unit_qty
insert into price.unit_rule (rule_code, version, price_tier, kind, params, note) values
  ('same_unit', 1, 'retail', 'same_unit', '{}', '원천 단위 = 기준 단위. 수량만 나눈다');

-- ── 판매처 (참가격 점포 이름 앞부분으로 자동 제안하는 대상) ────────────────────

insert into price.seller (name, channel) values
  ('이마트', 'large_mart'),
  ('홈플러스', 'large_mart'),
  ('롯데마트', 'large_mart'),
  ('신세계백화점', 'department'),
  ('롯데백화점', 'department'),
  ('현대백화점', 'department'),
  ('이마트에브리데이', 'ssm'),
  ('홈플러스익스프레스', 'ssm'),
  ('롯데슈퍼', 'ssm'),
  ('GS더프레시', 'ssm'),
  ('CU', 'convenience'),
  ('GS25', 'convenience'),
  ('세븐일레븐', 'convenience'),
  ('이마트24', 'convenience');

-- ── 검사: 기본 규격이 없는 활성 품종 (pipeline.md 3-1) ───────────────────────

do $$
declare
  missing text;
begin
  select string_agg(v.slug, ', ') into missing
  from price.variety v
  where v.status = 'active'
    and not exists (select 1 from price.spec s where s.variety_id = v.id and s.is_default);
  if missing is not null then
    raise exception '기본 규격이 없는 활성 품종: %', missing;
  end if;
end
$$;
