# .scratch: 명세와 티켓

진행 중인 일을 찾는 입구다. 기능마다 폴더 하나(`spec.md`, `issues/NN-이름.md`)이고, 규칙은 `docs/agents/issue-tracker.md`와 `docs/agents/triage-labels.md`에 있다.

**상태의 원본은 각 티켓의 `Status:` 줄이다.** 이 표는 2026-11-12에 그 줄을 모은 것이라 어긋날 수 있다. 지금 열린 티켓은 저장소 루트에서 이 명령으로 다시 찾는다.

```bash
grep -rlE "^Status: (ready-for-agent|ready-for-human|needs-triage|needs-info|claimed|open)" .scratch/*/issues
```

명세 맨 위의 `> 완료` · `> 종료` 줄은 그 명세의 큰 일이 끝났다는 뜻이다. **그래도 열린 티켓이 남아 있을 수 있으니** 아래 둘째 표를 함께 본다. 끝난 명세도 옮기지 않는다. 화면 명세로 계속 인용되기 때문이다(`apps/web/AGENTS.md`).

티켓 상태: `ready-for-agent`(에이전트가 바로 할 수 있음), `ready-for-human`(사람이 해야 함), `needs-triage`(할지 말지 정해야 함), `needs-info`(정보를 기다림), `claimed`(하는 중), `open`(wayfinder 티켓, 시작 전).

## 진행 중

| 폴더 | 무엇 | 열린 티켓 |
|---|---|---|
| `catalog-scale/` | 시세 카탈로그를 수천 개 항목으로 넓히기 (ADR 0005) | 03 · 04 · 06 · 07 `claimed`, 02 `ready-for-human`, 11 · 12 · 13 `needs-triage` |
| `ingest-foundation/` | ① 수집 기반 | 03 · 04 · 05 `ready-for-agent`, 01 `ready-for-human` |
| `ingest-schedule/` | 수집 일정과 감시 (wayfinder, `map.md`) | 08 · 09 `open` |
| `seasonal-render-perf/` | 제철달력 렌더링 속도 | 05 · 06 · 13 `ready-for-agent` |
| `baby-food-ingredient-pages/` | 이유식 재료별 궁합 페이지 | 04 `ready-for-human`(재료 본문) |
| `p3-variety-catalog/` | 표현 가능 값 카탈로그 | 02 `ready-for-human`(시세 없는 품종 대응 결정) |
| `jangbol-growth/` | 성장 과제 결정 지도 (wayfinder, `map.md`) | 02~11 `open`. 2026-11-04 이후 손대지 않았고, 그 사이 끝난 항목이 있는지 대조하지 않았다 |

## 끝났지만 열린 티켓이 남은 것

| 폴더 | 무엇 | 남은 티켓 |
|---|---|---|
| `seasonal-mvp/` | 제철달력 MVP 화면. **제철 화면 명세로 쓴다** | 12 `ready-for-agent`(태블릿 폭 · 모션 점검) |
| `calendar-download/` | 제철 인쇄물 내려받기 | 08 · 10 `ready-for-human`(GA 등록, 처리방침 게시), 09 `needs-triage`(PDF 크기) |
| `seo/` | 검색 색인 기반 | 08 `needs-triage`(품종 본문 보강) |
| `infant-food-pairing/` | 이유식 재료 궁합 시안. 판독 원자료 `image-analysis.md` | 01 `needs-info`(그림의 범위 · 형태 적합성 검토) |
| `search-first-view/` (종료) | 검색 한 번에 보는 가격 | 05 · 07 `ready-for-agent` |
| `p2-data-source-spec/` (종료) | 데이터 소스 명세 | 03 · 07 · 08 · 09 `ready-for-agent`, 06 `ready-for-human`. 필요할 때 따로 다시 연다 |

## 끝난 것

티켓이 모두 닫혔다. 화면이나 구조의 근거로 읽는다.

| 폴더 | 무엇 | 지금 쓰임 |
|---|---|---|
| `docs-and-illustration-cleanup/` | 품종 원본 · 그림 어드민 · 문서 정리(2026-11-12). 정리표에 하지 않은 두 행의 이유가 있다 | 품종 원본과 그림 어드민의 근거 (ADR 0006) |
| `price-screens/` | 가격 화면(시세 · 판정) 1차 구현 | **가격 화면 명세.** 상품 화면은 `catalog-scale/issues/10`이 이어 받음 |
| `price-db-read/` | 가격 화면을 실제 DB로 읽기 | 가격 데이터 읽기 경로의 근거 |
| `shell-unify/` | 헤더 · 하단 내비 · 설정 통일 | 셸 규칙의 근거 |
| `baby-food-fruits/` | 이유식 과일 시기 도감 | 이유식 화면 명세 |
| `sashimi/` | 제철 회 화면. `research-months.md`는 제철 보정의 출처 | 품종 원본의 근거가 인용 |
| `calendar-print/` | 달력 PDF 어드민 · 다운로드 | 인쇄물 명세. 명세의 "남은 일 2~4" |
| `seasonal-static/` | 2a 이달 정적화 | 렌더링 결정의 근거 |
| `p4-canonical-model/` | 어댑터 · 통합 데이터 모델 | 기록 |
| `catalog-evolution/` (종료) | catalog-scale로 대체된 계획 | `plans/01` · `04` · `06`을 catalog-scale 09 · 11 · 12가 인용. 지우지 않는다 |

## 보고서와 조사

티켓이 없는 폴더다.

| 폴더 | 무엇 |
|---|---|
| `docs-audit/` | 문서 점검 보고서(2026-11-10). `docs-and-illustration-cleanup`의 정리표가 이어 받음 |
| `bundle-audit/` | 번들 점검 보고서. `docs/project-structure.md`가 인용 |
| `food-months/` | 품종 ID가 바뀐 경위. `renamed-foods.ts`가 인용 |
| `food-familiarity/` | 인쇄물 품종 친숙도 5등급 명세와 비교 |
