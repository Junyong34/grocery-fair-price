# 16. 신)일별 품목별 도매 가격자료(기간설정가능, 최대1년)

**시세 화면 분류** · 신규 화면 후보

원천 품목·품종·등급·지역을 지정해 기간 내 일별 도매 가격을 조회한다. 문서 제목상의 최대 기간은 1년이다. [KAMIS 공식 명세](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=16)

## 요청

- `GET /service/price/xml.do?action=periodWholesaleProductList`
- 공통 인증·형식은 `p_cert_key`, `p_cert_id`, `p_returntype`이다. 조회 조건은 `p_startday`, `p_endday`, `p_countrycode`, `p_itemcategorycode`, `p_itemcode`, `p_kindcode`, `p_productrankcode`, `p_convert_kg_yn`이다.
- `p_convert_kg_yn` 기본값은 `N`, `p_countrycode` 생략 시 전체지역이다. 최대 1년이 고정 이력 범위인지 요청 구간 상한인지는 문서가 구분하지 않는다.

## 제공 데이터

`itemname`, `kindname`, `countyname`, `marketname`, `yyyy`, `regday`, `price`가 명세에 있다. 거래량·시장 코드·원천 등록일시가 응답표에 없다.

## 공개 응답 확인

서울 가을배추 공개 테스트 응답에서 `data.item[]`에 동일 조사일의 `평균`, `평년`, `가락도매` 행을 확인했다. `yyyy`와 `regday`는 각각 `2026`, `11/16` 형태다. 가락도매 행의 `kindname`은 `가을(10kg(그물망 3포기))`였고, 단위 전용 필드는 없었다.

2026-09-28 서울 여름(고랭지) 배추 상품 등급(`200/211/02/04`)을 기존 `perDay` 02 응답과 대조했다. 두 API 모두 가락도매의 10kg 그물망 가격이 22,600원이었다. 자체 API 응답의 평년은 25,463원이었다. [공개 테스트 요청](https://www.kamis.or.kr/service/price/xml.do?action=periodWholesaleProductList&p_startday=2026-09-28&p_endday=2026-09-29&p_itemcategorycode=200&p_itemcode=211&p_kindcode=02&p_productrankcode=04&p_countrycode=1101&p_convert_kg_yn=N&p_cert_key=test&p_cert_id=test&p_returntype=json), [기존 중도매 샘플](../../../reference/public-data/samples/kamis/vegetable-baechu-wholesale.json)

## 장볼날에서의 활용

현재 미수집 범위이며 기존 `perDay` 02로 확인한 중도매 표본부터 도매·소매 추이를 만드는 데 쓸 수 있다. KAMIS 가격 화면은 가락시장 경락가격과 중도매인 판매가격을 별도로 표시한다. 다른 품종과 지역으로 확대할 때 거래 단계·단위·가격을 다시 대조한다. [KAMIS 가격 화면](https://www.kamis.or.kr/customer/price/agricultureRetail/period.do)

[17개 비교표](README.md)
