# 03. 지자체 물가조사(15109061) 실측과 출처 문서

Status: ready-for-agent
Type: research

## 목적

농정원 "지자체 농수축산물 물가조사가격"(data.go.kr 15109061)이 MVP에서 대형마트·전통시장 비교 축으로 쓸 만한지 실측한다. 참가격에는 전통시장 점포가 0곳이다.

## 할 일

- [ ] 활용 신청. 기존 data.go.kr 키로 바로 되지 않으면 Status를 ready-for-human으로 바꾸고 신청을 요청한다.
- [ ] 실호출 샘플 저장 (`reference/public-data/samples/`, `fetch-samples.sh`와 `manifest.tsv`에 추가)
- [ ] 요청·응답 필드를 `api-spec.md`에 추가. 공식 명세와 다른 동작은 실측으로 적는다.
- [ ] 확인할 것
  - 조사 주기, 갱신 시각, 과거 조회 범위
  - 지역 범위(어느 시도가 오는지), 판매처 단위(대형마트·전통시장 이름이 나오는지)
  - 품목 수와 KAMIS·참가격 품목의 겹침, 규격 표기
  - 호출 한도, 공공누리 유형
  - 서울 열린데이터광장 OA-1170과 같은 원자료인지
- [ ] `grocery-price/docs/30-data/sources/local-gov-price.md` 작성 (p2/02~04 출처 문서와 같은 형식)
- [ ] 쓸지 말지 판정: MVP에 넣음 / MVP 이후 / 제외. 이유를 spec.md 결정 표에 추가

## 완료 기준

- 모든 응답 필드가 도메인 개념에 연결되거나 "미사용"이다.
- MVP 포함 여부가 정해져 있다.
