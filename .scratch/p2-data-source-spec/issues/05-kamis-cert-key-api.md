# 05. KAMIS 자체 API(평년·전년·전월 가격) 확인

Status: wontfix
Type: research
Blocked by: -

## 목적

판정의 핵심인 **평소가** 근거(평년, 1년 전, 1개월 전, 1주 전 가격)를 줄 수 있는 API를 찾는다. 지금 쓰는 data.go.kr판 `perDay/price`에는 이 값들이 없다.

## 사람이 할 일

- [ ] kamis.or.kr에서 Open API 인증키(`cert_key`, `cert_id`) 신청·발급
- [ ] 발급되면 `.env`에 추가 (변수명은 에이전트가 문서 확인 후 제안)

## 에이전트가 할 일 (키 발급 후)

- [ ] kamis.or.kr 서비스 중 평년·전년·전월 가격을 주는 것 찾기 (`dailySalesList`류)
- [ ] 요청·응답 필드, 코드 체계가 data.go.kr판과 같은지 확인
- [ ] 평년의 정의 (최근 몇 년 평균인지)를 근거로 남기기
- [ ] 호출 한도, 라이선스
- [ ] 결과를 `sources/kamis.md`에 추가하고, 평소가 계산식(P5)에 주는 영향을 한 단락으로 정리
- [ ] 이 API에 평년이 없다면: 직접 이력으로 계산해야 하는 범위와 백필 필요 기간 정리

## 완료 기준

- 평년·전년·전월 가격을 **받을 수 있는지 없는지**가 실호출로 확인되어 있다.

## Answer

**wontfix** (2026-10-19). KAMIS 자체 API 키(`cert_key`)를 받지 않는다. 사용자가 쓰는 키는 data.go.kr 개발계정 3개뿐이다. 평년은 data.go.kr판 `perDay/price`로 최근 5년 소매 이력을 백필해 직접 계산한다 (`ingest-foundation/04`, pipeline.md 5-4).
