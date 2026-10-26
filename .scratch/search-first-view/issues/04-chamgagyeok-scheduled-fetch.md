# 04. 참가격 정기 수집

Status: ready-for-agent
Type: task
Blocked by: ingest-foundation/01, ingest-foundation/02

> 2026-10-26: [ingest-schedule 지도](../../ingest-schedule/map.md)의 10(조사일 감지·완료)과 12(워크플로·빈 조사일 채우기)에서 한다.

## 목적

참가격 API는 2026-06-12 이후만 주고, 그 범위가 계속 유지된다는 보장이 없다. 상품 차트에 쓸 이력을 오픈 전부터 쌓는다. 원본은 Supabase Storage, 정제 데이터는 Postgres (ADR 0002). spec.md 결정 5, 6. 구현은 `ingest-foundation/03`의 수집 패키지 안에서 한다. 늦을수록 이력을 잃으므로 01·02가 끝나면 가장 먼저 한다.

## 할 일

- [ ] 조사일 판별: [chamgagyeok.md 5-4](../../../grocery-price/docs/30-data/sources/chamgagyeok.md)의 감지 규칙을 따른다 (최근 금요일 2개 × 상품 3개).
- [ ] 받을 범위: 식품 457개를 상품 기준(`goodId`)으로 부른다. 조사일당 457회 ([chamgagyeok.md 8장](../../../grocery-price/docs/30-data/sources/chamgagyeok.md)).
- [ ] 받는 때: 감지·완료 규칙은 chamgagyeok.md 5-4를 따른다 (행 수가 두 번 연속 같고 마지막 `inputDttm`이 하루 넘게 지날 때까지 매일 다시 받기 + 다음 주 월요일, 10일 뒤에도 비면 빈 조사일로 닫기).
- [ ] 06-12부터 지금까지 빠진 조사일을 채운다. 9개 조사일 약 4,113회라 3일로 나눈다.
- [ ] 저장 형식: 원본은 조사일·호출 단위로 Storage에(`ingest-foundation/03`의 경로 규칙), 용량 추정. 정제 결과는 관측값 테이블에 upsert
- [ ] GitHub Actions 일정, 실패 알림
- [ ] `.env` 키가 커밋되지 않는지 확인 (`scripts/check-no-secrets.sh`)

## 완료 기준

- 06-12 이후 모든 조사일의 원본이 Storage에, 관측값이 Postgres에 있다.
- 다음 조사일에 사람 손 없이 저장된다.
