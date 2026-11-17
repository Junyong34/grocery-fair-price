# 4. 연도별 도.소매가격정보 (※ 축평원 데이터는 제외됨)

**시세 화면 분류** · 검산·비교

원천 품목·품종·등급·지역의 연도별 요약 통계다. KAMIS는 축평원 데이터가 제외된다고 명시한다. [KAMIS 공식 명세](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=4)

## 요청

- `GET /service/price/xml.do?action=yearlySalesList`
- 공통 인증·형식은 `p_cert_key`, `p_cert_id`, `p_returntype`이다. 조회 조건은 `p_kindcode`, `p_graderank`, `p_countycode`, `p_itemcode`, `p_itemcategorycode`, `p_yyyy`, `p_convert_kg_yn`이다.
- `p_yyyy`로 연도를 고른다. 공개 필드 표의 통계 산식은 확인되지 않았다.

## 제공 데이터

`div`는 연도, `avg_data`·`max_data`·`min_data`는 평균·최대·최소다. `stddev_data`·`cv_data`·`af_data`는 표준편차·변동계수·진폭계수다.

## 실측 및 중복 확인

2026-11-17에 기준연도 2026, 서울 쌀 20kg 상품 등급(`100/111/01`, `p_graderank=1`)을 요청했다. `error_code="000"`, `price[]`의 각 구분에 명세에 빠진 `productclscode`(`01` 소매, `02` 중도매인 판매가격)와 `caption`이 있었다. 각 `item[]`에는 2021~2026년 외에 `div="평년"` 행도 있었다. 전국 쌀 10kg에서는 소매 구분 하나가 `price` 객체로 왔고, 평년의 `avg_data`는 `"-"`였다.

서울 쌀 20kg의 2023~2026년 `avg_data`는 같은 조건으로 받은 3번의 `yearavg`와 소매·중도매 8개 값 모두 일치했다. 전국 쌀 10kg의 2023~2026년 연평균은 9번과 일치했다. 소매 집계는 현재 `perDay` 01의 관측 범위와 겹치며, 연간 통계와 평년 산식의 동일성은 별도로 확인해야 한다. [3번 월별 집계 대조](03-monthly-by-item.md), [9번 추이 대조](09-yearly-trend.md)

## 장볼날에서의 활용

여러 해에 걸친 시세 범위와 변동성 콘텐츠에 참고할 수 있다. `perDay` 관측값에서도 연도별 통계를 계산할 수 있으므로 차이는 집계 정의와 조회 가능 연도에서 확인한다.

[17개 비교표](README.md)
