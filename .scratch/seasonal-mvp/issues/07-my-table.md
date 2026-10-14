# 07. 1h 나의 식탁

Status: resolved
Blocked by: 03

## 목적

명세 3.6을 `/seasonal/my-table`에 만든다. 올해의 먹음 기록을 보여 주고 고친다.

## 할 일

- [x] 칩·보기 전환 세그먼트가 아직 없으면 만든다(cojeev `toggle-group` 우선, 명세 2.5). 03에서 옮겨 왔다.

- [x] 개수(cojeev `animated-number` 후보) / 전체, 진행률 바(cojeev `progress` 후보), 월별 막대 12개.
- [x] 스티키 필터: 이름 검색(이 화면 목록만 거른다. 초성 포함), `월별 | 계절별`, 칩. 모드를 바꾸면 필터 값을 '전체'로 되돌린다.
- [x] 목록 행: 체크박스(`tick`), 이름, 제철 달, "먹음". 체크하면 +1 pop과 토스트(cojeev `toast`, 1.8초).
- [x] 빈 결과 문구는 `copy.ts`에서 읽는다.
- [x] 데스크톱(900): 좌측 요약과 계절별 진행 바, 우측 2열 목록, 토스트는 우측 위. 내비는 3항목 그대로다.
- [x] 연도는 서울 기준 오늘의 연도다. 헤더 "나의 식탁 · 2026"도 그 값을 쓴다.

## 완료 조건

- 여기서 체크하면 2a, 2b, 1i의 ✓가 함께 바뀐다.
- 375와 1280 스크린샷.

## Answer

2026-10-14 완료.

- 초성 검색 `packages/seasonal/src/search/match-foods.ts`(테스트 4개): 이름·별칭 부분 일치, 초성만 쓴 검색어는 초성끼리 비교, 띄어쓰기 무시, 이름이 검색어로 시작하는 품종을 앞에. 10(전역 검색)에서 그대로 쓴다. `es-hangul`은 apps/web에서 packages/seasonal로 옮겼다.
- 화면 `features/seasonal/my-table/`(클라이언트). 올해·이번 달은 `useToday()`, 기록은 먹음 기록 store. 필터 상태는 화면 안 상태(주소에 남기지 않음).
- cojeev: `animated-number`(개수), `checkbox`(tone yellow), `toggle-group`(월별|계절별), `toast`(compact, 1.8초). `progress`는 설치했지만 명세의 5px 막대와 모양이 달라 직접 그렸다.
- 토스트 위치: cojeev 토스트 CSS 레이어가 Tailwind보다 뒤라 위치 클래스에 `!`를 붙였다. 모바일은 하단 내비 위, 데스크톱은 오른쪽 위.
- `packages/ui` exports의 `./lib/*`는 `.ts`만 잡아서 cojeev checkbox가 쓰는 `lib/cojeev/selector.tsx`를 따로 연결했다.
- `ui:add` 임시 CSS가 비어 있으면 CLI가 오류로 끝나던 문제를 고쳤다(17ea899).
- 검증(375·1280): "ㅈㅇ" → 전어·바다장어·오징어, 체크 → 개수·진행률·월별 막대·토스트("+1 · 전어 — 올해 4번째 제철음식"), 빈 결과 문구, 계절별 → 겨울 22개, 데스크톱 2열·계절별 진행 바, `get_errors` 없음, `next build` 통과.
