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
  ('sagwa', 'sagwa', '사과', 'ea', 1),
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
  ('sagwa', 'top', '상품', true, 1),
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
  ('sagwa', 'apple'),
  ('godeungeo-salted', 'mackerel')
) m (variety_slug, seasonal_food_id)
join price.variety va on va.slug = m.variety_slug;

-- ── 환산 규칙 ──────────────────────────────────────────────────────────

-- 원천 단위가 품종의 기준 단위와 같을 때: price_raw ÷ qty_raw × base_unit_qty
insert into price.unit_rule (rule_code, version, price_tier, kind, params, note) values
  ('same_unit', 1, 'retail', 'same_unit', '{}', '원천 단위 = 기준 단위. 수량만 나눈다');

-- ── 판매처 (참가격 점포 이름 앞부분으로 자동 연결하는 대상) ────────────────────
-- 운영 판매처는 마이그레이션 20261029000100이 넣는다. 여기는 로컬에만 두는 나머지 (같은 이름은 건너뛴다)

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
  ('이마트24', 'convenience')
on conflict (name) do nothing;

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

-- ── 출처 분류 대응표: 참가격 AL 소분류 (catalog-scale/05) ─────────────────
-- 운영 대응표(packages/price-ingest/src/catalog/snapshot.json의 sourceCategories)의 참가격 행을 옮겼다.
-- 로컬은 카테고리가 임시 다섯 개라, 그 다섯에 없는 운영 카테고리(곡물·유제품·라면 등)는 가공식품으로 둔다.
-- 상품 분류 뷰(product_classification)가 이 표로 품목 없는 상품의 카테고리를 정하므로, 없으면 로컬 상품 payload가 만들어지지 않는다.
insert into price.category_source_map (source, source_class, class_name, category_id)
select 'chamga', v.code, v.name, c.id
from (values
  ('030101001', '계란', 'meat'),
  ('030101002', '쇠고기', 'meat'),
  ('030101003', '닭고기', 'meat'),
  ('030101004', '돼지고기', 'meat'),
  ('030102001', '배추', 'vegetable'),
  ('030102002', '양파', 'vegetable'),
  ('030102003', '무', 'vegetable'),
  ('030102004', '포기김치', 'side-dishes'),
  ('030102005', '콩나물', 'vegetable'),
  ('030102006', '단무지', 'side-dishes'),
  ('030102007', '시금치', 'vegetable'),
  ('030102008', '당근', 'vegetable'),
  ('030102009', '감자', 'vegetable'),
  ('030102010', '고구마', 'vegetable'),
  ('030102011', '버섯', 'vegetable'),
  ('030102012', '오이', 'vegetable'),
  ('030102013', '풋고추', 'vegetable'),
  ('030102014', '호박', 'vegetable'),
  ('030102015', '대파', 'vegetable'),
  ('030102016', '마늘', 'vegetable'),
  ('030102017', '깻잎', 'vegetable'),
  ('030102018', '상추', 'vegetable'),
  ('030102020', '양배추', 'vegetable'),
  ('030102021', '쪽파', 'vegetable'),
  ('030102022', '가지', 'vegetable'),
  ('030102023', '쌀(현미)', 'grain'),
  ('030103001', '갈치', 'seafood'),
  ('030103002', '조기', 'seafood'),
  ('030103003', '고등어', 'seafood'),
  ('030103004', '오징어', 'seafood'),
  ('030103005', '삼치', 'seafood'),
  ('030103006', '연어', 'seafood'),
  ('030103008', '새우', 'seafood'),
  ('030201001', '빵', 'bakery'),
  ('030201004', '즉석덮밥', 'ready-meals'),
  ('030201005', '냉동만두', 'ready-meals'),
  ('030201007', '밀가루', 'sauces'),
  ('030201008', '두부', 'deli'),
  ('030201009', '국수', 'noodles'),
  ('030201010', '시리얼', 'bakery'),
  ('030201011', '라면', 'noodles'),
  ('030201012', '부침가루', 'sauces'),
  ('030201014', '즉석밥', 'ready-meals'),
  ('030201015', '당면', 'noodles'),
  ('030201019', '스프', 'ready-meals'),
  ('030201020', '즉석죽', 'ready-meals'),
  ('030201021', '견과류', 'grain'),
  ('030201024', '컵라면', 'noodles'),
  ('030201025', '컵밥', 'ready-meals'),
  ('030201026', '국.탕', 'ready-meals'),
  ('030201027', '과일가공품', 'snacks'),
  ('030201028', '파스타면', 'noodles'),
  ('030201029', '참깨', 'grain'),
  ('030201030', '냉면', 'noodles'),
  ('030201031', '떡볶이', 'ready-meals'),
  ('030201032', '볶음밥', 'ready-meals'),
  ('030201033', '우동', 'noodles'),
  ('030201034', '유부초밥', 'ready-meals'),
  ('030201035', '핫도그', 'ready-meals'),
  ('030202002', '어묵', 'deli'),
  ('030202003', '맛살', 'deli'),
  ('030202004', '참치캔', 'side-dishes'),
  ('030202005', '맛김', 'side-dishes'),
  ('030202008', '젓갈', 'side-dishes'),
  ('030202009', '미역', 'dried'),
  ('030202010', '이유식', 'snacks'),
  ('030203002', '마가린', 'dairy'),
  ('030203003', '소시지', 'deli'),
  ('030203004', '햄', 'deli'),
  ('030203005', '우유', 'dairy'),
  ('030203006', '분유', 'dairy'),
  ('030203007', '치즈', 'dairy'),
  ('030203008', '발효유', 'dairy'),
  ('030203009', '베이컨', 'deli'),
  ('030203010', '훈제오리', 'deli'),
  ('030203011', '버터', 'dairy'),
  ('030203012', '냉동돈가스', 'ready-meals'),
  ('030203013', '치킨너겟', 'ready-meals'),
  ('030204001', '식초', 'sauces'),
  ('030204002', '꿀', 'sauces'),
  ('030204004', '참기름', 'sauces'),
  ('030204005', '식용유', 'sauces'),
  ('030204006', '소금', 'sauces'),
  ('030204007', '설탕', 'sauces'),
  ('030204008', '혼합조미료', 'sauces'),
  ('030204009', '고추장', 'sauces'),
  ('030204010', '된장', 'sauces'),
  ('030204011', '간장', 'sauces'),
  ('030204012', '마요네즈', 'sauces'),
  ('030204013', '케첩', 'sauces'),
  ('030204014', '카레', 'sauces'),
  ('030204015', '잼', 'sauces'),
  ('030204016', '쌈장', 'sauces'),
  ('030204019', '드레싱', 'sauces'),
  ('030204020', '고춧가루', 'sauces'),
  ('030204021', '물엿', 'sauces'),
  ('030204022', '까나리액젓', 'sauces'),
  ('030204023', '고추냉이', 'sauces'),
  ('030204024', '멸치액젓', 'sauces'),
  ('030205001', '사탕', 'snacks'),
  ('030205002', '크래커', 'snacks'),
  ('030205003', '스낵과자', 'snacks'),
  ('030205005', '초코파이류', 'snacks'),
  ('030205006', '초콜릿', 'snacks'),
  ('030205007', '껌', 'snacks'),
  ('030205008', '아이스크림', 'snacks'),
  ('030205009', '빙과류', 'snacks'),
  ('030205011', '에너지바', 'snacks'),
  ('030205012', '초코바', 'snacks'),
  ('030205013', '전통과자', 'snacks'),
  ('030205014', '젤리', 'snacks'),
  ('030205015', '쌀(백미)', 'grain'),
  ('030206001', '비타민음료', 'beverages'),
  ('030206002', '캔커피', 'beverages'),
  ('030206003', '커피믹스', 'beverages'),
  ('030206004', '차', 'beverages'),
  ('030206005', '콜라', 'beverages'),
  ('030206006', '사이다', 'beverages'),
  ('030206007', '생수', 'beverages'),
  ('030206008', '주스', 'beverages'),
  ('030206011', '두유', 'dairy'),
  ('030206012', '맥주', 'beverages'),
  ('030206013', '소주', 'beverages'),
  ('030206016', '막걸리', 'beverages'),
  ('030206019', '이온음료', 'beverages'),
  ('030206021', '에너지음료', 'beverages'),
  ('030206022', '탄산수', 'beverages'),
  ('030206024', '단백질음료', 'beverages'),
  ('030206025', '숙취해소제', 'beverages'),
  ('030206026', '캡슐커피', 'beverages')
) as v (code, name, category)
join price.category c
  on c.slug = case when v.category in ('vegetable', 'fruit', 'seafood', 'meat') then v.category else 'processed' end;
