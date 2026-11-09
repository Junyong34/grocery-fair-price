# 09. 가공식품 상품 payload와 공개

Status: needs-triage
Type: task
Blocked by: 01, 05

## 목적

참가격 가공식품 상품을 화면에 올릴 데이터를 만든다. 판정은 내지 않고 최근 조사일 가격과 업태·판매처별 비교를 보여 준다.

## 입력

- `product_daily_summary`(조사일 × 상품 × 범위 `national`·`channel:<업태>`·`seller:<id>`): 최저·중앙·최고, 행사 뺀 중앙, 점포·판매처 수, 행사 수. 요약은 영구, 점포별 관측값은 최근 6 조사일 (ingest-foundation/07)
- 상품 이름·용량(`goodTotalCnt`·`goodTotalDivCode`)·제조사(p2/06 결정에 따름)·카테고리(05)

## 할 일

- [ ] payload 모양 (`packages/price`에 zod 스키마): 최근 조사일, 전국 중간·최저·최고, 업태별·판매처별 행, 행사 중인 판매처, 최근 6 조사일 추이, 기준 단위 환산(100g·100ml당)
- [ ] 판정 묶음과 같은 포인터(`judgment_current`)로 공개한다 (catalog-evolution/06의 "화면용 카탈로그 정보를 판정 묶음에 싣는다"). 상품 행을 같은 묶음에 넣을지 별도 묶음으로 둘지 정한다
- [ ] 단종·조사 중단 상품(`product.status = 'not_surveyed'`)과 마지막 조사일이 오래된 상품의 표시 규칙
- [ ] ADR 0004대로 payload가 화면 모양인지 확인

## 완료 기준

- 참가격 식품 상품 전부의 payload가 운영 판정 묶음에 있다.
