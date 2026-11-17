# 12. 친환경농산물 가격정보('20.4~)

**시세 화면 분류** · 신규 화면 후보

2020년 4월 이후 친환경농산물의 원천 품목·품종·재배 방식별 소매 시세를 기간으로 조회한다. [KAMIS 공식 명세](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=12)

## 요청

- `GET /service/price/xml.do?action=periodEcoPriceList`
- 공통 인증·형식은 `p_cert_key`, `p_cert_id`, `p_returntype`이다. 조회 조건은 `p_startday`, `p_endday`, `p_itemcategorycode`, `p_itemcode`, `p_kindcode`, `p_productrankcode`, `p_countrycode`, `p_convert_kg_yn`이다.
- 요청표의 `p_startday`로 정상 응답을 확인했다. 명세의 샘플 URL에는 `p_strartday`로 표기돼 있다. 여러 해를 걸쳐 조회할 때 `regday`에 연도가 어떻게 붙는지는 미확인이다.

## 제공 데이터

`countyname`, `marketname`, `unit`, `regday`, `price`가 명세에 있다. 원천 품목·규격은 요청으로 식별한다.

## 실측 및 중복 확인

2026-11-17에 발급 키로 서울 수미(노지) 감자 1kg을 조회했다. 요청 범위는 2026-10-01~11-16, 원천 부류·품목·품종은 `100/152/01`, 등급은 유기농 `07` 또는 무농약 `08`, 지역은 `1101`, 환산은 `N`이다. `data.error_code`는 `000`이고 가격 행은 `data.item[]`에 있었다.

| 규격 | 12번 응답 전체 | 응답의 조사일 수 | `perDay` 07과 일치한 관측값 |
| --- | --- | --- | --- |
| 유기농 1kg | 30행 | 5일 | 12/12건 |
| 무농약 1kg | 72행 | 6일 | 43/43건 |

일치 건수의 분모는 동일 기간·지역·규격의 `perDay` `se_cd=07` 관측값이다. 날짜, 조사 시장명, 단위, 원 가격을 대조했다. 자체 API의 전체 행에는 `countyname=평균`, `marketname=null`인 집계 행과 `price="-"`인 결측 행도 들어 있었다. `regday`는 `11/10`처럼 월/일이었다. [기존 `perDay` 명세와 실측](../../30-data/sources/kamis.md)

## 장볼날에서의 활용

친환경 감자의 기간 추이는 기존 `perDay` 07을 수집해 만들 수 있다. 12번의 평균 집계는 검산에 활용할 수 있다. 일반 감자와 비교할 때는 지역·조사 주간·포장 크기·기준 단위를 맞추고 규격별 조사 시장 수를 표시한다.

[17개 비교표](README.md)
