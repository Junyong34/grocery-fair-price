# 08. 승인 적용과 재계산

Status: needs-triage
Type: task
Blocked by: 04

## 목적

승인된 제안을 DB 카탈로그에 반영하고, 남아 있는 관측값을 다시 매핑하고, 시세 요약과 판정 묶음을 다시 만든다. 어드민(07)과 CLI가 같은 함수를 쓴다.

## 할 일

- [ ] `applyProposal(ids)`: 한 트랜잭션에서 카탈로그 표·`source_code_map` 변경, `catalog_change` 기록, 제안 상태 `applied`
- [ ] 지금 `--mappings`의 재매핑·`recomputeDailyQuote` 경로를 재사용한다. 보존 기간 밖(KAMIS 90일 넘음) 연결 변경의 한계는 catalog-evolution/03 "재계산 범위와 한계"를 그대로 따른다
- [ ] 판정 묶음 다시 내기: 적용 뒤 `usual` → `judgment`를 바로 돌릴지, 다음 정기 배치를 기다릴지 선택. 판정 묶음 검사("20% 넘게 줄면 failed")가 숨김·묶기로 오탐하지 않는지
- [ ] 되돌리기: `catalog_change`의 전 값으로 되돌리는 명령
- [ ] DB 테스트: 연결·새 규격·묶기·제외 각각

## 완료 기준

- 승인 → 적용 → 판정 묶음까지 명령 하나로 돌고, 되돌리기가 테스트로 고정된다.
