# 9. 연평균 가격추이 조회(상품 기준) ※ 6번 API와 연동해서 사용가능 (품목코드 연계)

**시세 화면 분류** · 검산·비교

6번의 `productno`로 찾는 연도별 가격 추이로 소개된다. [KAMIS 공식 명세](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=9)

## 요청

- `GET /service/price/xml.do?action=yearlyPriceTrendList`
- 공통 인증·형식은 `p_cert_key`, `p_cert_id`, `p_returntype`이다. 조회 조건은 `p_productno`, `p_regday`이다.
- 요청표의 `productno`와 예시의 `p_productno`가 다르다. `p_regday`의 기본값은 최근 가격 조사일이다.

## 제공 데이터

문서 응답표에는 연도 `yyyy`, 최고 `max`, 최저 `min`이 있다. 제목은 연평균이지만 응답표에는 평균 필드가 없다.

## 실측 및 중복 확인

2026-11-17에 전국 소매 쌀 10kg(`p_productno=1537`)을 기준일 2026-11-16으로 조회했다. 샘플의 `p_productno`로 `error_code="000"`과 `price[]` 6행을 받았다. 2022년은 `max=[]`·`min=[]`였고, 2023~2026년은 연도별로 `max`·`min`이 같은 값이었다. 네 값 모두 4번의 연평균 `avg_data`와 일치했다. 예를 들어 2026년은 두 값이 35,066원이고, 4번의 그해 최고·최저는 각각 36,404원·32,331원이었다. 마지막 `yyyy=[]` 행의 `max=35066`·`min=28233`은 값이 있는 연평균들 사이의 최고·최저였다.

## 장볼날에서의 활용

이 표본의 연평균은 [4번 연도별 집계](04-yearly-by-item.md)와 중복된다. 연도별 최고·최저 및 변동성은 4번 또는 `perDay`에서 목적에 맞춰 집계한다.

[17개 비교표](README.md)
