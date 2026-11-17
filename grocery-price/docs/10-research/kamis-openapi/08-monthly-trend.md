# 8. 월평균 가격추이 조회(상품 기준) ※ 6번 API와 연동해서 사용가능 (품목코드 연계)

**시세 화면 분류** · 검산·비교

6번의 `productno`로 찾는 월별 가격 추이로 소개된다. [KAMIS 공식 명세](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=8)

## 요청

- `GET /service/price/xml.do?action=monthlyPriceTrendList`
- 공통 인증·형식은 `p_cert_key`, `p_cert_id`, `p_returntype`이다. 조회 조건은 `p_productno`, `p_regday`이다.
- 요청표의 `productno`와 예시의 `p_productno`가 다르다. `p_regday`의 기본값은 최근 가격 조사일이다.

## 제공 데이터

문서 응답표에는 연월 `yyyymm`, 최고 `max`, 최저 `min`이 있다. 제목은 월평균이지만 응답표에는 평균 필드가 없다.

## 실측 및 중복 확인

2026-11-17에 전국 소매 쌀 10kg(`p_productno=1537`)을 기준일 2026-11-16으로 조회했다. 샘플의 `p_productno`로 HTTP 200 응답을 받았다. `price[]` 13행이 있었고 이 응답에는 `error_code`가 없었다. 2025년 12월~2026년 11월의 월별 12행에서는 각 행의 `max`·`min`이 같은 값이었다. 12개 모두 같은 규격으로 요청한 3번 월평균과 일치했다. 마지막 `yyyymm=[]` 행의 `max=36166`, `min=34007`은 이 12개 월평균의 최고·최저였다.

## 장볼날에서의 활용

이 표본에서 월별 값은 [3번 월별 집계](03-monthly-by-item.md)와 중복된다. 마지막 행은 월평균 간 범위로 해석할 수 있다. 개별 조사 시장이나 한 달 안의 가격 범위는 기존 `perDay` 01 관측값으로 계산한다.

[17개 비교표](README.md)
