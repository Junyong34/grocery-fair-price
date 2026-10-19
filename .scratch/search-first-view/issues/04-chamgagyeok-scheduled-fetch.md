# 04. 참가격 정기 수집

Status: ready-for-agent
Type: task
Blocked by: ingest-foundation/01, ingest-foundation/02

## 목적

참가격 API는 2026-06-12 이후만 주고, 그 범위가 계속 유지된다는 보장이 없다. 상품 차트에 쓸 이력을 오픈 전부터 쌓는다. 원본은 Supabase Storage, 정제 데이터는 Postgres (ADR 0002). spec.md 결정 5, 6. 구현은 `ingest-foundation/03`의 수집 패키지 안에서 한다. 늦을수록 이력을 잃으므로 01·02가 끝나면 가장 먼저 한다.

## 할 일

- [ ] 조사일 판별: 금요일마다 호출해 빈 `<result/>`가 아닌 날을 조사일로 본다.
- [ ] 받을 범위: 식품 상품 전체 × 전 점포. 상품별 호출(`goodId`, 약 114KB)과 점포별 호출(`entpId`, 약 100KB) 중 호출 수가 적은 쪽을 고른다. 호출 한도 2,000건/일 안에 들어가는지 계산한다.
- [ ] 받는 때: 매일 상품 3개로 새 조사일을 확인(pipeline.md 5-1). 찾은 조사일은 그 다음 날과 그다음 주 월요일에 전체를 받고, 행 수가 늘었으면 다시 적재한다(10-09 등록 지연 사례).
- [ ] 06-12부터 지금까지 빠진 조사일을 한 번에 채운다.
- [ ] 저장 형식: 원본은 조사일·호출 단위로 Storage에(`ingest-foundation/03`의 경로 규칙), 용량 추정. 정제 결과는 관측값 테이블에 upsert
- [ ] GitHub Actions 일정, 실패 알림
- [ ] `.env` 키가 커밋되지 않는지 확인 (`scripts/check-no-secrets.sh`)

## 완료 기준

- 06-12 이후 모든 조사일의 원본이 Storage에, 관측값이 Postgres에 있다.
- 다음 조사일에 사람 손 없이 저장된다.
