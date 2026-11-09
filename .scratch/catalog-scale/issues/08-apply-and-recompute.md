# 08. 승인 적용과 재계산

Status: done (2026-11-09)
Type: task
Blocked by: 04

## 목적

승인된 제안을 DB 카탈로그에 반영하고, 남아 있는 관측값을 다시 매핑하고, 시세 요약과 판정 묶음을 다시 만든다. 어드민(07)과 CLI가 같은 함수를 쓴다.

## 할 일

- [x] `applyProposals(tx, ids)` (`src/catalog/proposals.ts`): 제안마다 사본을 고쳐(`edit.ts`) `importSnapshot`으로 넣는다. 한 트랜잭션에서 카탈로그 표·`source_code_map` 변경, `catalog_change` 기록, 제안 상태 `applied`
- [x] 지금 `--mappings`의 재매핑·`recomputeDailyQuote` 경로를 재사용한다. 보존 기간 밖(KAMIS 90일 넘음) 연결 변경의 한계는 catalog-evolution/03 "재계산 범위와 한계"를 그대로 따른다
- [x] 판정 묶음 다시 내기: 적용 뒤 바로 돌린다(`usual --days 182` → `judgment --trigger catalog`, `--skip-judgment`로 끈다). 묶기·숨김 제안은 아직 적용하지 않아 검사 오탐은 07의 묶기에서 다시 본다.
- [x] 되돌리기: `catalog revert --ids`. 새 규격은 파생 행과 함께 지우고, 새 품종은 숨긴다. 되돌린 제안은 rejected.
- [x] DB 테스트: 연결·새 규격·새 품종·제외·상품 품목·반려·되돌리기 (`test/db/catalog-apply.db.test.ts`). 묶기(merge)는 07에서 정하기로 해 적용하면 멈춘다

## 완료 기준

- 승인 → 적용 → 판정 묶음까지 명령 하나로 돌고, 되돌리기가 테스트로 고정된다.

## Answer

- CLI: `catalog apply|reject|revert --ids 64,65,70-80 [--skip-judgment] [--dry-run]` (소유자 접속). 커밋되면 `snapshot.json`을 다시 쓴다.
- 2026-11-09 운영 dry-run: 제안 #64~126 63개를 한 번에 적용 → 카탈로그 변경 58, 매핑 32·제외 20·남은 pending 11, KAMIS 관측값 6,076개 다시 매핑, 일자 요약 1,089행, 판정 묶음 130행 ready. 3분 31초 (제안마다 사본을 내보내고 다시 넣는 왕복이 대부분). 수천 건이 되면 사본을 한 번만 넣도록 바꾼다.
