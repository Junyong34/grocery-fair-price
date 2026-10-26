# 07. 수집 CLI 한 흐름

Status: resolved
Type: task (AFK)
Blocked by: 05

## Question

`ingest --source kamis|ekape|chamga --date YYYY-MM-DD` 하나로 실행 기록 → API 호출 → 원본 Storage 업로드 → 대조(최근 7일) → `pending_load` 적재 → 실행 기록 마감이 도는가? 워크플로는 이 명령만 부른다 (pipeline.md 6장 "나중에 옮기기 쉽게").

## 할 일

- [x] 진입점: `packages/price-ingest`에 `bin`과 `pnpm --filter @workspace/price-ingest ingest …` 스크립트
- [x] 원본을 먼저 올리고 적재한다. DB 연결이 안 되어도 업로드는 끝내고 0이 아닌 종료 코드로 끝난다 (다음 실행의 대조가 이어 받는다)
- [x] 호출 예산: 실행마다 참가격 1,500 / 축평원 800 / KAMIS 8,000 (5-2 한도 초과 행). 예산이나 게이트웨이 한도 오류에 닿으면 그날은 멈춘다
- [x] 호출 실패는 2s/4s/8s로 3번 재시도. 키 오류(`SERVICE_KEY_IS_NOT_REGISTERED_ERROR`, 코드 30, HTTP 401·403)는 재시도하지 않고 그 출처를 멈추며 알림이 읽을 수 있게 `ingest_run.error_code`를 남긴다 (13이 쓴다)
- [x] 출처별 받을 날짜 범위의 기본값: KAMIS D-3~D-1(품목당 기간 호출 1회), 축평원 D-1·D-2·D-3 (5-1). 참가격은 10이 정한다
- [x] 같은 대상 다시 받기: 올리기 전에 같은 묶음 라벨·같은 대상 기간의 **바로 전 파일**과 내용 해시가 같으면 올리지 않고 `raw_object`에 `duplicate`(`duplicate_of`)로 기록만 한다 (3-7). 해시만으로 아무 파일과 비교하면 되돌린 정정을 잃는다 (05 Answer 4)
- [x] 모든 오류는 `describeError(error, redactorFromEnv())`로만 찍는다. `GITHUB_ACTIONS=true`면 시작할 때 `actionsMaskCommands`를 출력한다 (02 Answer)
- [x] 종료 코드 규칙을 적는다: 성공 / 부분 실패 / 키 오류 / DB 실패. 13이 이 코드로 알림을 고른다
- [x] 로컬에서 실제 키로 KAMIS·축평원 하루치를 로컬 DB에 한 번 돌려 본다 (수집 시각 앞뒤는 피한다)

## 완료 기준

- 로컬에서 명령 하나로 KAMIS·축평원 하루치가 Storage(로컬)와 DB에 들어가고, DB를 끈 채 돌린 뒤 켜고 다시 돌리면 빠진 원본이 적재된다.

## Answer

2026-10-26. `packages/price-ingest/src/ingest/`(호출 정책 `calls.ts`, 호출 계획 `collect.ts`, 실행 `run.ts`)와 `src/cli.ts`.

```
pnpm --filter @workspace/price-ingest ingest --source kamis|ekape [--date YYYY-MM-DD]   # 기준일 D(기본 KST 오늘)의 D-3~D-1
pnpm --filter @workspace/price-ingest ingest --source chamga --survey-day YYYY-MM-DD     # 조사일 하나 (감지는 10)
```

**정한 것** (사용자 결정 2026-10-26)
1. **KAMIS는 품목 140개를 매일 모두 부른다** (코드표 136 + 응답에만 오는 4, `kamis-items.ts`, 인벤토리 CSV에서 옮김). 지금 0건인 제철 품목도 철이 오면 잡힌다. 하루 140회(예산 8,000).
2. **원본 파일은 실행 × 기능 × 대상 기간 하나로 묶는다.** KAMIS는 140개 응답이 한 파일, 축평원은 3일 × 축종 7개가 한 파일, 참가격은 점포 마스터·상품 마스터·가격 세 파일. 묶음 라벨은 `daily`, `store-master`, `product-master`, `price`.

