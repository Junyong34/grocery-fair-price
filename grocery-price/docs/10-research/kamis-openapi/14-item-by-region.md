# 14. 지역별 품목별 도.소매가격정보

**시세 화면 분류** · 기존 데이터로 구현

원천 품목·품종·등급 하나를 조회일 기준으로 지정해 지역 단위 도매·소매 가격을 비교한다. [KAMIS 공식 명세](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=14)

## 요청

- `GET /service/price/xml.do?action=ItemInfo`
- 공통 인증·형식은 `p_cert_key`, `p_cert_id`, `p_returntype`이다. 조회 조건은 `p_productclscode`, `p_regday`, `p_itemcategorycode`, `p_itemcode`, `p_kindcode`, `p_productrankcode`, `p_countycode`, `p_convert_kg_yn`이다.
- `p_productclscode` 기본값은 도매 `02`, `p_countycode` 생략 시 전체지역이다. 성공·빈 결과는 문서에서 `0`·`1`로 표기한다.

## 제공 데이터

`countyname`, `unit`, `price`, `weekprice`, `monthprice`, `yearprice`가 있다. 각각 조회일·1주·1개월·1년 전의 가격이다.

## 실측 및 중복 확인

2026-11-17에 2026-09-28 서울 여름(고랭지) 배추 상품 등급(`200/211/02/04`)의 소매 가격을 조회했다. 명세의 성공 코드 `0`과 달리 `data.error_code="000"`이었다. `data.item[]`에는 서울 행과 평균·최고값·최저값·등락률 행이 있었다. 응답표에 없는 `itemname`·`kindname`이 서울 행에 있었고, 집계 행에서는 빈 배열이었다. 등락률 행의 가격 필드는 `"-"`였다.

서울의 당일 1포기 가격 6,679원과 최고 8,110원·최저 4,320원은 `perDay` 01의 같은 조사일 서울 8건을 계산한 값과 일치했다. 1번과 비교하면 당일과 전주 값은 일치했지만 전월은 14번 6,601원, 1번 5,335원이었다. 14번의 행에는 실제 비교에 사용한 날짜가 없어 차이의 이유는 확인할 수 없었다. 화면에서 두 API의 비교값을 바꿔 쓰기 전 비교 기간 정의를 확인한다. [1번 부류별 집계 대조](01-daily-by-category.md), [기존 14일 소매 샘플](../../../reference/public-data/samples/kamis/vegetable-baechu-retail-14d.json)

## 장볼날에서의 활용

‘서울 배추와 전국 배추’ 같은 비교에 활용할 수 있다. `perDay` 01에서 지역 소매 시세를 만들 수 있으며, 동일한 조사일·원천 단위·지역 표본을 맞춘 뒤 KAMIS 제공 비교값과 대조한다.

[17개 비교표](README.md)
