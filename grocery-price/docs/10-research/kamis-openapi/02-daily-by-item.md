# 2. 일별 품목별 도·소매가격정보

**시세 화면 분류** · 기존 데이터로 구현

지정한 원천 품목·품종·등급의 지역별 조사 시장 일별 이력이다. 소매와 도매를 구분해 요청한다. [KAMIS 공식 명세](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=2)

## 요청

- `GET /service/price/xml.do?action=periodProductList`
- 공통 인증·형식은 `p_cert_key`, `p_cert_id`, `p_returntype`이다. 조회 조건은 `p_startday`, `p_endday`, `p_productclscode`, `p_itemcategorycode`, `p_itemcode`, `p_kindcode`, `p_productrankcode`, `p_countrycode`, `p_convert_kg_yn`이다.
- 공식 안내는 당일 기준 최근 1년 데이터만 제공한다고 명시한다. `p_productclscode` 기본값은 도매 `02`, `p_countrycode`는 전체지역, `p_convert_kg_yn`은 `N`이다.

## 제공 데이터

`itemname`, `kindname`, `countyname`, `marketname`, `yyyy`, `regday`, `price`가 명세에 있다. 행에 단위·시장 코드·원천 등록일시가 명시돼 있지 않다.

## 실호출 결과와 중복 범위

2026-11-17에 발급 키로 `periodProductList`를 직접 호출했다. 서울 여름(고랭지) 배추 상품 등급(`200/211/02/04`)을 2026-09-28~29로 소매 `01`·도매 `02` 각각 요청했다. 이후 서울 가을배추(`200/211/03/04`)를 2026-11-16 하루 소매, 11-13~16 도매로 다시 요청했다. JSON 네 조건은 재시도를 포함해 각각 15초 또는 25초 안에 HTTP 응답을 받지 못했다. 11-13~16 소매를 `p_returntype=xml`, `p_convert_kg_yn=Y`로 바꾼 요청도 15초 안에 응답을 받지 못했다. 성공 필드와 실제 행 범위는 명세 기준으로 남겨 둔다.

공식 명세의 자료 단위는 기존 `perDay` 01 소매·02 중도매와 겹칠 수 있다. 같은 날짜·지역 배추로 16번 중도매 1건과 17번 소매 4건의 일치를 이미 확인했다. 2번 자체의 일치 여부는 미확인이다. [16번 대조](16-daily-wholesale.md), [17번 대조](17-daily-retail.md)

## 장볼날에서의 활용

장볼날의 일별 소매 추이는 `perDay` 01과 겹친다. 도매 응답은 기존 `perDay` 02 중도매와 조사 대상을 확인해야 한다. 이력과 관측값 대조에는 기존 `perDay`가 시장 코드와 등록일시를 제공한다.

[17개 비교표](README.md)
