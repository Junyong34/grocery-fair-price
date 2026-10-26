# 10. 참가격 조사일 감지·완료 규칙

Status: open
Type: task (AFK)
Blocked by: 06, 07

## Question

참가격은 조사일(격주 금요일 전후) 입력이 2일 전~7일 뒤로 퍼지고 며칠에 나뉘어 들어온다. 매일 가볍게 감지하고, 들어왔으면 전체를 받고, 언제 그 조사일을 닫는지를 [chamgagyeok.md 5-4](../../../grocery-price/docs/30-data/sources/chamgagyeok.md) 대로 만든다. [search-first-view/04](../../search-first-view/issues/04-chamgagyeok-scheduled-fetch.md)의 본체다.

## 할 일

- [ ] 감지: 확정되지 않은 최근 금요일 2개 × 상품 3개(`1000`, `1395`, `1075`)
- [ ] 전체 수집: 식품 457개를 `goodId` 기준으로 (chamgagyeok.md 8장)
- [ ] 완료: 행 수가 두 번 연속 같고 마지막 `inputDttm`이 하루 넘게 지나면 확정. 그다음 주 월요일에 한 번 더. 금요일 뒤 10일이 지나도 비면 `empty_expected`
- [ ] 확정 상태를 어디에 두는지 (`source_day` 상태와 열로 충분한지) 정하고 `## Answer`에
- [ ] `ingest --source chamga`가 날짜 없이 위 규칙으로 돌게
- [ ] 테스트: 나뉘어 들어오는 조사일, 빈 조사일 닫기, 월요일 한 번 더

## 완료 기준

- 로컬에서 최근 조사일 하나가 감지 → 전체 수집 → 확정까지 간다.
