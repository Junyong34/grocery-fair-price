# 05. 장애 처리·알림·수집 상태

Status: claimed (코드·오프라인 테스트 완료 2026-11-27. 남은 것: 로컬 DB 테스트, /admin/ingest 1280 확인, 일부만 옴은 --fill-gaps와 함께 켜짐)
Type: task
Blocked by: 03

## 목적

수집이 실패해도 화면은 마지막 정상 데이터로 계속 돌고, 사람이 알아야 할 일은 바로 알게 한다. 기준은 pipeline.md 5-2, 5-3.

## 할 일

- [ ] 5-2 표의 상황마다 감지·보정을 구현하고 테스트로 고정 (아직 안 옴, 휴일, 와야 하는데 빔, 일부만 옴, 호출 실패, 한도 초과, 정정, 전일가 이어 씀, 이상치, 출처 중복, 형식 변경, 키 만료·미등록, DB 연결 실패, 재계산 실패, 장기 정지)
- [x] 판정 스냅샷은 새 계산이 모두 성공했을 때만 한 트랜잭션으로 교체 (이미 됨: [11](11-judgment-batch.md) `judgment/cli.ts`가 `building` 묶음을 다 쓴 뒤 검사를 넘을 때만 같은 트랜잭션에서 `ready`와 `judgment_current`를 바꾸고, 아니면 `failed`로 둔다. `test/db/judgment.db.test.ts` "판정 행이 없으면 묶음을 failed로 두고 포인터를 바꾸지 않는다")
- [x] 알림: GitHub 이슈 자동 생성, 같은 원인은 하나로 묶음. 키 만료와 2회 연속 실패는 즉시 (2026-10-29, `ingest-schedule/13`)
- [x] 개발계정 활용기간 종료 30일·7일 전 알림, 운영계정 전환 절차 정리 (01의 종료일 사용) (2026-11-27, heartbeat. 절차는 알림 본문과 Answer 3. data.go.kr 화면에서의 실제 신청 단계는 확인하지 않았다)
- [x] 정기 실행 꺼짐 (2026-10-29, `ingest-schedule/14`. 50일 주기 사람 확인 일정은 운영자 달력) (공개 저장소는 60일 동안 저장소 활동이 없으면 schedule 워크플로가 꺼진다. 매일 수집이 돌아도 커밋이 없으면 꺼진다): 주 1회 heartbeat 워크플로가 (1) 수집 워크플로가 켜져 있는지 보고 꺼졌으면 `gh workflow enable`로 다시 켜고(`permissions: actions: write`), (2) 출처별 `source_day`의 마지막 `ok`가 기대보다 2일 넘게 멈췄으면 알림 이슈를 연다. heartbeat 자신도 꺼질 수 있으므로 50일 주기 사람 확인 일정을 함께 둔다 (pipeline.md 5-3-1)
- [x] Supabase Free 일시정지 기준 확인 (`ingest-schedule/04`)
- 백업(주 1회 `pg_dump`)은 **추후, 정식 서비스 전** (2026-10-20, pipeline.md 6-1). 이 이슈에서 만들지 않는다. 그 전까지 운영자 매핑은 원본으로 되살릴 수 없다는 위험을 받아들인다
- [x] DB 크기 감시 → [catalog-scale/03](../../catalog-scale/issues/03-db-size-watch.md)로 옮김 (2026-11-09): `pg_database_size`·표별 `pg_total_relation_size`를 수집 상태에 남기고 400MB를 넘으면 알림 (무료 500MB를 넘으면 읽기 전용)
  - 실측 방법은 02에서 정했다 (2026-10-21): 행당 크기는 `pnpm --filter @workspace/price-db measure`(같은 정의의 임시 표에 샘플 모양 행을 넣어 `pg_total_relation_size`), 운영 DB는 `price` 표마다 `pg_total_relation_size(oid)`와 행 수를 날마다 남긴다. 실측 1년차 465~525MB라 상단이 500MB를 넘는다. 넘을 기세면 pipeline.md 7장 "DB 용량"의 남은 순서(평년·평소가 날짜 줄이기, `daily_quote.sources` 정리, Pro)를 꺼낸다
- [x] 수집 상태 화면: 출처별 마지막 정상 날짜, `source_day` 상태, 최근 실패. 기존 `/admin` 활용 검토 (2026-11-27, `/admin/ingest`. 화면은 브라우저로 보지 못했다, 진행 기록)
- [x] 정할 것: 판정 재계산 주기 → KAMIS 수집 직후 최근 7일 평소가를 다시 낸다 (2026-10-29, `ingest-kamis.yml`의 `usual` 단계)

