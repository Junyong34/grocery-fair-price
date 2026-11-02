# 06. 출처 조사 반영: 앱 제철 보정

Status: needs-info
Type: task (AFK)
Blocked by: 01, `research-months.md` 완료

## 목적

`research-months.md`에서 출처와 다르다고 나온 종의 앱 제철을 고친다(grilling Q16).

## 규칙

- 근거 신뢰 "높음"·"중간"인 종만 `packages/seasonal/src/data/food-season-corrections.json`에 범위와 근거(출처 URL, 확인 날짜)를 적는다. 2a · 2b · 인쇄물에도 같이 반영된다.
- "낮음"이거나 근거 없는 종은 지금 값을 두고, 화면의 안내 문구로 가린다.
- 고친 종은 01의 회 화면 달도 맞춘다.
- 인쇄물 스냅샷이 바뀌면 확인하고 갱신한다.
