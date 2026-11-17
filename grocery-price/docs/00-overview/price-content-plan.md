# 장볼날 시세 콘텐츠 도입 제안

2026-11-17 기준. **시세 홈의 ‘자주 사는 식재료’에 직전 조사 대비 등락을 먼저 붙이고, 같은 데이터를 ‘이번 주 장보기’로 이어간다.** 장볼날의 평소가 판정과 함께 보면 사용자는 ‘요즘 올랐는지’와 ‘지금 사도 괜찮은지’를 한 화면에서 판단할 수 있다. 첫 테마는 김장으로 잡는다. KAMIS 자체 API를 붙일 이유가 가장 분명한 기능은 **KAMIS가 발표한 평년을 출처와 함께 보여주는 비교**다. [17개 실응답 조사](../10-research/kamis-openapi/README.md)

## KAMIS 화면에서 가져올 것

| 공식 화면 | 확인한 구성 | 장볼날에 맞춘 활용 |
| --- | --- | --- |
| [제철 농수산물](https://www.kamis.or.kr/customer/trend/product/product.do) | 제철 식재료 소개 게시판. 생강 글에는 고르는 법, 보관, 요리 활용과 첨부 조사 보고서가 있었다. | 기존 제철 상세에 ‘살 때’와 ‘보관할 때’ 정보를 한두 문장씩 보강한다. 출처와 확인일을 남기고 대응되는 시세 상세로 연결한다. [KAMIS 생강 게시글](https://www.kamis.or.kr/customer/trend/product/product.do?action=detail&brdctsno=482310&pagenum=1&search_keyword=&search_option=) |
| [주간알뜰장보기](https://www.kamis.or.kr/customer/trend/economic/economic.do?action=priceInfoNew) | [공식 목록](https://www.kamis.or.kr/customer/trend/economic/economic.do)은 주간 동향·전망, 소매가격, 행사, 가격 비교, 수급을 나눈다. [발행물 예시](https://www.kamis.or.kr/images/economic/3762/7765.pdf)는 주간 가격과 등락률을 보여주고, 별도로 수급 해설과 전망을 싣는다. | 최근 두 조사 주간의 가격을 비교하고, ‘지난주보다 내려간 식재료’와 ‘평소보다 싼 식재료’를 구분해 보여준다. 재료별 시세 상세와 장바구니로 연결한다. |
| [KAMIS 메인](https://www.kamis.or.kr/customer/main/main.do) | 오늘·이번 주·이번 달 가격 비교, 맞춤 가격, 알뜰 소비 품목을 노출한다. 알뜰 목록에는 기준 단위·가격·전년동월 대비 변화가 붙는다. | 기존 ‘자주 사는 식재료’ 목록을 활용해 최신 시세와 등락을 보여준다. 담은 재료가 있으면 상단에 먼저 보여주고, 처음 방문한 사람에게는 기본 목록을 제공한다. |

제철 게시글과 주간 발행물은 화면 구성과 편집의 참고 출처다. 17개 API에서 확인한 데이터는 가격·집계·코드표다. 제철 글과 첨부 자료는 필요한 품종별로 읽고, 다른 근거와 대조한 사실을 장볼날 문장과 그림으로 정리한다. 원문·사진·PDF를 직접 실을 경우 자료별 이용 조건을 확인한다. 게시일만으로 제철 달을 정하지 않는다. [제철 검증 용어](../../GLOSSARY.md) · [KAMIS API 목록](https://www.kamis.or.kr/customer/reference/openapi_list.do)

## 기존 API로 만드는 콘텐츠

여기서 기존 API는 KAMIS 공공데이터포털 `perDay/price`, 축평원 `consumerPriceDaily`, 참가격 `ProductPriceInfoService`다. 이미 수집 중인 값으로 만들 수 있는 콘텐츠부터 제안한다. [현재 수집 범위](../10-research/api-spec.md)

| 순서 | 콘텐츠 | 점수 | 화면과 데이터 |
| --- | --- | --- | --- |
| **1** | **자주 사는 식재료의 시세 등락** | **9/10** | 기존 홈 목록 중 비교 가능한 품종부터 현재 시세·기준 단위·조사일·직전 조사 대비 변화를 한 줄에 표시한다. 상세 화면의 기존 추이에서 비교일 두 개를 찾을 수 있게 한다. KAMIS 소매와 축평원의 품종별 대표 시세를 재사용한다. |
| **2** | **이번 주 장보기** | **9/10** | 홈에 3~5개 요약과 주간 페이지 링크를 붙인다. 주간 페이지에는 ‘가격이 내려간 식재료’, ‘오른 식재료’, ‘평소보다 싼 식재료’를 보여준다. 한 행에서 두 주의 시세, 차이(원·%), 평소가 판정, 상세·장바구니를 이어준다. 첫 테마는 배추·무·국산 깐마늘·국산 고춧가루를 묶은 **김장 장보기**로 제안한다. 전년 동기 시세와 수량 기준 예상액은 규격과 비교 이력이 확인되는 재료에 붙인다. |
| **3** | **이달의 제철 장보기** | **8/10** | 제철 검증과 시세 품종 대응이 끝난 재료 3~4개를 고른다. 시세 상세에는 ‘제철과 고르는 법’을, 제철 상세에는 최신 소매 시세와 조사일을 보여준다. 생강처럼 편집 참고 자료가 있는 품종부터 적용하고, 시세 대응이 불분명한 갑오징어 등은 제철 정보만 보강한다. 기존 제철달력과 두 상세 화면의 이동 경로를 활용한다. |
| **4** | **내가 담은 식재료 시세** | **8/10** | 이미 장바구니에 담은 품종을 홈에서 먼저 보여준다. 기기에 저장된 담을 때의 판정과 최근 판정을 활용해 ‘담을 때 보통 → 최근 싸다’처럼 표시한다. 장바구니와 별도의 즐겨찾기는 반복 사용을 확인한 뒤 검토한다. |
| **5** | **포장 상품 판매가 변화** | **7/10** | 참가격이 제공하는 포장 상품의 판매처·점포별 최근 두 조사 가격과 100g당 가격 같은 환산 판매가를 비교한다. 행사 정보가 있는 경우 관측한 조사일을 함께 표시한다. |

점수는 구매 결정에 주는 도움, 현재 데이터 가용성, 화면과 편집에 드는 일을 함께 고려한 제안이다. 이미 홈에 자주 사는 식재료와 최근 본 시세가 있고, 시세 상세에는 평소가 판정과 1·3·6개월 추이가 있다. 장바구니는 품종을 담은 시점의 판정과 조사일을 기기에 저장한다. [홈 구현](../../../apps/web/features/price/home/home-view.tsx) · [시세 상세](../../../apps/web/features/price/variety-detail/detail-view.tsx) · [장바구니 저장](../../../apps/web/features/price/stores/basket-store.ts)

### 등락 계산과 화면 표시

- **직전 조사 대비**는 같은 품종·규격·기준 단위·대표 출처·지역 범위의 최근 두 유효 조사일을 비교한다. 하루 차이일 때만 ‘어제 대비’로 쓸 수 있다. 휴일을 사이에 둔 경우 ‘직전 조사 대비’로 쓰고 두 조사일을 함께 표시한다. 참가격은 조사 간격이 길어 ‘직전 조사 대비’만 쓴다.
- **주간 비교**는 첫 버전에서 완료된 두 달력 주간의 일별 대표 시세를 평균해 비교한다. 예를 들어 ‘11월 9~15일 · 11월 2~8일 대비’처럼 실제 기간을 표시한다. 양쪽에 유효한 조사일이 3일 이상 있는 품종부터 적용하는 것을 제안한다. 기존 판정의 표본 기준과 갱신 지연 신호를 함께 확인한다. 결측일은 채워 넣지 않고 유효 조사일 수를 표시한다.
- **등락과 판정**은 나란히 표시한다. ‘직전 조사보다 4% 상승’과 ‘평소보다 8% 낮음’은 동시에 성립한다. 등락률만으로 구매를 권하거나 가격 변화 원인을 붙이지 않는다. 주간 순위는 비교 가능한 표본의 시세가 움직인 방향을 나타낸다.
- **첫 구현 범위**는 홈의 기존 대표 품종 목록과 주요 규격 하나씩이다. 홈 요약에 두 조사일이 필요하고, 주간 화면에는 조사일별 시세와 표본 정보가 필요하다. 기존 `daily_quote`를 확인하고 `getPriceSource()`를 통해 필요한 요약을 제공한다. 현재 상세 그래프는 최근 182일을 읽으므로 전년 비교에는 저장된 전국 시세와 해당 품종의 실제 백필 범위를 확인한다. 제철 연결은 이름이 같은 항목을 자동으로 묶기보다 확인된 품종 대응을 사용한다. [시세 집계·보존](../30-data/pipeline.md) · [평소가 계산](../30-data/judgment.md)

### 같은 API에서 수집을 더 하면 가능한 콘텐츠

| 콘텐츠 | 점수 | 추가할 기존 조회와 도입 조건 |
| --- | --- | --- |
| **일반·유기농·무농약 감자 시세** | **7/10** | `perDay`의 친환경 `07`을 수집하고 기존 소매 `01`과 비교한다. 서울 수미 감자 표본은 12·13번 자체 API와 일치했다. 같은 조사 주간·기준 단위·포장 크기·지역을 맞춘다. 비교할 수 있는 조사 시장이 적으면 가격과 표본 수만 보여준다. [12번 감자 대조](../10-research/kamis-openapi/12-eco-period.md) |
| **중도매와 소매의 가격 흐름** | **6/10** | `perDay` 중도매 `02`를 추가한다. 배추 10kg 묶음과 소매 1포기처럼 원래 단위가 다른 경우 각각의 가격과 변화율을 나란히 표시한다. 배추 표본은 16번과 일치했다. 가격 예고는 품종별 시차를 과거 데이터에서 검증한 뒤 판단한다. [16번 배추 대조](../10-research/kamis-openapi/16-daily-wholesale.md) |
| **구 친환경 가격 기록** | **4/10** | `perDay` 구 친환경 `03`에서 조사 이력을 추가한다. 서울 유기농 쌀 표본은 5·11번과 일치했다. 2020년 4월 경계를 넘기는 비교는 조사 방식·포장 단위의 연속성이 확인된 품종에 적용한다. [5번 쌀 대조](../10-research/kamis-openapi/05-historical-eco-period.md) |

## KAMIS 자체 API를 추가해야 하는 콘텐츠

아래 기능은 **KAMIS가 발표한 값 그대로** 제공할 때 자체 API가 필요하다. 같은 주제의 장볼날 시세와 변화는 기존 API의 관측값으로 만들 수 있다. 실측에서만 확인한 범위는 품종을 확대하기 전에 다시 확인한다.

| 콘텐츠 | 점수 | 자체 API와 도입 이유 |
| --- | --- | --- |
| **KAMIS 평년과 함께 보기** | **7/10** | 상세 화면의 비교 영역에 ‘KAMIS 평년’을 표시한다. 1번은 일평년, 7번은 최근 추이의 평년 행, 16·17번은 도매·소매 기간 응답의 평년 행을 실제로 반환했다. 같은 조사일·규격·범위로 비교하고, 제공값의 의미를 설명할 수 있는 일부 품종으로 시작한다. 장볼날 평소가는 기존 계산과 표시를 유지한다. |
| **KAMIS 월별·연도별 통계 인용** | **5/10** | ‘KAMIS 공식 월평균’이나 ‘KAMIS 공식 연간 변동성’처럼 출처의 집계를 인용하는 장기 콘텐츠는 3·4번을 사용한다. 8·9번의 `max`·`min`은 쌀 10kg 실측에서 기간별 평균으로 확인됐으므로 해당 사례의 월·연 최고/최저로 표시하지 않는다. |
| **KAMIS 집계 검산** | **운영용** | 예시로 1·10·14번의 당일 평균, 12·13번의 친환경 평균과 내부 집계를 비교한다. 15번은 원천 코드·등급·조사 단위 대조에 쓴다. 화면에 필요한 품종에서 의미 있는 집계 차이 또는 추가 범위가 확인되면 운영 연동을 검토한다. |

주간 발행물의 다음 주 전망·수급 설명·판매처별 행사와 제철 게시글 본문은 별도 콘텐츠 출처다. 장볼날에서 다룰 때는 공식 발행물과 조사 날짜를 확인하고 필요하면 출처 링크를 붙인다. 첫 주간 화면은 관측된 소매 시세 변화와 장보기 행동에 집중한다. [주간알뜰장보기 발행물 예시](https://www.kamis.or.kr/images/economic/3762/7765.pdf)

## 17개 API 연결

각 항목의 조사 문서에 요청·응답과 실제 대조 범위가 있다. 2번은 발급 키 호출에서 시간 초과가 계속됐고, 16·17번의 확인 범위는 배추 표본이다.

| API | 장볼날에서 맡길 일 | 공식 명세 |
| --- | --- | --- |
| [01 일별 부류별 도·소매](../10-research/kamis-openapi/01-daily-by-category.md) | 홈·주간의 당일값 검산, KAMIS 일평년 | [01](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=1) |
| [02 일별 품목별 도·소매](../10-research/kamis-openapi/02-daily-by-item.md) | 일별 이력은 기존 `perDay` 우선. 자체 응답 미확인 | [02](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=2) |
| [03 월별 도·소매](../10-research/kamis-openapi/03-monthly-by-item.md) | KAMIS 월평균 인용과 제철 시세 검산 | [03](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=3) |
| [04 연도별 도·소매](../10-research/kamis-openapi/04-yearly-by-item.md) | KAMIS 연평균·최고·최저·변동 통계 | [04](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=4) |
| [05 구 친환경 기간](../10-research/kamis-openapi/05-historical-eco-period.md) | 과거 친환경 관측값은 `perDay` 03 우선. 공식 평균 검산 | [05](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=5) |
| [06 최근일 도·소매](../10-research/kamis-openapi/06-latest-top-grade.md) | 최신 시세 검산과 7~9번용 `productno` 확인 | [06](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=6) |
| [07 최근 추이](../10-research/kamis-openapi/07-recent-trend.md) | KAMIS 전년·평년과 최근 추이 비교 | [07](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=7) |
| [08 월별 추이](../10-research/kamis-openapi/08-monthly-trend.md) | 월평균 비교. 쌀 표본에서 3번과 값 중복 | [08](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=8) |
| [09 연도별 추이](../10-research/kamis-openapi/09-yearly-trend.md) | 연평균 비교. 쌀 표본에서 4번과 값 중복 | [09](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=9) |
| [10 지역별 최근일 도·소매](../10-research/kamis-openapi/10-latest-by-region.md) | 지역 시세 검산. 현재 조회는 `perDay` 관측값으로 구현 | [10](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=10) |
| [11 구 친환경 하루](../10-research/kamis-openapi/11-historical-eco-day.md) | 과거 특정 조사일의 근거 확인과 평균 검산 | [11](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=11) |
| [12 신 친환경 기간](../10-research/kamis-openapi/12-eco-period.md) | 친환경 기간 추이 검산. 관측값은 `perDay` 07 우선 | [12](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=12) |
| [13 신 친환경 하루](../10-research/kamis-openapi/13-eco-day.md) | 친환경 특정 조사일 평균과 시장 관측값 검산 | [13](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=13) |
| [14 지역별 품목별 도·소매](../10-research/kamis-openapi/14-item-by-region.md) | 지역 비교 검산. 1번과 전월 값이 달랐던 사례 기록 | [14](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=14) |
| [15 품목 및 등급 코드표](../10-research/kamis-openapi/15-product-grades.md) | 원천 품종·등급·실제 조사 단위 매핑 검토 | [15](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=15) |
| [16 신 일별 도매](../10-research/kamis-openapi/16-daily-wholesale.md) | 도매 평년과 배추 중도매 검산. 관측값은 `perDay` 02 우선 | [16](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=16) |
| [17 신 일별 소매](../10-research/kamis-openapi/17-daily-retail.md) | 소매 평년과 배추 소매 검산. 관측값은 `perDay` 01 우선 | [17](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=17) |
