# 10. 상품 페이지·검색·카테고리 둘러보기

Status: needs-triage
Type: task
Blocked by: 09

## 목적

가공식품 상품을 한 페이지씩 보여 주고, 검색과 카테고리 둘러보기에 식재료와 함께 넣는다.

## 할 일

- [ ] 경로: 상품 페이지 URL (예: `/products/[id]`)을 `shared/routes.ts`에 정한다. `generateStaticParams`(Cache Components), `notFound()`, `createMetadata`, `shared/seo/pages.ts` 등록
- [ ] 화면 스펙: `.scratch/price-screens/spec.md`에 상품 페이지 절을 더한다(최근 가격 → 판매처별 → 업태별 → 추이 → 출처). 판정 카드 자리에는 "판정 없음"을 어떻게 말할지
- [ ] 검색 색인에 상품을 넣는다. 수백~수천 개가 되므로 색인 크기와 초성 검색 성능을 잰다
- [ ] 카테고리 둘러보기(05의 목록), 장바구니 담기에 상품을 넣을지
- [ ] `getPriceSource()`로만 읽는다
- [ ] 375·1280, 콘솔 오류 없음

## 완료 기준

- 가공식품 상품을 검색해 페이지로 들어가 판매처별 가격을 볼 수 있다.
