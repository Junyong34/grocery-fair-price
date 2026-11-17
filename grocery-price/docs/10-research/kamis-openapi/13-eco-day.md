# 13. 친환경농산물 품목별가격정보('20.4~)

**시세 화면 분류** · 신규 화면 후보

2020년 4월 이후 친환경농산물의 원천 품목·품종·재배 방식별 가격을 조회일 기준으로 보여준다. 12번의 기간 추이를 특정 조사일 상세로 이어줄 수 있다. [KAMIS 공식 명세](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=13)

## 요청

- `GET /service/price/xml.do?action=EcoPriceList`
- 공통 인증·형식은 `p_cert_key`, `p_cert_id`, `p_returntype`이다. 조회 조건은 `p_regday`, `p_itemcategorycode`, `p_itemcode`, `p_kindcode`, `p_productrankcode`, `p_countrycode`, `p_convert_kg_yn`이다.
- `p_regday`로 하루를 고른다. 등록 지연과 휴일·비조사일 응답은 별도로 확인한다.

## 제공 데이터

`seqnum`, `countyname`, `marketname`, `unit`, `regday`, `price`가 명세에 있다. 문서의 `regday` 형식은 `yyyy-mm-dd`다.

## 실측 및 중복 확인

2026-11-17에 발급 키로 2026-11-10 서울 수미(노지) 감자 1kg(`100/152/01`, 지역 `1101`, 환산 `N`)을 조회했다. `data.error_code`는 `000`이고 `data.item[]`에 날짜 `2026-11-10`과 단위 `1kg`가 있었다. `seqnum`은 여러 조사 시장 행에서 같은 값이 반복됐다.

| 규격 | 13번의 평균 | 조사 시장 관측값 | 12번 및 `perDay` 07과 일치 |
| --- | --- | --- | --- |
| 유기농 `07` | 4,370원 | 1건 | 1/1건 |
| 무농약 `08` | 6,780원 | 8건 | 8/8건 |

유기농은 이날 조사 시장이 D-전문점 한 곳이었다. 평균을 화면에 표시할 때 조사일과 조사 시장 수를 함께 제공해야 하는 이유다. 두 규격의 평균은 표본 구성이 달라 이날의 가격 차이를 재배 방식의 효과로 해석할 수 없다. [12번 기간 조회 대조](12-eco-period.md)

## 장볼날에서의 활용

친환경 시세 상세에 조사일·조사 시장·원천 단위를 표시할 수 있다. 현재 확인한 서울 감자 상세는 기존 `perDay` 07로 구현 가능하다. 자체 API의 평균과 장볼날 집계는 표본과 집계 방식을 맞춰 비교한다.

[17개 비교표](README.md)
