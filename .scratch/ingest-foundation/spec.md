# ① 수집 기반 — 작업 분해

로드맵 ① 수집 기반의 작업이다. 공공 API 3개의 데이터를 Supabase에 매일 쌓고, 장애가 나도 서비스가 마지막 정상 데이터로 계속 돌게 한다. 설계는 [pipeline.md](../../grocery-price/docs/30-data/pipeline.md), 실행 환경 결정은 [ADR 0002](../../grocery-price/docs/adr/0002-supabase-and-github-actions.md)에 있다. 2026-10-19에 만들었다.

## 정해진 것

- 출처: data.go.kr 개발계정 3개 (KAMIS 일별 도·소매, 축평원 축산물유통정보, 참가격 생필품 GW 15158701). 키는 `DATA_GO_KR_SERVICE_KEY` 하나.
- 저장: 정제 데이터는 Supabase Postgres, 원본 응답은 gzip으로 Supabase Storage.
- 수집: GitHub Actions 정기 실행. 출처마다 시각이 다르다 (pipeline.md 5-1).
- 수집 코드는 스키마가 정해지면 바로 만든다. 화면 코드는 로드맵 ④에서만 쓴다.
- 평년은 KAMIS 5년 이력으로 직접 계산한다. KAMIS 자체 API(cert_key)는 쓰지 않는다.

## 이슈 목록

| # | 제목 | 유형 | 상태 | 선행 |
|---|---|---|---|---|
| 01 | Supabase 계정·연결 정보 설정 | task | ready-for-human | - |
| 02 | 스키마·마이그레이션·RLS | task | ready-for-agent | p4/01 |
| 03 | 수집 패키지와 GitHub Actions 워크플로 | task | ready-for-agent | 01, 02, p2/12 |
| 04 | KAMIS 5년 백필과 평년 계산 입력 | task | ready-for-agent | 03 |
| 05 | 장애 처리·알림·수집 상태 | task | ready-for-agent | 03 |
| 06 | 웹앱이 Supabase를 읽는 방식 | research | ready-for-agent | 02 |

연결된 이슈: `p2-data-source-spec/12`(API 클라이언트·계약 테스트 → 03의 일부), `p4-canonical-model/01`(통합 스키마 → 02의 입력), `p4-canonical-model/03`(어댑터 → 03의 일부), `search-first-view/04`(참가격 정기 수집 → 03에서 함께).

## 진행 순서

```
01 (사람) ──┐
p4/01 → 02 ─┼─ 03 ─┬─ 04
            │      └─ 05
            └─ 06
```
