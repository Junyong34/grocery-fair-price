# 15. 농축수산물 품목 및 등급 코드표

**시세 화면 분류** · 운영용

원천 부류·품목·품종 코드와 이름에 가격 구분별 조사 단위·수량·등급을 연결하는 코드표다. [KAMIS 공식 명세](https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=15)

## 요청

- `GET /service/price/xml.do?action=productInfo`
- 공개 호출에서는 `p_returntype=json`을 사용했다.
- 문서 요청·응답 표에는 다른 조회에서 쓰는 듯한 날짜·가격·시장 필드가 섞여 있다. 인증 없이 `p_returntype=json`만으로 공개 샘플에 해당하는 코드 목록을 받았다.

## 제공 데이터

`itemcategorycode`, `itemcode`, `kindcode`와 각 이름, `wholesale_unit`/`wholesale_unitsize`, `retail_unit`/`retail_unitsize`, `eco_unit`/`eco_unitsize`, `whole_productrankcode`, `retail_productrankcode`, `new_natreu_productrankcode`가 핵심이다.

## 공개 응답 확인

공개 JSON 응답은 `error_code: "000"`, `info[]`였다. 쌀 20kg(`111/01`)의 도매·소매 단위는 `kg`, 수량은 `20`이었다. 친환경 백미(`111/02`)에는 `eco_unit: "kg"`, `eco_unitsize: "4"`, 친환경 등급 `"07,08"`이 왔다. 해당 구분의 값이 없으면 일부 필드가 `[]`였다. [공개 호출 예시](https://www.kamis.or.kr/service/price/xml.do?action=productInfo&p_returntype=json)

## 장볼날에서의 활용

규격·기준 단위 연결 검산, 미등록 원천 코드 조사에 쓸 수 있다. 기존 첨부 코드표나 `perDay` 응답의 원천 코드와 일부 겹친다. 운영 카탈로그 매핑은 실제 시세 표본과 함께 확인한다.

[17개 비교표](README.md)
