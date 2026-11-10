-- 상품 분류 (GLOSSARY "상품": 언제나 하나의 품목에 속한다). 참가격 상품마다 지금 화면에 쓰는 카테고리·품목과 최신 상품 속성을 낸다.
-- 규칙: 상품의 품목(product.item_id)이 있으면 그 품목·카테고리, 없으면 출처 분류 대응표(category_source_map, 참가격 AL 소분류)의
-- 카테고리와 소분류 이름, 둘 다 없으면 null(placed_by 'none'). 대체 이름("기타")은 쓰지 않는다: 분류가 없는 상품은 화면에 내지 않는다.
-- 상품 payload 빌드(price-ingest judgment/product-db.ts)와 카탈로그 어드민이 이 뷰를 읽는다. 저장하지 않는 일반 뷰라 품목을 고치면 바로 반영된다.

create view price.product_classification with (security_invoker = true) as
  select p.id as product_id,
         c.id as category_id,
         c.name as category_name,
         i.id as item_id,
         coalesce(i.name, m.class_name) as item_name,
         case when i.id is not null then 'item' when m.category_id is not null then 'source_class' else 'none' end as placed_by,
         h.al_code,
         h.total_qty,
         h.total_unit
    from price.product p
    left join lateral (
      select x.al_code, x.total_qty, x.total_unit
        from price.product_attr_history x
       where x.product_id = p.id
       order by x.valid_from desc
       limit 1
    ) h on true
    left join price.item i on i.id = p.item_id
    left join price.category_source_map m on i.id is null and m.source = 'chamga' and m.source_class = h.al_code
    left join price.category c on c.id = coalesce(i.category_id, m.category_id);

comment on view price.product_classification is '상품 분류: 참가격 상품마다 화면에 쓰는 카테고리·품목과 최신 상품 속성. 품목이 있으면 품목, 없으면 출처 분류 대응표, 둘 다 없으면 null';
comment on column price.product_classification.product_id is '상품';
comment on column price.product_classification.category_id is '카테고리. 품목이 있으면 품목의 카테고리, 없으면 대응표의 카테고리, 둘 다 없으면 null';
comment on column price.product_classification.category_name is '카테고리 이름. category_id가 null이면 null';
comment on column price.product_classification.item_id is '상품의 품목 (product.item_id). 정하지 않았으면 null';
comment on column price.product_classification.item_name is '품목 이름. 품목이 없으면 대응표에 이은 참가격 AL 소분류 이름, 둘 다 없으면 null';
comment on column price.product_classification.placed_by is '분류를 정한 근거: item 상품의 품목, source_class 출처 분류 대응표, none 둘 다 없음(화면에 내지 않는다)';
comment on column price.product_classification.al_code is '최신 상품 속성의 참가격 AL 소분류 코드 (goodSmlclsCode). 속성 이력이 없으면 null';
comment on column price.product_classification.total_qty is '최신 상품 속성의 용량 수 (goodTotalCnt). 없으면 null';
comment on column price.product_classification.total_unit is '최신 상품 속성의 용량 단위 코드 (goodTotalDivCode, 예 G·ML·EA). 없으면 null';

grant select on price.product_classification to ingest_writer;
