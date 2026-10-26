# 정기 수집 켜기 — 지도

Label: wayfinder:map
만든 날: 2026-10-26

## Destination

세 출처(KAMIS, 축평원, 참가격)가 GitHub Actions에서 pipeline.md 5-1의 시각에 사람 손 없이 수집·적재된다. 수집이 멈추지 않게 하는 최소 장치(키 오류·2회 연속 실패 알림, 주 1회 heartbeat)까지 돈다. 품종 대응표 없이 켠다.

## Notes

- **실행까지 포함한다** (2026-10-26). 결정 티켓과 함께 구현 조각도 `task` 티켓으로 둔다. 티켓 하나를 한 세션에 끝내고, `pnpm typecheck`·`pnpm lint`·`pnpm test`(DB를 건드리면 `pnpm --filter @workspace/price-ingest test:db`도)가 통과하면 main에 커밋한다.
- **참가격 경로가 먼저다.** 참가격 API는 2026-06-12 이후만 주고 그 범위가 유지된다는 보장이 없다. frontier에서 고를 때 참가격으로 가는 티켓(05 → 06 → 07 → 10 → 12)을 앞세운다.
- **품종 대응표 없이 켠다** (2026-10-26). 운영 DB에는 품종·`source_code_map`이 없다(`supabase/seed.sql`은 로컬 전용). 관측값은 `variety_id = null`로 쌓이고, 처음 보는 코드는 `source_item`에 매핑 `pending`으로 등록되며, `daily_quote`는 생기지 않는다. 품종 목록(`p3-variety-catalog/01`)이 정해지면 원본에서 다시 적재한다. **그때까지 원본 파일과 관측값을 지우지 않는다.** 단 기한이 있다: 운영 첫 실측(2026-10-26) 기준 참가격 조사일 하나가 약 17MB라, 지우지 않으면 2027년 2월쯤 400MB, 3월쯤 무료 한도 500MB에 닿는다 ([12](issues/12-chamga-workflow-and-catch-up.md) 진행 기록). 그 전에 품종 목록을 정하거나 보존 정리를 먼저 켠다. → 판매처로 묶은 요약과 보존 정리를 [ingest-foundation/07](../ingest-foundation/issues/07-chamga-seller-summary-retention.md)로 잡았다 (2026-10-26). 품종 목록이 확정되어(2026-10-26) 운영 DB에 넣기·적재 때 매핑·KAMIS 90일 정리를 [ingest-foundation/08~10](../ingest-foundation/issues/08-variety-catalog-to-db.md)으로 잡았다.
- **공개 저장소다.** Actions 로그를 누구나 본다. GitHub는 Secret 값을 그대로 쓴 경우만 가리고, URL 인코딩된 키는 가리지 않는다. 키·접속 주소가 로그·오류에 남지 않는 것을 첫 워크플로보다 먼저 막는다 (02). 비공개 전환은 프로토타입 뒤에 다시 본다.
- 같은 data.go.kr 키와 일일 한도를 로컬과 Actions가 같이 쓴다. 수집 시각 앞뒤로 로컬에서 대량 호출하지 않는다.
- 읽을 것: [pipeline.md](../../grocery-price/docs/30-data/pipeline.md) 3-0(접속·키·적재), 3-3(관측값 upsert), 3-5(`source_day`), 3-7(원본), 5장(일정·장애·Actions 운영). 출처별 실측은 `grocery-price/docs/30-data/sources/`(`kamis.md`, `ekape.md`, `chamgagyeok.md`). 이미 만든 것은 [ingest-foundation/03](../ingest-foundation/issues/03-ingest-package-and-actions.md)의 진행 기록. DB 작업 전에 `supabase-postgres-best-practices` 스킬.
- 이 지도는 `ingest-foundation/03`(수집 패키지와 워크플로)의 남은 일과 `search-first-view/04`(참가격 정기 수집)를 나눠 담는다. 두 티켓은 이 지도가 끝나면 닫는다 (15).

## Decisions so far

<!-- 닫힌 티켓마다 한 줄: [제목](링크): 답 요약 -->

