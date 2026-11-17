# 7. 최근 가격추이 조회(상품 기준) ※ 6번 API와 연동해서 사용가능 (품목코드 연계)

**시세 화면 분류** · 검산·비교

6번의 `productno`로 선택한 품종·규격의 최근 가격 흐름이다. 기준일을 지정할 수 있다. [KAMIS 공식 명세](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=7)

## 요청

- `GET /service/price/xml.do?action=recentlyPriceTrendList`
- 공통 인증·형식은 `p_cert_key`, `p_cert_id`, `p_returntype`이다. 조회 조건은 `p_regday`, `p_productno`이다.
- 요청 URL 표의 `dailySalesList`와 샘플의 `recentlyPriceTrendList`가 다르다. 공개 예시 호출로 후자가 동작함을 확인했다. 기준일을 생략하면 명세상 최근 조사일이다.

## 제공 데이터

연도 `yyyy`와 40·30·20·10일 전·당일 필드 `d40`, `d30`, `d20`, `d10`, `d0`, 최고·최저 `mx`, `mn`이 있다.

## 공개 응답 확인

공개 테스트 예시에서 기준연도·전년·평년 세 행을 확인했다. 소매 쌀 10kg 요청에서는 빈 가격이 `[]`, 전체 기간의 값이 없는 평년 행의 `mx`·`mn`이 `-10`·`99999999` 문자열이었다. 이 값들은 시세로 쓰지 않는다. [공개 호출 예시](https://www.kamis.or.kr/service/price/xml.do?action=recentlyPriceTrendList&p_productno=212&p_regday=2015-10-01&p_cert_key=test&p_cert_id=test&p_returntype=json)

## 장볼날에서의 활용

시세 추이와 같은 시기의 전년·평년 비교를 검산할 수 있다. 기존 `perDay`의 일별 표본이 장볼날 추이 그래프에 더 촘촘한 데이터를 준다.

[17개 비교표](README.md)
