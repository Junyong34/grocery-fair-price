# 5. 친환경농산물 가격정보('05~'20.3.)

**시세 화면 분류** · 과거 자료

2005년~2020년 3월의 친환경농산물 소매 조사값을 기간으로 조회한다. [KAMIS 공식 명세](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=5)

## 요청

- `GET /service/price/xml.do?action=periodNaturePriceList`
- 공통 인증·형식은 `p_cert_key`, `p_cert_id`, `p_returntype`이다. 조회 조건은 `p_startday`, `p_endday`, `regday`, `p_itemcategorycode`, `p_itemcode`, `p_kindcode`, `p_productrankcode`, `p_countrycode`, `p_convert_kg_yn`이다.
- `regday` 응답 형식은 날짜와 시각이다. 요청표의 `p_startday`와 샘플의 `p_strartday`가 다르고, 요청표에 `regday`도 종료일로 중복 기재돼 있다.

## 제공 데이터

`countyname`, `countyname1`, `marketname`, `unit`, `regday`, `price`가 가격의 맥락을 제공한다. `seqnum`, 그룹 경계와 표 병합 관련 필드도 반환한다고 명세에 적혀 있다.

## 실측 및 중복 확인

2026-11-17에 서울 유기농 쌀(`100/111/01/07`, 지역 `1101`, 환산 `N`)을 2019-11-19~12-05로 요청했다. `data.error_code="000"`, `data.item[]` 16행을 받았다. 시작일을 `p_startday`와 샘플의 `p_strartday`로 각각 보냈을 때 가격 응답은 동일했다. 두 경우 모두 가장 오래된 응답은 요청 시작일보다 이른 2019-10-17이었다. 조사일 문자열은 `2019-10-17 00:00:00.0` 형식이었고, `countyname1`은 빈 배열이었다. 특정 기간만 사용하려면 응답의 조사일로 다시 자른다.

평균 8행을 빼고 서울 B-유통의 유기농 쌀 10kg 관측값 8건을 `perDay` `se_cd=03`에서 2019-10-17~12-05로 대조했다. 날짜·조사 시장·실제 단위·가격이 모두 일치했다. `perDay`는 이 표본의 `vrty_nm`을 `20kg`으로 보내지만 실제 조사 단위는 `unit=kg`, `unit_sz=10`이었다. 포장 크기는 실제 단위 필드에서 읽는다.

## 장볼날에서의 활용

구 친환경 이력은 `perDay` 03에서도 확인했다. 5번은 KAMIS 평균을 검산할 때 쓸 수 있다. 친환경 장기 변화 특집에서 2020년 4월 경계를 넘겨 비교할 때는 조사 기준과 포장 크기의 연속성을 확인한다.

[17개 비교표](README.md)
