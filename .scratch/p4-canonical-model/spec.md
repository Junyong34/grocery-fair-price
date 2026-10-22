# P4. 어댑터 · 통합 데이터 모델 — 작업 분해

로드맵 ① 수집 기반의 일부(이전 번호 P4): 서로 다른 출처를 하나의 통합 데이터로 만드는 규칙을 정한다. 설계 문서는 [pipeline.md](../../grocery-price/docs/30-data/pipeline.md) 3장이고, 실제 기준은 마이그레이션(`supabase/migrations/`)과 수집 패키지의 테스트다. 별도 `canonical-model.md`, `adapters.md`는 만들지 않는다 (2026-10-19).

## 배경

세 API는 필드 이름, 코드 체계, 단위, 갱신 주기가 모두 다르다.

| | KAMIS | 축평원 | 참가격 |
|---|---|---|---|
| 형식 | JSON | XML | XML |
| 가격 단위 | 품목별 단위 + kg 환산가 | 원/100g | 상품별 용량 |
| 성공 코드 | `"0"` | `00` | `00` |
| 규격 | 등급, 품종 | 등급·원산지 혼합 | 상품 속성 |
| 행사 | 없음 | 없음 | 있음 |
| 판매처 | 시장(전통시장 실명, 대형유통 익명) | 시도 | 판매처·점포 실명 |

통합 모델은 이 차이를 흡수하되, 화면이 출처를 신경 쓰지 않고 쓸 수 있어야 한다.

## 원칙 (이미 정해진 것)

- 원천 응답은 **그대로 보관(raw)** 하고 정규화 데이터는 별도로 만든다. 단위 규칙이 바뀌면 다시 계산할 수 있어야 한다. (public-data-survey.md 3장)
- 저장소는 Supabase Postgres + Storage로 정했다 ([ADR 0002](../../grocery-price/docs/adr/0002-supabase-and-github-actions.md)). 스키마는 Postgres DDL까지 다룬다. Supabase 전용 기능에는 기대지 않는다.

## 이슈 목록

| # | 제목 | 유형 | 상태 | 선행 |
|---|---|---|---|---|
| 01 | 통합 스키마 설계 | task | resolved (pipeline.md 3장) | p2/02, 03, 04 |
| 02 | 저장소 결정 | grilling | resolved (ADR 0002) | - |
| 03 | 어댑터 구현과 일관성 테스트 | task | resolved (2026-10-22, `packages/price-ingest/src/adapt`) | 01, p2/12 |

## 로드맵과의 관계

- 로드맵 순서(P3 → P4)와 달리 스키마는 품종 목록 확정 전에 시작할 수 있다. 스키마는 품종을 참조만 하면 되기 때문이다. 품종 목록이 필요한 부분(원천 코드 → 품종 매핑 데이터 자체)은 03에서 `p3-variety-catalog/01`을 기다린다.
- 저장소는 2026-10-19 ADR 0002로 정했다. 01의 DDL·RLS·마이그레이션은 `ingest-foundation/02`에서, 03의 어댑터는 `ingest-foundation/03`의 수집 패키지 안에서 만든다.
