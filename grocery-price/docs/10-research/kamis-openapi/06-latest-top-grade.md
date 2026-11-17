# 6. 최근일자 도.소매가격정보(상품 기준)

**시세 화면 분류** · 검산·비교

최근 조사일의 도매·소매 가격 요약이다. 제목의 ‘상품’은 원천 등급을 뜻한다. 목록의 `productno`는 7~9번 추이 조회에 쓰인다. [KAMIS 공식 명세](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=6)

## 요청

- `GET /service/price/xml.do?action=dailySalesList`
- 공통 인증·형식은 `p_cert_key`, `p_cert_id`, `p_returntype`이다.
- 요청에는 인증과 반환 형식만 있고 날짜·지역·원천 품목을 고르는 변수는 명세에 없다. 공식 URL 본문과 샘플의 호스트 표기가 달라 공개 샘플의 `www.kamis.or.kr`을 확인했다.

## 제공 데이터

구분·부류 코드와 이름, `productno`, `productName`·`item_name`, `unit`, `day1`~`day4`/`dpr1`~`dpr4`, `direction`, `value`를 제공한다. 가격은 최근 조사일과 1일·1개월·1년 전이다.

## 공개 응답 확인

공개 테스트 예시를 JSON으로 호출해 `error_code: "000"`과 `price[]`를 확인했다. 실제 조사일 키는 명세의 `lastest_date`와 달리 `lastest_day`였다. `day1`~`day4`에는 ‘당일’ 같은 비교시점 표시가 들어 있었고, 일부 전년 가격은 빈 배열 `[]`이었다. [공개 호출 예시](https://www.kamis.or.kr/service/price/xml.do?action=dailySalesList&p_cert_key=test&p_cert_id=test&p_returntype=json)

## 장볼날에서의 활용

오늘의 시세 요약에서 전월·전년 비교를 검산하거나 KAMIS 추이 코드를 찾을 때 쓸 수 있다. `productno`는 `perDay`의 `item_cd`와 바로 조인할 수 없다. 예를 들어 쌀 원천 품목 코드는 `111`이며, 실측 소매 쌀의 `productno`는 20kg `272`, 10kg `1537`이다.

[17개 비교표](README.md)
