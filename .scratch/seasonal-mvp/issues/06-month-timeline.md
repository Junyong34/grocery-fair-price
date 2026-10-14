# 06. 2b 월별 제철 타임라인

Status: resolved
Blocked by: 03

## 목적

명세 3.2를 `/seasonal/months/[month]`에 만든다.

## 할 일

- [x] 칩·보기 전환 세그먼트가 아직 없으면 만든다(cojeev `toggle-group` 우선, 명세 2.5). 03에서 옮겨 왔다.

- [x] 모바일: 가로 스크롤 타임라인 칩 × 12(선택 칩을 가운데 근처로), 월 정보(절기 문구 없음), 보기 전환 `2열 | 4열 | 6열`, 상세 카드(2열)와 컴팩트(4·6열), 명절 줄, 이전/다음(순환), "메인에서 달력 보기"(`rootAt`).
- [x] 데스크톱: 계절 띠, 12열 타임라인(막대 1칸 = 품종 1개, 먹은 품종은 gold), 좌측 월 정보, 우측 `4열 | 6열 | 8열`.
- [x] 달 바꾸기는 라우트 이동이고, 본문은 `<ViewTransition>` 크로스페이드로 바뀐다.
- [x] 보기 전환 값은 클라이언트 상태다(`searchParams` 쓰지 않음).
- [x] 카드의 "먹었어요"는 먹음 기록 store를 토글한다(+1 pop).

## 완료 조건

- 칩, 이전/다음, 데스크톱 타임라인으로 달을 바꿀 수 있고, 뒤로 가기가 자연스럽다.
- 375와 1280 스크린샷.

## Answer

2026-10-14 완료.

- 타임라인(모바일 칩, 데스크톱 계절 띠 + 12열)은 `app/seasonal/(this-month)/months/layout.tsx`에 둬서 달을 바꿔도 남는다(칩 가로 스크롤 유지). 선택한 달은 `useParams`, "오늘"·먹은 막대는 `useToday`(Suspense).
- 본문 `MonthView`는 정적이고 `<ViewTransition key={month} share="auto" enter="auto">`로 크로스페이드한다. 브라우저 뒤로 가기는 전환 없이 바뀐다(Next 문서). 전역 `::view-transition { pointer-events: none }`과 줄인 모션 규칙을 globals.css에 넣었다.
- 보기 전환: cojeev `toggle-group`(`v-seg`). 값은 zustand(저장 안 함)라 달을 바꿔도 유지된다. 카드 모양은 그리드의 `data-mobile`/`data-desktop`을 `max-lg:`/`lg:` group 변형으로 읽어 CSS만으로 바꾼다.
- cojeev 루트의 display가 Tailwind `hidden`을 이겨서 세그먼트 표시·숨김은 바깥 div가 맡는다.
- 명절 줄은 대표 달 기준(연도별 날짜는 2a 달력이 보여 준다). 본문을 정적으로 두기 위해서다.
- `pnpm ui:add`가 cojeev.css를 반쯤 쓴 상태로 dev 서버를 깨뜨리던 문제를 고쳤다(be105c0, AGENTS.md).
- 검증(375·1280): 칩·이전/다음·데스크톱 열로 이동, 브라우저 뒤로 가기, 6열·8열 컴팩트, 카드 먹었어요 → 요약 수와 데스크톱 막대 즉시 반영, `get_errors` 없음, `next build` 통과.
