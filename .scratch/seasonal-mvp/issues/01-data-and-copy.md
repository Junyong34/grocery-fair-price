# 01. 품종·명절 데이터와 문구 초안

Status: ready-for-agent
Blocked by: —

## 목적

화면이 읽을 제철 데이터를 `packages/seasonal`에 만든다. 와이어프레임 상수(`MF`, `NOTE`, `FESTS`)는 샘플이라 쓰지 않는다.

## 할 일

- [ ] `packages/seasonal`에 `vitest`를 넣고 `test` 스크립트를 추가한다(turbo 작업에도 연결한다).
- [ ] `src/data/foods.ts`: `foods.json`에서 `tier: "verified"` 79개를 옮긴다. 필드는 id(kebab-case), 이름, 카테고리, 제철 달 배열이다. 카탈로그에 있는 품종은 카탈로그 id를 쓰고, 없는 품종은 같은 규칙으로 새 id를 정한다. 원본에서 다시 만들 수 있도록 생성 스크립트로 만든다. 손으로 옮기지 않는다.
- [ ] 파생 함수: `foodsInMonth(month)`, `seasonOfMonth(month)`, `foodsInSeason(season)`, 제철 달 표시 문자열("제철 9·10월").
- [ ] `src/data/festivals.ts` 확장: 명절별 2026·2027 양력 날짜, 기준 달, 전통 음식 목록, 그 무렵 제철 품종 id 목록. 표에 없는 연도면 날짜가 `null`이다. 전통 음식은 품종 타입과 다른 타입으로 둔다.
- [ ] `src/calendar/`: 달력 칸 계산(명세 5절에서 절기는 뺀다). 앞 빈칸, 7의 배수 맞춤, 일요일, 공휴일(`holidays-kr`), 오늘. 테스트를 먼저 쓴다.
- [ ] `src/data/copy.ts` **초안**: 달별 한 줄 문구 12, 계절 설명 4, 명절 배경 6, 빈 상태·토스트 문구. 그 달 `verified` 품종에 맞춰 새로 쓴다. 파일 머리에 "초안 — 사용자 검토 전"이라고 적는다.
- [ ] `packages/seasonal/README.md`의 폴더 표를 갱신한다.

## 완료 조건

- `pnpm --filter @workspace/seasonal test`와 `typecheck`가 통과한다.
- 달별 품종 수를 표로 남긴다(1월 15 … 11월 20). 흩어진 배치 크기 규칙을 확인할 때 쓴다.
- 문구 초안을 사용자에게 보여 준다. 검토는 화면 작업을 막지 않는다.
