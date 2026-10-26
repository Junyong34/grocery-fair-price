# 08. 빈 날 메우기와 `source_day` 상태

Status: open
Type: task (AFK)
Blocked by: 07

## Question

Actions 정기 실행은 늦거나 빠진다 (5-1). 시각에 기대지 않고 `source_day`의 빈 날을 메우는 `ingest --fill-gaps`가 KAMIS·축평원에서 어떤 규칙으로 날을 고르고 상태를 바꾸는가?

## 할 일

- [ ] 상태 전이 (3-5, 5-2 "아직 안 옴"·"와야 하는데 빔"·"휴일"): `pending` → `ok` / 3일 다시 시도 후 `empty_unexpected` / 휴일이면 `empty_expected`
- [ ] 휴일 판단: KAMIS 휴일을 무엇으로 아는지 정한다 (지도의 안개). 우리 공휴일 데이터(`packages/seasonal/src/calendar/`)를 쓸지, 주말·공휴일엔 0건이 정상이라는 규칙만 둘지. `## Answer`에
- [ ] `--fill-gaps`가 매일 실행에 함께 돌게 한다: 정한 기간(예: 최근 14일) 안에서 `ok`가 아닌 날을 다시 받는다. 호출 예산 안에서
- [ ] 테스트: 하루 빠진 실행 뒤 다음 실행이 그 날을 채운다, 휴일은 다시 받지 않는다, 3일 뒤 `empty_unexpected`

## 완료 기준

- 테스트가 통과하고, `source_day`만 보고 출처별 마지막 정상 날짜를 낼 수 있다 (14가 쓴다).
