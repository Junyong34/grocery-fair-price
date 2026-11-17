# 3. 월별 도.소매가격정보 (※ 축평원 데이터는 제외됨)

**시세 화면 분류** · 검산·비교

원천 품목·품종·등급·지역 조합의 월별 도매·소매 집계와 연평균이다. KAMIS는 축평원 데이터가 제외된다고 명시한다. [KAMIS 공식 명세](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=3)

## 요청

- `GET /service/price/xml.do?action=monthlySalesList`
- 공통 인증·형식은 `p_cert_key`, `p_cert_id`, `p_returntype`이다. 조회 조건은 `p_yyyy`, `p_period`, `p_itemcategorycode`, `p_kindcode`, `p_graderank`, `p_countycode`, `p_convert_kg_yn`, `p_itemcode`이다.
- `p_yyyy`는 조회 연도, `p_period`는 기간이며 기본 3년이다. 이 API의 `p_graderank`를 다른 API의 `p_productrankcode`와 동일 코드로 가정하지 않는다.

## 제공 데이터

`productclscode`는 소매 `01`·도매 `02`, `yyyy`는 연도, `m1`~`m12`는 각 월, `yearavg`는 연평균이다. `caption`에 가격 구분, 원천 부류·품목·등급과 단위 예시가 있다.

## 실측 및 중복 확인

2026-11-17에 서울 쌀 20kg 상품 등급(`100/111/01`, `p_graderank=1`)을 기준연도 2026, 기간 3년으로 요청했다. `error_code="000"`, `price[]`에 중도매인 판매가격 `02`와 소매 `01`이 각각 담겼다. 각 `item[]`에는 기준연도와 앞선 세 해(2023~2026)가 있었고, 2026년 12월 값은 `"-"`였다. 전국 쌀 10kg(`100/111/10`, 지역 공란)에서는 `price`가 소매 구분 하나를 담은 객체였고, `p_period=1`이어도 2023~2026년이 왔다. 요청에서 기간이 적용되는 범위는 이 두 예시로 일반화하기 어렵다.

2026년 10월 서울 쌀 20kg 소매 `m10`은 63,635원이었다. `perDay` 01의 같은 규격·지역 90건을 조사일별 평균으로 만든 뒤 20개 날짜에 동일 가중치를 주면 63,635.36원으로 일치했다. 관측값 90개에 그대로 동일 가중치를 주면 63,975.56원이었다. 전국 쌀 10kg의 월평균 12개는 같은 기간 8번의 월별 값과 모두 일치했다. [8번 추이 대조](08-monthly-trend.md)

## 장볼날에서의 활용

제철달력에 월별 소매 시세를 붙일 때 KAMIS 집계와 내부 월 집계를 대조할 수 있다. 원천 조사 단위와 표본 가중 방식이 동일한 경우에만 차이를 해석한다.

[17개 비교표](README.md)
