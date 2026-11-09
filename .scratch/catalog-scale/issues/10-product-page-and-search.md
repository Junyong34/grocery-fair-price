# 10. 상품 페이지·검색·카테고리 둘러보기

Status: done
Type: task
Blocked by: 09

## 목적

가공식품 상품을 한 페이지씩 보여 주고, 검색과 카테고리 둘러보기에 식재료와 함께 넣는다.

## 할 일

- [x] 경로: 상품 페이지 URL (예: `/products/[id]`)을 `shared/routes.ts`에 정한다. `generateStaticParams`(Cache Components), `notFound()`, `createMetadata`, `shared/seo/pages.ts` 등록
- [x] 화면 스펙: `.scratch/price-screens/spec.md`에 상품 페이지 절을 더한다(최근 가격 → 판매처별 → 업태별 → 추이 → 출처). 판정 카드 자리에는 "판정 없음"을 어떻게 말할지
- [x] 검색 색인에 상품을 넣는다. 수백~수천 개가 되므로 색인 크기와 초성 검색 성능을 잰다
- [x] 카테고리 둘러보기(05의 목록), 장바구니 담기에 상품을 넣을지
- [x] `getPriceSource()`로만 읽는다
- [x] 375·1280, 콘솔 오류 없음

## 완료 기준

- 가공식품 상품을 검색해 페이지로 들어가 판매처별 가격을 볼 수 있다.

## Answer (2026-11-09)

- 사용자 결정: 검색은 식재료 아래 상품 묶음, 담기는 이번에 넣지 않음, 카테고리 둘러보기는 새 페이지 없이 검색의 카테고리 결과(품목별 묶음)
- 경로 `/products/[goodId]`(`routes.price.product`), `generateStaticParams`는 `listProducts`(조사 중단 상품 제외), `DATA_SEO_PAGES`와 sitemap에 등록, `/products`는 `/`로 보낸다. 제목·설명 `productSeo`
- 읽기: `PriceSource.listProducts`·`getProduct` → `queries/list-products.ts`·`get-product.ts`(`current_product`, 목록은 `PRODUCT_SUMMARY_KEYS`만), 캐시 hours. DB 테스트 `queries.db.test.ts`
- 검색 `searchProducts`(packages/price/search.ts, 테스트 먼저): 카테고리 이름이면 그 카테고리 전부, 아니면 품목 일치 → 이름 위치 → 품목 일부. 454개라 따로 색인을 만들지 않고 목록을 브라우저에 내려 거른다 (목록 행이 작다)
- 화면 스펙: `.scratch/price-screens/spec.md` 11장
- 확인: 375·1280에서 상품 상세(1520 훈제오리), 검색 "라면"(상품 13), "라면·면"(품목별 31), "우유"(식재료 + 상품 14). 콘솔 오류 없음
- 전국 요약이 한 번도 없는 상품 3개(예: 1522)는 payload가 없어 404다

