# 10. 최근일자 지역별 도.소매가격정보(상품 기준)

**시세 화면 분류** · 기존 데이터로 구현

지역 하나를 지정해 최근 도매·소매 가격 요약을 조회한다. 6번과 마찬가지로 원천 ‘상품’ 등급 기준이다. [KAMIS 공식 명세](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=10)

## 요청

- `GET /service/price/xml.do?action=dailyCountyList`
- 공통 인증·형식은 `p_cert_key`, `p_cert_id`, `p_returntype`이다. 조회 조건은 `p_countycode`이다.
- `p_countycode`를 사용한다. 이 명세는 소매 24개, 도매 5개 선택 지역을 열거한다. 이 목록은 실제 응답에서 모든 품종을 제공한다는 보장이 아니다. 성공 코드는 이 문서에 `0`으로 표기돼 있다.

## 제공 데이터

`county_code`, `county_name`에 구분·부류, `productno`, 품목명·단위, `lastest_date`, `day1`~`day4`/`dpr1`~`dpr4`, `direction`, `value`가 붙는다.

## 실측 및 중복 확인

2026-11-17에 서울(`p_countycode=1101`)을 조회했다. 실제 성공 코드는 명세의 `0`과 달리 `error_code="000"`이었다. `price[]` 191행 중 소매 117행, 도매 74행이었다. `lastest_date` 대신 `lastest_day`가 왔다. 구분 코드와 이름은 단일 문자열 대신 `["01","01"]`·`["소매","소매"]`처럼 같은 값이 반복된 배열이었다.

2026-11-16 서울 상품 등급 쌀 소매의 `dpr1`은 20kg(`productno=272`) 64,038원, 10kg(`1537`) 35,444원이었다. 동일 조건의 `perDay` 01 관측값 각각 8건·9건을 산술평균해 반올림한 결과와 일치했다. 1일·1개월·1년 전 비교값의 가중 방식은 이 대조에서 확인하지 않았다.

## 장볼날에서의 활용

지역별 최근 비교용이다. 소매 지역과 조사 시장은 `perDay` 01에 있다. 축산 일부는 축평원의 시도 시세와도 겹칠 수 있다. 지역 집계값을 개별 점포 판매가처럼 표시하지 않는다.

[17개 비교표](README.md)
