# 07. 수집 CLI 한 흐름

Status: open
Type: task (AFK)
Blocked by: 05

## Question

`ingest --source kamis|ekape|chamga --date YYYY-MM-DD` 하나로 실행 기록 → API 호출 → 원본 Storage 업로드 → 대조(최근 7일) → `pending_load` 적재 → 실행 기록 마감이 도는가? 워크플로는 이 명령만 부른다 (pipeline.md 6장 "나중에 옮기기 쉽게").

## 할 일

- [ ] 진입점: `packages/price-ingest`에 `bin`과 `pnpm --filter @workspace/price-ingest ingest …` 스크립트
- [ ] 원본을 먼저 올리고 적재한다. DB 연결이 안 되어도 업로드는 끝내고 0이 아닌 종료 코드로 끝난다 (다음 실행의 대조가 이어 받는다)
- [ ] 호출 예산: 실행마다 참가격 1,500 / 축평원 800 / KAMIS 8,000 (5-2 한도 초과 행). 예산이나 게이트웨이 한도 오류에 닿으면 그날은 멈춘다
- [ ] 호출 실패는 2s/4s/8s로 3번 재시도. 키 오류(`SERVICE_KEY_IS_NOT_REGISTERED_ERROR`, 코드 30, HTTP 401·403)는 재시도하지 않고 그 출처를 멈추며 알림이 읽을 수 있게 `ingest_run.error_code`를 남긴다 (13이 쓴다)
- [ ] 출처별 받을 날짜 범위의 기본값: KAMIS D-3~D-1(품목당 기간 호출 1회), 축평원 D-1·D-2·D-3 (5-1). 참가격은 10이 정한다
- [ ] 같은 대상 다시 받기: 올리기 전에 같은 묶음 라벨·같은 대상 기간의 **바로 전 파일**과 내용 해시가 같으면 올리지 않고 `raw_object`에 `duplicate`(`duplicate_of`)로 기록만 한다 (3-7). 해시만으로 아무 파일과 비교하면 되돌린 정정을 잃는다 (05 Answer 4)
- [ ] 종료 코드 규칙을 적는다: 성공 / 부분 실패 / 키 오류 / DB 실패. 13이 이 코드로 알림을 고른다
- [ ] 로컬에서 실제 키로 KAMIS·축평원 하루치를 로컬 DB에 한 번 돌려 본다 (수집 시각 앞뒤는 피한다)

## 완료 기준

- 로컬에서 명령 하나로 KAMIS·축평원 하루치가 Storage(로컬)와 DB에 들어가고, DB를 끈 채 돌린 뒤 켜고 다시 돌리면 빠진 원본이 적재된다.
