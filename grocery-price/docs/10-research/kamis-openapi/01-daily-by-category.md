# 1. 일별 부류별 도.소매가격정보

**시세 화면 분류** · 검산·비교

원천 부류 하나를 조사일·지역·소매/도매 구분으로 조회한다. 한 응답에서 원천 품목·품종·등급별 가격을 비교한다. [KAMIS 공식 명세](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=1)

## 요청

- `GET /service/price/xml.do?action=dailyPriceByCategoryList`
- 공통 인증·형식은 `p_cert_key`, `p_cert_id`, `p_returntype`이다. 조회 조건은 `p_product_cls_code`, `p_item_category_code`, `p_country_code`, `p_regday`, `p_convert_kg_yn`이다.
- `p_regday` 생략 시 최근 조사일, `p_product_cls_code` 생략 시 도매, `p_item_category_code` 생략 시 식량작물, `p_country_code` 생략 시 전체지역이다. `p_convert_kg_yn` 기본값은 `N`이다.

## 제공 데이터

`item_name`, `itemcode`, `kind_name`, `kindcode`, `rank`, `unit`에 `day1`~`day7`/`dpr1`~`dpr7`이 붙는다. 조회일, 1일·1주·2주·1개월·1년 전, 평년 순이다.

## 실측 및 중복 확인

2026-11-17에 발급 키로 2026-09-28 서울 채소 소매를 요청했다. `data.error_code="000"`, `data.item[]` 50행을 받았다. 명세의 `itemcode`·`kindcode`는 실제 `item_code`·`kind_code`였고, `rank_code`도 있었다. 비교일은 `당일 (09/28)`이나 `일평년` 같은 표기였고, 결측 가격은 `"-"`였다.

여름(고랭지) 배추 상품 등급(`211/02/04`)의 당일 소매 시세는 1포기 6,679원이었다. 기존 `perDay` 01의 서울 조사 시장 8건 산술평균(6,678.75원)을 반올림한 값과 일치했다. `dpr7`의 일평년 6,906원은 자체 API가 제공한 별도 집계값이다. [기존 14일 소매 샘플](../../../reference/public-data/samples/kamis/vegetable-baechu-retail-14d.json)

## 장볼날에서의 활용

소매 관측 범위는 `perDay` 01과 겹친다. KAMIS의 비교시점과 제공 평년은 직접 들어 있는 추가 집계다. 부류별 주간 요약이나 평년 검산에 쓸 수 있다. KAMIS 제공 평년의 산식·기준연도와 장볼날 평소가의 비교 조건을 확인한다.

[17개 비교표](README.md)
