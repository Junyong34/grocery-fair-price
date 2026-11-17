# 11. 친환경농산물 품목별 가격정보('05~'20.3.)

**시세 화면 분류** · 과거 자료

2005년~2020년 3월의 친환경농산물 소매 조사값을 원천 품목·규격과 하루를 지정해 조회한다. 5번과 조사 시기가 같고 조회 기준이 하루다. [KAMIS 공식 명세](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=11)

## 요청

- `GET /service/price/xml.do?action=NaturePriceList`
- 공통 인증·형식은 `p_cert_key`, `p_cert_id`, `p_returntype`이다. 조회 조건은 `p_regday`, `p_itemcategorycode`, `p_itemcode`, `p_kindcode`, `p_productrankcode`, `p_countrycode`, `p_convert_kg_yn`이다.
- 조회일은 `p_regday`다. 지역은 `p_countrycode`, 등급은 `p_productrankcode`를 쓴다.

## 제공 데이터

`countyname`, `countyname1`, `marketname`, `unit`, `regday`, `price`, `seqnum`과 그룹·표 병합 필드가 명세에 있다. 응답 `regday`는 날짜·시각 형식으로 적혀 있다.

## 실측 및 중복 확인

2026-11-17에 명세의 샘플 조건으로 2019-11-28 서울 유기농 쌀 10kg(`100/111/01/07`, 지역 `1101`, kg 환산 요청은 `N`)을 조회했다. `data.error_code="000"`, `data.item[]` 2행이었다. 평균 행과 서울 B-유통 행은 각각 43,200원이었다. 응답의 `regday`는 `2019-11-28 00:00:00.0`이고, 두 행 모두 명세에 기재된 `countyname1`이 생략됐다.

서울 B-유통의 43,200원/10kg은 같은 날 5번 기간 응답과 `perDay` `se_cd=03`의 관측값 1건에 모두 일치했다. [5번 구 친환경 이력 대조](05-historical-eco-period.md)

## 장볼날에서의 활용

과거 특정 날짜의 근거 표나 제공 평균을 확인할 수 있다. 기간 차트의 조사 시장별 관측값은 기존 `perDay` 03으로도 확보할 수 있다.

[17개 비교표](README.md)