**동작**
- 순서: 실행 기록 → 호출 → 파일마다 (바로 전 파일과 해시 비교 → 같으면 `duplicate`로 기록만, 다르면 업로드 → `pending_load` 기록) → 최근 7일 대조 → `pending_load` 모두 적재 → 실행 마감(`status`, `calls_used`, `error_code`, `error_detail`에 개수 요약, `git_sha`).
- 중복 판정은 같은 출처·기능·라벨·대상 기간의 **바로 전 파일**과만 한다. 중복 기록의 `storage_path`는 올렸다면 가졌을 경로이고 Storage에는 없다.
- 호출 정책 (`classify`): 연결 실패·HTTP 429/5xx·게이트웨이 01/99는 2s/4s/8s로 세 번 다시. 게이트웨이 20/30/31/32와 HTTP 401/403은 `key_invalid`, 22는 `quota_exceeded`, 12는 `service_missing`으로 그 출처를 멈춘다. 계약·업무 오류와 게이트웨이 04는 그 호출만 실패로 세고 넘어간다. 예산은 호출 기록(페이지·재시도 포함)마다 세고 논리 호출 전에 본다(페이지가 여럿이면 몇 번 넘칠 수 있다). 예상 밖 오류(코드 버그)는 실행을 끊는다.
- DB가 처음부터 안 되면 실행 기록 없이 업로드까지 하고 끝난다. 중간에 끊기면 그 뒤 DB 일은 건너뛴다.
- **종료 코드** (`EXIT`, 13이 쓴다): 0 성공, 1 부분(호출 실패 `calls_failed`, 적재 실패 `load_failed`, `quota_exceeded`, `budget_exhausted`, `service_missing`), 2 `key_invalid`, 3 `db_unreachable`, 4 `storage_failed`, 9 예상 밖(CLI). 우선순위: 업로드 실패 > 키 오류 > DB 실패 > 멈춤 > 호출 실패 > 적재 실패.
- 로그는 개수·경로·오류 한 줄 요약(`errorSummary`)만, 모두 비밀값을 지운 뒤 찍는다. `GITHUB_ACTIONS=true`면 시작할 때 `::add-mask::` 줄을 낸다. **CLI는 `.env`를 스스로 읽지 않는다**: 로컬에서 돌릴 때 운영에 넣을지 로컬에 넣을지 사람이 정해 넘긴다.

**검증**
- `pnpm test` (`test/ingest.test.ts` 23개): 오류 분류 표, 다시 부르기 간격·횟수, 키 오류 즉시 멈춤, 예산, KAMIS 140회·D-3~D-1·소매만, 실패 품목을 세고 넘어감과 행·호출 기록 행 수 일치, 축평원 21회·itemCd 없음, 참가격 마스터 → 상품 마스터 → 식품 457회, 인자.
- `test:db` (`test/db/run.db.test.ts` 6개, 1997년 가짜 데이터로 끝까지): 정상(140회, 업로드·적재, 실행 ok), 같은 내용 재실행은 업로드 없이 `duplicate`, 값이 바뀌었다 되돌아오면 둘 다 올림, 한 품목 실패 → 부분(1)·`calls_used` 143, 키 오류 → 1회·종료 코드 2, DB 없이 업로드 → 종료 코드 3 → 다음 실행이 대조로 적재.
- **실제 키로 로컬 DB·Storage에** (2026-10-26 16:19 KST, 기준일 10/26): KAMIS 140회 성공 6,676행(10/23 금 5,558행, 10/24·25 주말 559행씩 = 축산만), 축평원 21회 162행(관측 81, 평년 81). 축평원을 바로 다시 돌리면 올리지 않고 `duplicate`로 기록했다. 운영 DB에는 넣지 않았다.

남은 것: KAMIS 재등록 감시 `--job`(09), 빈 날 메우기(08), 참가격 조사일 감지(10), 워크플로(11·12).
