# 17. 신)일별 품목별 소매 가격자료(기간설정가능, 최대1년)

**시세 화면 분류** · 기존 데이터로 구현

원천 품목·품종·등급·지역을 지정해 기간 내 일별 소매 가격을 조회한다. 문서 제목상의 최대 기간은 1년이다. [KAMIS 공식 명세](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=17)

## 요청

- `GET /service/price/xml.do?action=periodRetailProductList`
- 공통 인증·형식은 `p_cert_key`, `p_cert_id`, `p_returntype`이다. 조회 조건은 `p_countrycode`, `p_startday`, `p_productrankcode`, `p_convert_kg_yn`, `p_itemcategorycode`, `p_itemcode`, `p_kindcode`, `p_endday`이다.
- `p_convert_kg_yn` 기본값은 `N`, `p_countrycode` 생략 시 전체지역이다. 최대 1년이 고정 이력 범위인지 요청 구간 상한인지는 문서가 구분하지 않는다.

## 제공 데이터

`itemname`, `kindname`, `countyname`, `marketname`, `yyyy`, `regday`, `price`가 명세에 있다. 행의 단위·수량·시장 코드·원천 등록일시는 응답표에 없다.

## 공개 응답 확인

서울 가을배추 공개 테스트 응답에서 `data.item[]`에 `평균`, `평년`, `경동` 등의 조사 시장 행을 확인했다. `yyyy`와 `regday`는 각각 `2026`, `11/16` 형태다. 조사 시장 행은 `kindname`에 `가을(1포기)`처럼 단위를 함께 주었다.

2026-09-28 서울 여름(고랭지) 배추 상품 등급(`200/211/02/04`)은 기존 `perDay` 01 샘플의 서울 4개 조사 시장과 모두 일치했다. 1포기 기준 경동 8,110원, B-유통 7,480원, C-유통 5,610원, K-유통 6,000원이다. 자체 API 응답에는 서울 평균 6,679원과 평년 6,860원도 있었다. [공개 테스트 요청](https://www.kamis.or.kr/service/price/xml.do?action=periodRetailProductList&p_startday=2026-09-28&p_endday=2026-09-29&p_itemcategorycode=200&p_itemcode=211&p_kindcode=02&p_productrankcode=04&p_countrycode=1101&p_convert_kg_yn=N&p_cert_key=test&p_cert_id=test&p_returntype=json), [기존 소매 샘플](../../../reference/public-data/samples/kamis/vegetable-baechu-retail.json)

## 장볼날에서의 활용

현재 `perDay` 01과 기능이 가장 많이 겹친다. 기존 수집 경로는 시장 식별·정정 감시·긴 이력에 필요한 필드를 제공한다. 전환이나 별도 적재보다 동일 조사일의 검산이 알맞다.

[17개 비교표](README.md)
