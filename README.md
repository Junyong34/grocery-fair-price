# 장볼날

장을 볼 때 "이 가격, 비싼 건가?"와 "지금 뭐가 제철이지?"에 답하는 서비스다. 최저가를 찾아 주지 않고, 지금 가격이 평소보다 싼지 비싼지와 지금 많이 나고 맛있는 것을 알려 준다.

## 무엇을 하나

### 시세와 판정

공공 가격 자료(KAMIS, 축산물품질평가원, 참가격)를 매일 모아 품종마다 시세를 보여 주고, 평소가와 비교한 판정(싸다 · 보통 · 비싸다와 차이 %)을 낸다.

| 화면 | 주소 |
|---|---|
| 시세 메인 | `/` |
| 품종 · 상품 검색 | `/search` |
| 품종의 시세와 판정 | `/prices/[품종]` |
| 가공식품 상품의 판매가 | `/products` |
| 장바구니(담아 둔 품종의 시세를 한 번에) | `/basket` |

### 제철달력과 먹음 기록

달마다 제철인 채소 · 과일 · 버섯 · 곡물 · 수산을 직접 그린 그림으로 보여 준다. 먹은 품종을 표시하면 그해의 먹음 기록이 기기에 쌓인다.

| 화면 | 주소 |
|---|---|
| 이달의 제철 | `/seasonal` |
| 월별 · 계절별 제철 | `/seasonal/months/[월]`, `/seasonal/seasons/[계절]` |
| 식재료 월별 표 | `/seasonal/ingredients` |
| 제철 회 | `/seasonal/sashimi/[월]` |
| 명절과 전통 음식 | `/seasonal/festivals/[명절]` |
| 품종 상세 | `/seasonal/foods/[품종]` |
| 나의 식탁(먹음 기록) | `/seasonal/my-table` |

### 이유식 궁합

이유식 재료끼리 함께 먹이기 좋은 조합과 확인이 필요한 조합을 찾고, 월령별로 먹일 수 있는 과일과 주의할 식재료를 본다.

| 화면 | 주소 |
|---|---|
| 내 재료로 골라 보기 | `/baby-food` |
| 재료 궁합표와 재료별 페이지 | `/baby-food/pairings` |
| 월령별 과일 도감 | `/baby-food/fruits` |

### 인쇄물 다운로드

제철 달력과 포스터, 이유식 궁합표를 집에서 인쇄할 수 있는 PDF로 내려받는다. 주소는 `/seasonal/downloads`다.

기록과 설정은 로그인 없이 기기에만 저장한다. 가격 자료의 출처는 `/settings/sources`에서 볼 수 있다.

## 더 읽을 곳

| 알고 싶은 것 | 문서 |
|---|---|
| 저장소 구조, 모든 화면과 모듈, 생성 파일, 명령 | [`docs/project-structure.md`](docs/project-structure.md) |
| 에이전트와 함께 일하는 규칙 | [`AGENTS.md`](AGENTS.md) |
| 티켓을 끝내는 기준과 커밋 규칙 | [`docs/rules/ticket-workflow.md`](docs/rules/ticket-workflow.md) |
| 지금 진행 중인 일 | [`.scratch/README.md`](.scratch/README.md) |
| 용어(품종, 시세, 판정, 제철, 그림 …) | [`grocery-price/GLOSSARY.md`](grocery-price/GLOSSARY.md) |
| 시세 서비스의 기획과 자료 조사, 설계 결정(ADR) | [`grocery-price/README.md`](grocery-price/README.md) |