## 완료 기준

- 5-2의 모든 상황이 테스트로 재현되고, 화면이 읽는 집계는 마지막 정상 값을 유지한다.

## 진행 기록

- 2026-11-27: 남은 칸을 [ingest-schedule/08](../../ingest-schedule/issues/08-fill-gaps.md)·[09](../../ingest-schedule/issues/09-kamis-reregistration-watch.md)와 함께 했다. DB 크기 감시는 catalog-scale/03에서 끝나 체크만 했다.

### 5-2 상황별 현황 (첫 칸)

| 상황 | 상태 | 근거 (코드 · 테스트) |
|---|---|---|
| 아직 안 옴 | 됨 | `ingest/fill-gaps.ts` `nextDayState`(pending, 확인 횟수), `--fill-gaps`가 D-14~D-4를 다시 받음. `test/fill-gaps.test.ts`, `test/db/run.db.test.ts` "빈 날 메우기" (08) |
| 휴일 | 됨 | KAMIS·축평원은 달력 없이: 출처 전체 0건은 휴일이 아니다(08 Answer). KAMIS 소매만 0건인 날은 "일부만 옴" 판정을 하지 않는다(`ingest/partial.ts`, `test/partial.test.ts` 휴일 칸). 참가격 빈 조사일 닫기는 `chamga-schedule.ts`(ingest-schedule/10) |
| 와야 하는데 빔 | 됨 | 3번·D+3 뒤 `empty_unexpected`(08). 알림: heartbeat가 최근 14일의 그런 날을 출처마다 이슈로 연다(`alert/heartbeat.ts` `emptyDayAlerts`, `test/alert.test.ts`). 주 1회라 늦으면 6일 뒤에 안다 |
| 일부만 옴 | 됨 (KAMIS) | 새로 만듦: `ingest/partial.ts`(품목별 건수 < 최근 4주 같은 요일 ok 평균 × `kamis.partial.item_ratio` 0.5 → partial, 0건 → missing), `load/source-day.ts` `judgeKamisItemParts`가 `source_day_part(item)`에 쓰고 그날을 `partial`로. 다시 받기는 빈 날 메우기가 `partial`인 날을 함께 받는다(KAMIS는 품목마다 기간 호출이라 품목만 골라도 호출 수가 같다). `test/partial.test.ts` 4개. 참가격 기준(조사일 80%·판매처 50%)과 축평원은 만들지 않았다 |
| 호출 실패 | 됨 | `ingest/calls.ts` 2s/4s/8s, `test/ingest.test.ts` "호출 정책". 실패한 날은 `failed`(08) |
| 한도 초과 | 됨 | `calls.ts` 게이트웨이 22 → `quota_exceeded`, 실행 예산 `CALL_BUDGET`. `test/ingest.test.ts` |
| 정정 | 됨 | 보존 기간 안: `load/observation.ts` 병합(`test/db/load.db.test.ts`). 밖: `load/restore.ts`(09) |
| 전일가 이어 씀 | 됨 | `daily_quote.stale_days`(축평원만, `ekape.carried_over_days` 7, KAMIS는 쓰지 않기로, judgment.md 6-3). `test/db/quote-quality.db.test.ts` |
| 이상치 | **안 됨** | 원천 가격 상한(`adapt/draft.ts` `PRICE_UPPER_BOUND`)만 `outlier`를 단다. 5-2의 "전날 대비 ±50%, 같은 날 다른 시장 중앙값의 3배"는 `calc_param outlier.*`가 placeholder이고 pipeline 3-4가 "②에서 다시 본다"고 적었다. 집계·판정이 바뀌는 결정이라 남긴다 |
| 출처 중복 | 됨 (집계) | 집계는 `source_code_map.role = 'primary'`만 센다(`load/daily-quote.ts`). 행에 `duplicate_of_ekape` 표시는 달지 않는다(쓰는 곳이 없다). 화면 `also_reported_by`는 ③ |
| 형식 변경 | 됨 | 계약과 다른 행은 관측값에 넣지 않고 원본에만(`load-file.ts` `FORMAT_CHANGED`), 처음 보는 코드는 `pending` 매핑(`catalog/apply.ts`). 운영자에게는 실행 로그의 "거부 N"과 `/admin/catalog`의 pending으로 보인다. 별도 알림 이슈는 없다 |
| 키 만료·미등록 | 됨 | `calls.ts` `key_invalid`, 종료 코드 2, 즉시 알림(ingest-schedule/13) |
| 개발계정 활용기간 만료 | 됨 | 새로 만듦: heartbeat `accountExpiryOf`(종료 2028-10-08의 30일 전부터, 7일 전부터는 "서둘러야 한다"), 출처 `data_go_kr`·원인 `account_expiry` 이슈. `test/alert.test.ts` 2개 |
| DB에 연결 못 함 | 됨 | 원본 먼저 업로드, 종료 코드 3, 다음 실행의 대조가 적재. `test/db/run.db.test.ts` |
| 재계산 실패 | 됨 | 일자 요약 실패는 실행을 부분(1)으로 끝내고 다음 실행이 다시 낸다(`run.ts`). 판정 스냅샷은 위 칸 |
| 출처가 오래 멈춤 | 됨 (감지) | heartbeat `staleSources`(ingest-schedule/14). "다른 출처로 판정·신뢰도 낮춤"은 화면(③) 일이라 남긴다 |

