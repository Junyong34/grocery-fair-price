# 장볼날 화면 지도 · 셸 인벤토리 (2026-11-01)

지금 개발된 화면과 상태를 모두 캡처해 Claude 디자인 캔버스 하나에 흐름별로 늘어놓고, 화면마다 셸(헤더 · 2차 탭 · 하단 내비 · 뒤로 가기 · 공유 · 설정)이 어떻게 다른지 정리했다. 셸 통일 1단계의 현재 상태 기록이다.

- 캔버스 "장볼날 화면 지도": https://claude.ai/artifact/SAKQKL1rmxfKxVSPxF8RDH (비공개. 다른 사람이 보려면 페이지의 Share 메뉴에서 공유해야 한다)
- 페이지 3개, 아트보드 117개: 흐름 29 · 전체 화면 86 · 셸 불일치 2
- 같이 볼 것: 와이어프레임 캔버스 "장볼날 셸 와이어프레임"(https://claude.ai/artifact/3K7nFJzSiXLsbPyBYXRmLg), 벤치마크 `benchmark.md`

## 1. 찍은 방법

- `agent-browser`로 `http://localhost:3000`(`next dev`)을 375×812, DPR 2로 열었다. Next.js 개발 도구 버튼은 init 스크립트로 숨겼다.
- 작업 트리 기준이다. 찍는 동안 다른 세션이 명절 파일(`features/seasonal/festivals/*`, `packages/seasonal/src/data/festivals.ts` · `dish-rows.ts`)을 고치고 있어서 1g 화면은 커밋된 것과 다를 수 있다.
- 화면마다 첫 화면(뷰포트)과 전체 페이지를 찍었다. 전체 페이지는 뷰포트를 문서 높이로 늘려 찍어 하단 내비가 맨 아래에 있다. 시트 · 토스트 · 스크롤 상태는 첫 화면만 찍었다.
- 높이가 8000px을 넘는 페이지(2a 12,120 · 2b 그 달 9,376 · 1h 14,224 두 장)는 DPR 2로 찍으면 GPU 한계(16384px)에 걸려 그림이 반복되어 DPR 1로 찍었다. 캔버스 아트보드 높이 상한도 8000px이라 이 넷은 위아래 두 장으로 나눠 이어 붙였다. 3a 가을 상세(7,161)는 DPR 2지만 길어서 같은 열에 뒀다.
- 기기 저장 상태
  - `price:recent`: 품종 상세를 실제로 열어 쌓았다.
  - `price:basket`: 빈 목록과 5개 담음은 `{id, verdict, on}` 모양으로 주입했다. 판정 바뀜 알림은 양파 · 샤인머스켓의 "담을 때 판정"을 지금과 다르게(10/24 싸요 · 보통) 넣어 만들었다. 가격 데이터는 원격 DB 실데이터 그대로다.
  - `seasonal:eaten`: 1h에서 동그라미를 실제로 눌러 8개를 기록했다.
  - `seasonal:settings`: 기본값.
- 원본 PNG 89장: `/private/tmp/claude-501/-Users-devpark-workspace-devpark-grocery-fair-price/fffe6b94-0526-473e-9621-88cd83b65e77/scratchpad/shots/` (세션 임시 폴더). 첫 화면과 똑같은 전체 페이지 7장을 빼고 82장을 캔버스 자산으로 올렸다.

## 2. 캔버스 구성

| 페이지 | 내용 |
|---|---|
| 흐름 | 맨 앞 사이트맵 아트보드(라우트 트리 · 화면마다 켜지는 하단 내비 칸 · 헤더 버튼). 흐름 7개를 한 행씩, 화면 사이에 전이 스티커 |
| 전체 화면 | 왼쪽 열 가격 영역, 가운데 열 제철 영역, 오른쪽 끝 열 긴 전체 페이지. 행마다 화면 하나의 모든 상태. 재현 못 한 상태는 빨간 스티커 |
| 셸 불일치 | 화면 × 셸 요소 매트릭스 표, 불일치 12개와 화면 증거(캡처를 잘라 붙임) |

흐름 7개:

1. 시세 메인 → 검색 → 품종 상세 → 담기 → 담은 품종: P1 빈 → (검색창 탭) P2 빈 → (초성 ㅅㄱ) P2 결과 → (사과 행) P3 싸요 → (스크롤) 헤더 바 → (+ 담기) 토스트 → (목록 보기) P4
2. 시세 메인 → 최근 본 · 자주 사는 품종 → 상세: P1 최근 본 → (알약) P3 샤인머스켓 → (뒤로, 자주 사는 품종 행) P3 고등어
3. 2a → 2b → 1i 시트: 2a 맨 위 → (월별 보기) 2b 열두 달 → (11월) 2b 그 달 → (유자) 1i 시트
4. 3a → 계절 상세 → 1i, 1g → 1i: 3a 히어로 → (가을) 3a 상세 → (꽃게) 1i 시트 → (2차 탭 명절) 1g 동지 → (방어) 1i 시트
5. 제철 전역 검색 → 1i: 🔍 오버레이 → (초성 ㅂㅊ) 결과 → (배추) 1i 시트
6. 1h 먹음 기록: 비었음 → (8개 체크) 먹음 8개 → (목록 검색 ㅅㄱ) 필터
7. 2a → 내려받기 → 에디션: 2a 맨 위(PDF 받기 카드) → 내려받기 목록 → (월간 달력) 에디션 시트

## 3. 화면 × 셸 요소 매트릭스

헤더는 모든 화면이 `shared/shell/site-nav.tsx`의 `SiteHeader` 하나다. 맨 위에 붙어 있다가 8px 내리면 떠 있는 바가 된다. 제철 화면은 떠 있을 때 헤더 안에 그 화면의 2차 탭을 작게 넣는다(`HeaderSubTabs`). **굵게** 쓴 칸이 같은 영역의 다른 화면과 다른 곳이다.

| 화면 | 경로 | 헤더 타입 | 헤더 오른쪽 | 2차 탭 | 하단 내비 · 활성 | 뒤로 가기 | 공유 위치 | 설정 진입 | 보이는 제목 |
|---|---|---|---|---|---|---|---|---|---|
| P1 시세 메인 | `/` | 로고 헤더 | 없음 | 없음 | 가격 3칸 · 시세 | — | 없음 | 없음 | 큰 문구 h1 |
| P2 품종 검색 | `/search?q=` | 로고 헤더 + 본문 첫 줄 검색 입력 | 없음 | 없음 | 가격 3칸 · 시세 | **"취소" 텍스트** | 없음 | 없음 | **없음(h1 없음)** |
| P3 품종 상세 | `/prices/[variety]` | **스크롤하면 헤더 자리가 "‹ 품종 · 담기" 바** | 없음 | 없음 | **가격 3칸 · 시세 + 위에 "내가 본 가격 적기" 바** | **‹ 아이콘 버튼** | 없음 | 없음 | 품종 이름 h1 |
| P4 담은 품종 | `/basket` | 로고 헤더 | 없음 | 없음 | 가격 3칸 · 담은 품종(배지) | — | 없음 | 없음 | h1 + 편집 |
| 개인정보 처리방침 | `/privacy` | 로고 헤더 | 없음 | 없음 | **가격 3칸 · 활성 없음** | — | 없음 | **2a ⚙ 시트에서만 링크** | h1 |
| 2a 이달 | `/seasonal` | 로고 헤더 · 떠 있으면 작은 2차 탭 | **🔍 ⚙** | 이달 \| 월별 보기 | 제철 4칸 · 제철달력 | — | **월 레일 아래 떠 있는 원형** | **⚙ 헤더(여기만)** | "지금은 11월" h1 |
| 2b 열두 달 | `/seasonal/months` | 같음 | 🔍 | 이달 \| 월별 보기 | 제철 4칸 · 제철달력 | — | 없음 | 없음 | **없음(숨긴 h1)** |
| 2b 그 달 | `/seasonal/months/[month]` | 같음 | 🔍 | 이달 \| 월별 보기 + 달 타임라인 | 제철 4칸 · 제철달력 | **"← 열두 달" 텍스트 링크** | 제목 줄 오른쪽 | 없음 | h1 |
| 3a 계절 히어로 | `/seasonal/seasons` | 같음 | 🔍 | 계절 \| 명절 | 제철 4칸 · 계절 | — | 없음 | 없음 | **없음(숨긴 h1)** |
| 3a 계절 상세 | `/seasonal/seasons/[season]` | 같음 | 🔍 | 계절 \| 명절 | 제철 4칸 · 계절 | "‹ 네 계절" 텍스트 링크 | **뒤로 링크 줄 오른쪽** | 없음 | h1 |
| 1g 명절 | `/seasonal/festivals/[festival]` | 같음 | 🔍 | 계절 \| 명절 + 명절 칩 | 제철 4칸 · 계절 | —(명절 칩으로 이동) | 제목 줄 오른쪽 | 없음 | h1 |
| 1h 나의 식탁 | `/seasonal/my-table` | 로고 헤더 | 🔍 | 없음 | 제철 4칸 · 나의 식탁 | — | 없음 | 없음 | **없음(숨긴 h1, 카드 라벨)** |
| 1i 시트 | `@sheet/(.)foods/[food]` | **아래 화면 위 하단 시트(헤더 흐림)** | **🔍(2a 위여도 ⚙ 사라짐)** | **아래 화면 탭 활성 꺼짐** | **시트가 덮음** | **손잡이 · Esc · 배경(닫기 버튼 없음)** | 제목 줄 오른쪽 | 없음 | 맨 위 품종 이름 |
| 1i 페이지 | `/seasonal/foods/[food]` | 로고 헤더 | 🔍 | 없음 | **제철 4칸 · 활성 없음** | "‹ 이달의 제철" 텍스트 링크 | **뒤로 링크 줄 오른쪽** | 없음 | **그림 아래 품종 이름** |
| 내려받기 | `/seasonal/downloads` | 로고 헤더 | 🔍 | 없음 | **제철 4칸 · 활성 없음** | — | 없음 | 없음 | h1 |
| 에디션 | `/seasonal/downloads/[edition]` | 목록에서: 시트 / 직접: 로고 헤더 | 🔍 | 없음 | **제철 4칸 · 활성 없음** | 시트 손잡이 / "‹ 달력·포스터" | **본문 "공유" 텍스트 버튼** | 없음 | h1 |
| 루트 not-found | `/nope`, `/seasonal/없는-주소` | 로고 헤더 | 없음 | 없음 | **가격 3칸 · 활성 없음(제철 주소여도)** | 버튼 2개(시세 · 제철달력) | 없음 | 없음 | h1 |
| 제철 not-found | `/seasonal/months/13` 등 | 로고 헤더 | 🔍 | 없음 | 제철 4칸 · 제철달력 | 버튼 2개 | 없음 | 없음 | h1 |
| 가격 not-found | `/prices/없는-품종` | **헤더 · 내비가 두 겹(버그)** | 없음 | 없음 | **가격 3칸 × 2** | 버튼 2개 | 없음 | 없음 | h1 |

## 4. 불일치 목록

캔버스 "셸 불일치" 페이지에 같은 순서로 화면 증거가 붙어 있다. 괄호 안은 증거 캡처 이름이다.

1. **하단 내비가 영역마다 바뀐다.** 가격 화면은 3칸(시세 · 제철달력 · 담은 품종), 제철 화면은 4칸(시세 · 제철달력 · 계절 · 나의 식탁). 담은 품종은 제철에서, 계절 · 나의 식탁은 가격에서 사라지고 칸 폭과 위치가 같이 움직인다. (`p1-home-empty`, `p4-basket-filled`, `2a-top`, `1h-eaten`)
2. **헤더 오른쪽 버튼이 화면마다 다르다.** 가격 영역은 없음, 제철 영역은 🔍, 2a만 🔍 ⚙. 2a 위에 1i 시트를 열면 주소가 `/seasonal/foods/…`로 바뀌어 ⚙가 사라진다(`ThisMonthOnly`). (`p1-home-empty`, `2b-index`, `2a-top`, `1i-sheet-from-search`)
3. **검색이 3종.** P2는 페이지(`/search`, 본문 입력 + 취소, 행마다 + 담기 → P3). 제철은 헤더 🔍 command 오버레이(초성 → 1i 시트). 1h는 본문 목록 필터. 같은 "배추"가 가격 검색에서는 P3로, 제철 검색에서는 1i로 간다. (`p2-search-hits`, `2a-search-results`, `1h-filter-search`)
4. **상세가 2종이고 1i는 다시 두 모양.** P3는 페이지(‹ 아이콘 뒤로, 스크롤하면 헤더 바). 1i는 제철 화면 안에서 누르면 시트(손잡이만, 제목 맨 위), 주소로 열면 페이지("‹ 이달의 제철", 제목이 그림 아래). (`p3-apple-cheap`, `1i-sheet-from-search`, `1i-page-direct`)
5. **보이는 제목이 있는 화면과 없는 화면.** P2는 h1이 없고, 2b 열두 달 · 3a 히어로 · 1h는 h1을 `sr-only`로 숨겼다. 나머지는 h1이 보인다. (`p2-search-empty`, `2b-index`, `3a-hero`, `2b-detail-11`)
6. **공유 위치 4곳.** 2a는 월 레일 아래 떠 있는 원형, 2b 그 달 · 1g · 1i 시트는 제목 줄 오른쪽, 3a 상세 · 1i 페이지는 뒤로 링크 줄 오른쪽, 에디션은 본문 "공유" 텍스트 버튼. 가격 화면에는 공유가 없다. (`2a-top`, `1g-festival-dongji`, `3a-detail-autumn`, `downloads-edition-page`)
7. **⚙ 설정은 2a 전용.** 달력 모양 · 달 이름 · 공휴일 · 먹음 표시는 2a 헤더 ⚙로만 연다. 개인정보 처리방침 링크도 이 시트(`settings-fields.tsx`)에만 있어 가격 영역에서는 닿을 길이 없고, `/privacy`는 가격 셸(활성 칸 없음)로 뜬다. (`2a-settings-sheet`, `privacy`)
8. **P3의 떠 있는 바가 겹친다.** "내가 본 가격 적기" 바(`my-price.tsx`, 내비 위 `bottom: …+70px`)가 목록 행을 가린다. 담기 토스트는 그 바를 덮고, 내 가격을 적으면 비교 카드가 화면 아래 1/4을 가린다. (`p3-apple-scrolled`, `p3-apple-toast`, `p3-apple-myprice-set`)
9. **뒤로 가기가 다섯 가지.** "취소" 텍스트(P2), ‹ 아이콘 버튼(P3), "← 열두 달" 텍스트 링크(2b), "‹ 네 계절" · "‹ 이달의 제철" · "‹ 달력·포스터" 텍스트 링크(3a · 1i · 에디션), 시트 손잡이(1i · 에디션 시트). 화살표도 ←와 ‹가 섞여 있다. (`p2-search-empty`, `p3-apple-cheap`, `2b-detail-11`, `1i-page-direct`)
10. **시트 닫기가 제각각.** ⚙ 설정 시트와 내 가격 시트에는 "닫기" 버튼이 있고, 1i 시트와 에디션 시트에는 없다(끌어내리기 · Esc · 배경 누르기만). (`2a-settings-sheet`, `p3-apple-myprice-sheet`, `1i-sheet-from-2a`, `downloads-edition-sheet`)
11. **활성 칸 없는 화면, 꺼지는 2차 탭.** 1i 페이지 · 내려받기 · 에디션 · `/privacy` · 루트 not-found는 하단 내비에 활성 칸이 없다. 1i 시트를 열면 배경의 2차 탭 활성(이달 · 월별 보기)이 꺼지고, 떠 있는 헤더 안 작은 탭도 사라진다. (`downloads-list`, `1i-page-direct`, `1i-sheet-from-search`, `1i-sheet-from-2b`)
12. **not-found가 세 모양.** `/nope`와 `/seasonal/<맞는 라우트 없는 주소>`는 가격 메뉴의 루트 not-found(`app/not-found.tsx`), `/seasonal/months/13`처럼 `notFound()`를 부르는 제철 주소는 제철 셸 not-found(`app/seasonal/not-found.tsx`), `/prices/<없는 품종>`은 셸이 두 겹이다(아래 버그 1). (`notfound-seasonal-unmatched`, `notfound-seasonal-month13`, `notfound-price`)

## 5. 찍다가 발견한 버그 · 이상한 점

확인한 것:

1. **`/prices/<없는 품종>`의 not-found가 셸 두 겹.** 헤더 2개, 주요 메뉴 nav 4개가 DOM에 있다(로고가 두 번 보인다). `app/(price)`에 not-found가 없어 루트 `app/not-found.tsx`가 받는데, 그 파일이 `PriceShell`을 씌우고 `(price)/layout.tsx`도 `PriceShell`을 씌운다.
2. **`/seasonal/<맞는 라우트 없는 주소>`가 가격 메뉴 not-found로 뜬다.** 제철 주소인데 하단 내비가 가격 3칸이고 🔍도 없다. 제철 not-found는 `notFound()`를 부를 때만 쓰인다.
3. **1h 목록 검색의 지우기 버튼이 브라우저 기본 파란 ✕.** 팔레트 밖 색이다. P2 입력은 `[&::-webkit-search-cancel-button]:hidden`으로 숨기는데 1h 입력은 숨기지 않는다. (`1h-filter-search`)
4. **1i "가격 보기 · 준비 중"이 막혀 있는데 같은 품종의 P3가 이미 있다.** 배추는 제철 id와 가격 slug가 둘 다 `napa-cabbage`이고 `/prices/napa-cabbage`가 열린다. (`1i-sheet-from-2a-scrolled`)
5. **원격 DB의 `price.alias`가 비어 있다.** 검색 페이지가 받는 `searchIndex.aliases`가 `[]`라 별칭 결과("대패삼겹" → 삼겹살)가 어떤 검색어로도 나오지 않는다.
6. **P2 결과 없음 안내의 예시가 동작과 다르다.** "품목 이름: 호박, 소고기"라고 안내하는데 호박은 품종이 애호박 하나라 "어떤 호박인가요?" 되묻기 없이 바로 결과가 나온다. 소고기 · 고추 · 돼지고기 · 고등어는 되묻는다. (`p2-search-none`, `p2-search-item`)
7. **⚙ 설정 시트의 토글이 오른쪽 여백을 넘는다.** 토글이 321~365px에 있고 구분선은 355px에서 끝난다(375px 화면). 달력 모양 미리보기 카드 안 토요일 열도 잘려 보인다. (`2a-settings-sheet`)
8. **1i 시트가 마우스 휠로 안 내려간다.** 시트 안 `scrollHeight` 856 > `clientHeight` 708인데 휠은 움직이지 않고 PageDown은 된다. 375px 데스크톱 창 기준이고 터치는 확인하지 못했다.

확인이 더 필요한 것:

9. **개발 서버에서 `/prices/<없는 품종>`과 `/seasonal/months/13`이 HTTP 200으로 온다**(소프트 404). `/seasonal/<맞는 라우트 없는 주소>`는 404다. 스트리밍 중 `notFound()`라서일 수 있으니 `next start`로 확인해야 한다.
10. P3 스크롤 헤더 바 뒤로 "시세 2,000" 말풍선이 흐리게 비친다(헤더 `backdrop-blur`). 사소하다. (`p3-apple-scrolled`)
11. 1g "그 무렵 제철 식재료" 점선 카드가 줄 폭을 다 채우지 않아 오른쪽이 빈다. 다른 세션이 명절 화면을 고치는 중이라 지금 모습과 다를 수 있다. (`1g-festival-dongji`)

## 6. 재현 못 한 상태

실데이터로 만들 수 없어 찍지 않았다. 캔버스 "전체 화면" 페이지에 빨간 스티커로 남겼다.

| 상태 | 왜 못 찍었나 | 그 상태를 그리는 코드 |
|---|---|---|
| P2 별칭 결과("대패삼겹" → 삼겹살) | 원격 DB `price.alias`가 비어 있다 | `packages/price/src/search.ts`의 `kind: "alias"` → `apps/web/features/price/search/search-view.tsx`의 `case "alias"`, 문구 `PRICE_COPY.search.alias` |
| P3 오래됨 + 판정 있음(흐린 판정, 조사일 배지) | 오래됨 품종 6개(거봉 · 복숭아 · 참외 · 체리 · 미국산 양지 · 오징어(연근해))가 모두 판정 전이다 | `apps/web/features/price/variety-detail/verdict-card.tsx`의 `detail.stale && "opacity-45"` |
| 오류 화면 | 렌더 중 예외가 날 때만 나온다 | `apps/web/app/error.tsx`(`shared/status-view.tsx`) |
| 내린 에디션 주소 안내 | `public/downloads/manifest.json`의 `withdrawn`이 비어 있다 | `apps/web/features/seasonal/downloads/withdrawn-notice.tsx` |

처음에 재현 못 할 것으로 봤지만 실데이터에 있어서 찍은 상태: P3 표본 적음 + 판정 있음(쌀 · 고등어(국산)), 오래됨 + 판정 전(체리), 오래됨 + 표본 적음(거봉).

## 7. `docs/project-structure.md` 4.2 라우트 표와 대조

사용자가 보는 화면은 모두 "전체 화면" 페이지에 아트보드가 있다. 빠진 화면 0개.

| URL | 화면 | 아트보드(전체 화면 페이지) | |
|---|---|---|---|
| `/` | P1 시세 메인 | `s-p1-home-empty`, `s-p1-home-recent` (+ 전체) | ✓ |
| `/search?q=` | P2 품종 검색 | `s-p2-search-empty` · `-hits` · `-item` · `-typo` · `-category` · `-none` (+ 전체) | ✓ |
| `/basket` | P4 담은 품종 | `s-p4-basket-empty` · `-filled` · `-changed` · `-edit` (+ 전체) | ✓ |
| `/prices/[variety]` | P3 품종 상세 | 싸요 · 보통 · 비싸요 · 판정 전, 표본 적음 2, 오래됨 2, 스크롤 · 토스트 · 내 가격 2 (+ 전체) | ✓ |
| `/seasonal` | 2a 이달 | `s-2a-top` · `-scrolled` · `-top-eaten` · `-settings-sheet` · `-search-open` · `-search-results` (+ 전체 2장) | ✓ |
| `/seasonal/months` | 2b 열두 달 | `s-2b-index` (+ 전체) | ✓ |
| `/seasonal/months/[month]` | 2b 그 달 | `s-2b-detail-11` (+ 전체 2장) | ✓ |
| `/seasonal/seasons` | 3a 계절 히어로 | `s-3a-hero` (+ 전체) | ✓ |
| `/seasonal/seasons/[season]` | 3a 계절 상세 | `s-3a-detail-autumn` (+ 전체) | ✓ |
| `/seasonal/festivals` | 페이지 없음, 다가오는 명절로 리다이렉트 | 리다이렉트 결과 `/seasonal/festivals/dongji`를 찍었고 사이트맵에 표시 | ✓ |
| `/seasonal/festivals/[festival]` | 1g 명절 | `s-1g-festival-dongji` (+ 전체) | ✓ |
| `/seasonal/my-table` | 1h 나의 식탁 | `s-1h-empty` · `-eaten` · `-filter-search` (+ 전체 4장) | ✓ |
| `/seasonal/foods/[food]` | 1i 품종 상세(전체 페이지) | `s-1i-page-direct` (+ 전체) | ✓ |
| (제철 화면 안에서 이동) | 1i 품종 상세(하단 시트) | `s-1i-sheet-from-2a` · `-2a-scrolled` · `-2b` · `-3a` · `-1g` · `-search` | ✓ |
| `/seasonal/downloads` | 달력 · 포스터 내려받기 | `s-downloads-list` (+ 전체) | ✓ |
| `/seasonal/downloads/[edition]` | 에디션 상세(시트 · 페이지) | `s-downloads-edition-sheet`, `s-downloads-edition-page` (+ 전체) | ✓ |
| `/privacy` | 개인정보 처리방침 | `s-privacy` (+ 전체) | ✓ |
| `/admin`, `/admin/edit`, `/admin/wireframes` | 인쇄물 어드민(개발 서버 전용) | 사용자 화면이 아니라 뺐다 | — |
| `/print` | 인쇄 전용 페이지(개발 서버 전용) | 뺐다 | — |
| `/api/og` | 공유 미리보기 이미지 | 화면이 아니라 뺐다 | — |
| `/sitemap.xml`, `/robots.txt` | 검색 색인 | 화면이 아니라 뺐다 | — |

표에 없지만 찍은 화면: not-found 4가지(`s-notfound-root`, `s-notfound-price`, `s-notfound-seasonal-unmatched`, `s-notfound-seasonal-month13`).