- [오류·로그에 키와 접속 주소가 남지 않게](issues/02-redact-secrets-in-logs.md): 잘못된 형식의 DB 주소만 샜다(Invalid URL의 input) → `DbUrlError`. 인코딩 변형까지 지우는 `describeError`를 CLI가 쓴다. 워크플로 규칙 다섯 가지
- [참가격 조사일 감지·완료 규칙](issues/10-chamga-survey-day.md): `--source chamga`(날짜 없음)는 최근 금요일 2개를 source_day 기존 열로 판단해 감지·전체 수집·월요일 마지막 받기·10일 뒤 빈 조사일 닫기. `--survey-day`는 지정 조사일(과거분)
- [수집 CLI 한 흐름](issues/07-ingest-cli.md): `ingest --source … [--date|--survey-day]`. KAMIS 140품목 매일, 원본은 실행×기능×대상 기간 하나, 바로 전 파일과 같으면 duplicate, 종료 코드 0/1/2/3/4/9. 실제 키로 로컬 실측 통과
- [Supabase Free 일시정지 기준](issues/04-supabase-free-pause.md): 문턱값은 비공개, 매일 수집이 막아 줄 가능성이 높지만 미확정. 정지 1주 전 메일, 540·DNS 실패는 13에서 즉시 알림, 14에서 Storage 조회로 확인
- [원본 적재 트랜잭션 (KAMIS·축평원)](issues/05-load-kamis-ekape.md): `loadRawFile`·`loadPendingFiles`. 위치·시장은 원본 행에서, 지역·품종은 비움, 시장 시군구 불일치는 행 거부, duplicate 판정은 07로. 병합 SQL은 price-ingest 한 곳
- [참가격 원본 적재 (상품·점포)](issues/06-load-chamga.md): 마스터는 실행마다 받아 가격보다 먼저 적재. 마스터에 없는 번호는 점포는 위치만, 상품은 임시 이름으로 넣고 다음 마스터가 채움. 상품 연결 기간은 2026-06-12부터

## Not yet specified

- **러너에서 data.go.kr이 안 되면 배치를 어디서 돌릴지.** martmemo-data는 GitHub 러너에서 data.go.kr 연결 시간 초과가 2주 연속 났다. 03의 실측이 실패하면 self-hosted 러너, 다른 배치 환경(ADR 0002의 Railway 후보), 재시도 간격 늘리기 중에서 정한다. ADR 0002를 고칠 수 있다.
- **KAMIS 휴일을 어떻게 아는지.** 5-2는 공휴일 달력에 있는 날을 `empty_expected`로 본다. 달력 출처(우리 `packages/seasonal/calendar`의 공휴일, KAMIS 응답 자체)는 08을 하며 필요해지면 정한다.
- **수집 시각 조정.** 처음 2주 `source_day.first_ok_at`으로 실제 도착 시각을 재서 cron을 앞당길지 정한다 (5-1). 수집이 2주 돈 뒤에야 물을 수 있다.

## Out of scope

- 재계산(`recompute`)과 판정 스냅샷: 대응표가 없으면 계산할 집계가 없고 판정 계산식(로드맵 ②)도 없다. 품종 목록 뒤에 만든다.
- 90일 지난 KAMIS 관측값 정리와 "보존 기간 밖 재등록" 원본 복원 (pipeline.md 3-3): 대응표 없는 동안은 관측값을 지우지 않으므로 생기지 않는다. 품종 목록 뒤에 둘을 함께 켠다.
- 원본 삭제와 보존 기간 (3-7): 품종 목록 전까지 지우지 않는다.
- 상품 병합 CLI(`merge-product`): 합칠 상품이 쌓인 뒤의 운영 도구.
- 참가격 판매처 연결·`product_daily_summary`·관측값 보존 정리: 수집이 멈추지 않게 하는 일이 아니라 DB에 무엇을 얼마나 둘지의 일이다. [ingest-foundation/07](../ingest-foundation/issues/07-chamga-seller-summary-retention.md) (2026-10-26). 같은 체인 안 가격이 대부분 같다는 실측과 "인기 동네 점포만 넣자" 안을 쓰지 않는 이유가 거기 있다.
- 참가격 마스터 변경 감지(이름·용량 바뀜, `goodId` 재사용 의심, 점포 재등록 연결, 사라진 상품 판정): 몇 달 쌓인 뒤 운영자가 볼 일이고 원본에서 다시 계산할 수 있다 ([06](issues/06-load-chamga.md), 2026-10-26).
- KAMIS 5년 백필·축평원 백필: [ingest-foundation/04](../ingest-foundation/issues/04-kamis-backfill.md)에 남긴다.
- 5-2의 나머지 상황(일부만 옴, 이상치, 전일가 이어 씀, 출처 중복, 출처 오래 멈춤 등), DB 크기 감시, 수집 상태 화면, 개발계정 활용기간 만료 알림: [ingest-foundation/05](../ingest-foundation/issues/05-failure-handling.md)에 남긴다. 종료일은 01에서 확인해 사람이 달력에 적는다.
- `pg_dump` 백업, 저장소 비공개 전환: 정식 서비스 전에 다시 본다.