### 수집 상태 화면 (`/admin/ingest`)

- `apps/web/app/admin/ingest/page.tsx`, `features/admin-ingest/`(`server/status.ts`: `ingest_writer`로 읽기만, `lib/status-view.ts` 순수 함수와 테스트 2개, `ingest-status-board.tsx` 서버 컴포넌트). 메뉴 "가격 수집 → 수집 상태", `routes.admin.ingestStatus`.
- 보이는 것: 출처별 마지막 정상 날짜(`source_day`에서 `ok`의 최댓값)와 최근 14일 끝나지 않은 날·정정 수, 출처 × 최근 14일 상태 칸, 일부만 온 품목(`source_day_part`), 최근 14일 성공하지 못한 실행(`ingest_run`).
- **브라우저로 보지 못했다.** 로컬 `.env`의 `INGEST_DATABASE_URL`이 운영 DB라 화면을 열면 운영 DB를 읽는다. 이번 작업은 운영 DB를 부르지 않기로 해서 열지 않았다. `pnpm --filter web typecheck`·`lint`, 순수 함수 테스트만 통과했다. 1280 폭 확인과 콘솔 확인이 남았다.

### 검증

- `CI=true pnpm --filter @workspace/price-ingest test` (이 티켓까지 합쳐 403개 통과, 이 티켓에서 더한 것: `test/partial.test.ts` 4개, `test/alert.test.ts` 3개), `CI=true pnpm --filter web exec vitest run features/admin-ingest features/admin-shell shared/seo` 통과, 루트 `typecheck`·`lint` 오류 0.
- **돌리지 못한 것**: `judgeKamisItemParts`·heartbeat 새 질의(`readEmptyDays`)의 SQL은 DB에서 한 번도 돌지 않았다 (Docker 꺼짐, DB 테스트도 쓰지 않았다).

## Answer

2026-11-27.

1. 5-2 표 중 **이상치**만 남긴다. 계산식이 판정 설계(②)의 placeholder라 사람이 정해야 한다. 나머지는 위 표대로 감지·보정이 있다. "출처가 오래 멈춤"의 화면 쪽(신뢰도 낮춤, 배너)과 "출처 중복"의 `also_reported_by`는 화면 설계(③) 일이다.
2. 일부만 옴은 KAMIS 품목 단위만 만들었다. 기준이 쌓이는 4주 동안은 판정하지 않는 것과 같다(기준 없는 품목은 ok). 제철이 끝나 0건이 된 품목은 4주 동안 "빠짐"으로 보인다. 시끄러우면 `kamis.partial.item_ratio`를 바꾸거나 기준을 "최근 4주 중 2주 이상 ok인 품목만"으로 좁힌다.
3. 개발계정 전환 절차 (알림 본문에 같은 내용): 종료 30일 전 heartbeat 이슈가 열리면 data.go.kr 마이페이지에서 세 개발계정(KAMIS, 축평원, 참가격)의 활용기간 연장을 신청하거나 운영계정으로 전환한다 → 키가 바뀌면 Actions Secret `DATA_GO_KR_SERVICE_KEY`와 루트 `.env`를 바꾼다 → 새 종료일을 `packages/price-ingest/src/alert/heartbeat.ts` `DEV_ACCOUNT_END`에 적는다. 운영계정 요건(활용사례 등록 등)은 확인하지 않았다.
4. 마이그레이션은 필요 없었다(`source_day_part`, `calc_param kamis.partial.item_ratio`가 이미 있다).
