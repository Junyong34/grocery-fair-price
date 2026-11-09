# 13. 새 공공 API 출처를 붙이는 절차

Status: needs-triage
Type: task
Blocked by: 05, 06, 08

## 목적

출처를 하나 더할 때마다 같은 순서로 하게 만든다. 수천 개로 가는 길은 출처 추가다.

## 절차 초안

1. 조사: 응답 저장(`reference/public-data/samples/`), 출처 문서(`docs/30-data/sources/<name>.md`), api-spec.md에 데이터셋 ID. 소매인지 도매인지, 조사 주기, 분류 체계, 이력 범위
2. 스키마: `source` 체크 제약(`source in ('kamis','ekape','chamga')`이 표 여러 곳에 있다)에 새 출처를 더하는 마이그레이션
3. 수집: API 클라이언트·계약 테스트, 원본 Storage 경로, 적재 어댑터, 워크플로·호출 예산·알림·heartbeat
4. 분류: 출처 분류 → 우리 카테고리 대응표(05)
5. 카탈로그: 첫 수집 뒤 AI 제안(06) → 승인(07·08)
6. 화면: 출처 표기(라이선스·출처 문구, p2/07), 판정에 쓸지 시세만 보일지

## 할 일

- [ ] 위 절차를 문서로 확정 (`grocery-price/docs/30-data/` 또는 프로젝트 스킬)
- [ ] 첫 대상 출처를 정한다. 후보 조사는 public-data-survey.md, gov-price-sites.md. 소매가 아닌 출처는 판정에 쓰지 않는다는 규칙을 같이 정한다

## 완료 기준

- 절차 문서가 있고, 첫 대상 출처가 정해져 티켓으로 나뉜다.
