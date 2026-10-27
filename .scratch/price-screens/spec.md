# 가격 화면(시세 · 판정) 1차 구현 — 하드코딩 데이터

와이어프레임을 실제 Next.js 화면으로 만든다 (2026-10-27 정리, 로드맵 ④의 첫 단계). 데이터는 하드코딩으로 시작하고, 다음 단계에서 Supabase로 바꾼다. 바꿀 때 화면 코드를 고치지 않도록 데이터 경계를 먼저 잡는다.

## 0. 먼저 읽을 것

- `AGENTS.md`: 레이어 규칙, 컴포넌트 찾는 순서, 라우트, 렌더링, 완료 기준
- `docs/project-structure.md`: 새 패키지 · 라우트 · 파일을 더하기 전에 읽는다
- `apps/web/DESIGN.md`: Oura 색 · 서체
- `grocery-price/GLOSSARY.md`: 시세, 판매가, 평소가, 판정, 품종, 품목, 규격, 기준 단위, 행사
- `grocery-price/docs/30-data/judgment.md`: 두 가지 질문(① 이 가게가 비싸게 파나 = 장소별 시세, ② 지금이 비싼 시기인가 = 판정), 판정 전 조건
- `grocery-price/docs/30-data/pipeline.md` 4장: 화면이 읽을 payload 모양(4-1), 입력 가격 판정(4-2)
- 와이어프레임: `prototypes/grocery-price/wireframes/final.html` (Git 밖이라 없을 수 있다. 없으면 이 프롬프트의 화면 설명을 따른다). 화살표 메모와 "데이터 점검" 표는 설계 메모라 화면에 만들지 않는다
- Next.js 16.4 문서: `apps/web/node_modules/next/dist/docs/` (Cache Components, `generateStaticParams`, `searchParams`)
- 기존 제철 셸: `apps/web/features/seasonal/components/{seasonal-shell,main-nav,sub-tabs,nav-link}.tsx`, 검색: `features/seasonal/search/`, `packages/seasonal/src/search/match-foods.ts`

## 1. 만들 화면

| 코드 | 화면 | 경로 (제안) | 색인 |
|---|---|---|---|
| P1 | 시세 메인 | `/` | index (새 홈) |
| P2 | 품종 검색 | `/search?q=` | noindex |
| P3 | 품종 상세 | `/prices/[variety]` | index |
| P4 | 담은 품종 | `/basket` | noindex |

상태: 검색 결과 없음, 품종 상세 "판정 전"(평소가 없음), 데이터 오래됨, 표본 적음, 담은 품종 빈 목록.

### P1 시세 메인
- 큰 제목 "지금 사도 될까? 품종을 검색해 보세요", 검색창(누르면 P2)
- 최근 본 품종: 판정 색 점이 붙은 알약. 기기 저장
- 자주 사는 품종: 운영자가 정한 고정 목록(데이터 파일의 상수). "많이 찾는"이라고 쓰지 않는다
- 목록 위 한 줄 설명: "시세 오늘 조사한 곳들의 중간값 · 평소 이맘때 보통 가격"
- 근거 한 줄: "시세는 10/23 조사 · KAMIS 전국 조사 시장"

### 품종 행 (P1 · P2 · P4 공통)
- 열 네 개를 모든 목록에서 같은 폭으로 맞춘다: 품종(이름 + 규격 · 기준 단위) | 판정 칩 | 가격 | 동작(+ 담기 또는 ×)
- 판정 칩: "보통 +8%"처럼 판정과 %를 같이 쓴다. 평소가가 없으면 회색 "판정 전"
- 가격 칸은 두 줄: 위는 시세 "4,500원", 아래는 "평소 4,150". 평소가가 없으면 "평소가 없음"
- 행을 누르면 P3, + 를 누르면 담기(토스트 "배추를 담았어요 · 목록 보기")

### P2 품종 검색
- 메인 검색창은 버튼처럼 동작한다. 누르면 `/search`로 가며 입력칸에 바로 포커스. 뒤로 가기로 메인에 돌아온다. `/`를 정적으로 두려고 검색어를 `/?q=`로 받지 않는다
- 치는 동안 결과가 바뀐다. 초성("ㅂㅊ"), 품목("호박" → 어떤 호박인가요? 품종 고르기), 별칭("대패삼겹" → 삼겹살), 한 글자 오타("배츄" → 혹시 이 품종인가요?)
- 빈 검색어: 최근 본 품종 + 자주 사는 품종
- 결과 없음: "트러플는 아직 판정하지 않아요", 찾는 방법(품종 이름, 초성, 품목 이름), 카테고리 알약, 자주 사는 품종. "찾으신 말은 기록해 두고" 문구는 넣지 않는다
- 모바일 키보드가 하단 내비를 덮으므로 담기 토스트에 "목록 보기"를 둔다

### P3 품종 상세 (위에서부터)
1. 앱 바: ‹ 뒤로 · 품종 이름 · 규격 · 기준 단위 · + 담기 / ✓ 담음
2. 판정 카드(판정 색 배경): 큰 판정 "보통", "평소보다 8% 높아요", 두 칸
   - 지금 시세 4,500원 (1포기) / 설명 "10/23 조사한 45곳 가격의 중간값"
   - 평소가 4,150원 (1포기) / 설명 "이맘때 보통 이 정도예요"
3. 조사 범위 막대: "10/23 조사한 45곳의 시세 범위", 싼 곳 · 비싼 곳, 평소 범위 띠, 시세 핀
4. 어디서 얼마에 팔까 (장소 비교, 판정을 매기지 않는다)
   - 위에 업태별 중간값 두 칸: 대형마트(29곳) · 전통시장(16곳)
   - 대형마트 · 체인별(싼 순): "대형마트 C 9곳 · 전국 같은 값" (KAMIS가 이름을 기호로 준다)
   - 전통시장(싼 순): "신정시장 · 울산" 5곳 + "16곳 모두 보기"
   - 각 행에 작은 위치 막대(점 = 이 가격, 점선 = 전국 중간값)
   - 아래 설명 "매장에서 본 가격을 여기 견주어 보세요"
5. "왜 이 판정일까?" 펼치기
   - 가격 추이 차트, 탭 1개월 · 3개월 · 6개월(1년 없음): 시세 선, 평소 범위 띠, 평소가 점선, 오늘 표시, 급등 · 급락 점, "평년 흐름으로 본 예상" 빗금
   - 판매처별 가격 점 비교(판매가가 있는 품종만). 없는 품종은 이 자리에 조사 시장별 시세 점 비교
6. 근거 한 줄: "전국 조사 시장 45곳 · 10/23 조사 (KAMIS)"
7. 하단 고정 "내가 본 가격 적기": 입력하면 화면에서만 판정한다(저장 안 함, domain-model 2026-10-19 결정). 범위 막대에 "내가 본" 핀을 더한다

"판정 전"(평소가 없음): 판정 자리는 회색 "판정 전" + "평소가를 낼 만큼 시세가 아직 쌓이지 않았어요", 평소가 칸은 "계산 중". 평소 범위 띠 · 예상 · 급등락 점 · "내가 본 가격 적기"를 뺀다. 시세 · 범위 · 장소 비교 · 시세 선은 그대로.

데이터 오래됨: 조사일 배지 "마지막 조사 10/9 · 2주 전", 판정을 흐리게. 표본 적음: 판정을 점선 상자 + "?" 와 "조사한 곳이 3곳뿐이라 참고만 하세요".

### P4 담은 품종
- 앱 바: "담은 품종 5" · 편집
- 한 줄 집계: ● 싸요 1 ● 보통 2 ● 비싸요 1 ● 판정 전 1 (판정 전은 0이면 숨김)
- 알림: "담은 뒤 판정이 바뀐 품종 1개 · 고등어", 행 아래 "10/16에 담을 때 보통 → 지금 싸요"
- 열 제목: 품종 | 판정 | 시세 · 평소
- 판정별 묶음(지금 싸요 → 보통이에요 → 평소보다 비싸요 → 판정 전), 묶음 안은 % 오름차순, ×로 빼기
- "+ 품종 더 담기"(P2로), 빈 목록 상태

## 2. 내비 · 헤더 통일

헤더와 하단 내비를 제철과 가격이 같이 쓴다. 메뉴는 영역에 따라 바뀐다.

| 영역 | 하단 내비 |
|---|---|
| 가격 (`/`, `/search`, `/prices/*`, `/basket`) | 시세 · 제철달력 · 담은 품종 |
| 제철 (`/seasonal/*`) | 시세 · 제철달력 · 계절 · 나의 식탁 |

- "시세"는 `/`, "제철달력"은 `/seasonal`(지금의 "이달"; 월별 보기도 활성), "계절"은 계절 · 명절, "나의 식탁"은 그대로
- 판정 화면 메뉴 이름은 "판정"이 아니라 "시세"다
- 담은 품종 칸에 담은 개수 배지(0이면 숨김)
- 모양은 지금 `FloatingNav`(크림 트레이, 칸 사이 미끄러지는 강조)와 `SeasonalHeader`(위에 붙었다가 내려가면 떠오르는 바)를 그대로 쓴다. 칸 수가 3 · 4로 바뀌어도 칸 폭(72px) 규칙은 같다. 375px에서 4칸이 들어가는지 확인
- 데스크톱(≥1024)은 헤더 안 주요 메뉴가 같은 규칙으로 바뀐다
- 로고는 장볼날 `BrandLogo` 그대로, 누르면 `/`(routes.home)
- 헤더 · 내비는 두 기능이 같이 쓰므로 `features/seasonal/components/`에서 `apps/web/shared/`(예: `shared/shell/`)로 내린다. features끼리 서로 import하지 않는다. 영역별 메뉴 목록은 한 파일의 설정으로 둔다. 제철 헤더의 검색 · 설정 버튼과 2차 탭은 제철 레이아웃이 `actions` · `tabs`로 넣는 구조를 유지한다

## 3. 코드 구조 (Supabase로 바꾸기 쉽게)

### 3-1. 도메인 패키지 `packages/price` (`@workspace/price`)
`packages/seasonal`과 같은 모양(순수 TypeScript, React · Next · DOM 없음, `exports: "./*": "./src/*.ts"`). 새 패키지이므로 `docs/project-structure.md`에 등록한다.

- `src/types.ts`: 화면이 쓰는 모양. pipeline.md 4-1 payload와 `current_judgment` 목록 열에 맞춘다
  - `VarietySummary`(목록 행: id, 이름, 품목, 카테고리, 규격, 기준 단위, 시세, 평소가 | null, 판정, 조사일, 표본 수, stale, meetsMinN)
  - `VarietyDetail`(Summary + 범위 min · max · n, 업태별 중간값, 장소 목록, 추이 시리즈, 판매가 목록 | null, 근거)
  - `Verdict = { kind: "cheap" | "normal" | "pricey" | "none"; pct: number | null }`
- `src/verdict.ts`: `verdictOf(price, usual, band)`. 평소가 null이면 `none`. 입력 가격 판정(P3 "내가 본 가격")도 이 함수
- `src/search.ts`: 초성 · 품목 · 별칭 · 한 글자 오타. `es-hangul` 사용, `match-foods.ts` 방식 참고
- `src/copy.ts`: 화면 문구(설명 한 줄, 빈 상태, 토스트, 판정 전 문구)
- 순수 함수는 vitest를 먼저 쓴다(`*.test.ts` 옆에)

### 3-2. 데이터 경계 `apps/web/features/price/data/`
- `price-source.ts`: 화면이 아는 유일한 입구. 인터페이스 + 지금 쓰는 구현을 고르는 `getPriceSource()`
  ```ts
  export interface PriceSource {
    listVarieties(): Promise<readonly VarietySummary[]>      // 메인 · 검색 · 담은 품종 (가벼운 목록 쿼리 하나)
    getVariety(id: string): Promise<VarietyDetail | null>    // 상세 (payload 한 행)
    searchIndex(): Promise<SearchIndex>                       // 품종 · 품목 · 별칭 · 카테고리
    featuredIds(): Promise<readonly string[]>                 // 자주 사는 품종
  }
  ```
- `fixture-source.ts`: 하드코딩 구현. 데이터는 `fixtures/`(예: `varieties.ts`, `detail-baechu.ts`)에만 둔다. 와이어프레임 값(배추 시세 4,500 · 평소가 4,150, 범위 3,900~5,200, 대형마트 3,900 · 전통시장 4,940, 10/26 배추 장소 표본, 판정 전 품종 샤인머스켓 · 쥬키니 · 호주산 등심 · 찹쌀)을 쓴다
- 모든 메서드는 `async`로 둔다. 나중에 `supabase-source.ts`(서버 전용, `import "server-only"`, `web_reader` 접속)를 더하고 `getPriceSource()`만 바꾸면 끝나야 한다
- 화면 · 컴포넌트는 `fixtures/`를 직접 import하지 않는다. 서버 컴포넌트에서 `getPriceSource()`를 부르고 결과를 props로 내린다. 클라이언트 검색은 서버가 내려준 `searchIndex`로 거른다
- "오늘" 날짜는 `getSeoulToday()`를 쓰고, 조사일은 데이터에 든 값을 쓴다. 렌더 중 `new Date()` 금지
- 다음 단계 메모를 파일 맨 위 주석에 남긴다: 어떤 표/뷰가 어떤 메서드를 채우는지(`current_judgment`, `judgment_snapshot.payload`, `variety` · `item` · `alias`)

### 3-3. 화면 `apps/web/features/price/`
- 화면별 폴더: `home/`, `search/`, `variety-detail/`, `basket/`, 기능 안 공용은 `components/`(품종 행, 판정 칩, 가격 두 줄, 설명 한 줄), 스토어는 `stores/`
- 기기 저장(담은 품종, 담을 때 판정 · 날짜, 최근 본 품종): zustand `persist`, `skipHydration: true`, 키 `price:basket` · `price:recent`. 마운트 뒤 rehydrate(기존 `useHydrate*` 방식)
- 라우트 파일은 얇게: 파라미터 검증, `createMetadata`, 기능 컴포넌트 렌더
- 모든 경로는 `shared/routes.ts`에 `routes.price.*`로 만든다. `routes.home`은 `/`로 바꾼다

## 4. 컴포넌트

AGENTS.md 순서: cojeev(https://cojeev.com/ui/docs/, 목록 https://cojeev.com/ui/r/registry.json) → shadcn → 직접. 추가는 저장소 루트에서 `pnpm ui:add <이름 또는 URL>`만 쓴다. 이미 있는 것: `input`(InputClear), `segmented`, `tabs`, `collapsible`, `toast`, `empty`, `badge`, `bottom-sheet`, `item`, `separator`, `skeleton`, `number-input`, `link-tabs`.

| 쓰임 | 먼저 볼 것 |
|---|---|
| 검색창 | `input` + `InputClear` |
| 1 · 3 · 6개월 탭 | `segmented` 또는 `tabs` |
| 왜 이 판정일까? | `collapsible` |
| 담기 토스트 | `toast` |
| 빈 목록 · 결과 없음 | `empty` |
| 판정 칩 · 행사 표시 | `badge` (변형으로) |
| 내가 본 가격 입력 | `number-input` 또는 `bottom-sheet` 안 `input` |
| 차트 | cojeev 레지스트리에 차트가 있는지 먼저 확인. 없으면 SVG로 직접 |

직접 만들 것(대부분 `features/price/components/`): 품종 행, 가격 두 줄, 범위 막대, 장소 목록 + 위치 막대, 가격 추이 차트, 점 비교. 도메인 단어가 없는 범용 조각만 `packages/ui`에 둔다.

## 5. 색 · 서체

- 색은 Oura 토큰만(`packages/ui/src/styles/globals.css`). hex 금지
- 판정 색은 새 시맨틱 토큰으로 이름만 더하고 값은 기존 팔레트를 가리킨다: `--color-verdict-cheap`(sage/forest 계열), `--color-verdict-normal`(gold 계열), `--color-verdict-pricey`(holiday 계열), `--color-verdict-none`(ash). 배경 · 글자용 변형은 `color-mix`로. 와이어프레임의 초록 · 노랑 · 빨강 hex를 그대로 옮기지 않는다
- 서체: 본문 Pretendard, 판정 큰 글자 · 제목 Gowun Batang(`font-heading`), 큰 숫자 `font-number`
- 라이트 모드만. `dark:` 금지

## 6. 홈 교체 · SEO

- `app/page.tsx`의 redirect를 P1로 바꾼다. 제철 경로는 그대로 둔다
- `JsonLd website() · organization()`을 새 홈으로 옮긴다(지금은 `/seasonal` 페이지에 있다). `homeSeo()`는 새 홈 문구로, 제철 메인은 별도 제목으로
- `shared/seo/pages.ts`: `/`를 `REDIRECT_ROUTES`에서 `SEO_PAGES`로, `/prices/[variety]` 등록, `/search` · `/basket`은 `NOINDEX_ROUTES`. 빠뜨리면 `pnpm test`가 실패한다
- `proxy.ts` matcher는 건드릴 일이 없는지 확인
- OG 이미지가 새 색을 쓰면 `app/api/og/route.tsx`의 `OG_COLORS`도 맞춘다

## 7. 이번 범위 밖

- Supabase 연결(다음 단계). 지금은 `fixture-source`만
- 판매처 실명 판매가(점포 → 판매처 연결 전). 픽스처에서도 판매가 있는 품종은 1~2개만
- 미등록 검색어 기록, 제보 저장, 검색 기록으로 만든 "많이 찾는 품종"
- 1년 차트 탭

## 8. 완료 기준

- 저장소 루트에서 `pnpm typecheck`, `pnpm lint`(0 errors), `pnpm test` 통과
- `next-dev-loop`로 375 · 1280에서 P1~P4와 상태 화면을 보고 콘솔 오류 · 하이드레이션 경고 없음. 375에서 4칸 내비, 키보드 위 토스트, 열 정렬 확인
- 제철 화면이 깨지지 않는다: `/seasonal` 내비가 4칸(시세 · 제철달력 · 계절 · 나의 식탁)으로 바뀌고 활성 표시가 맞다
- 화면 · 컴포넌트에서 `fixtures/` import가 없다(데이터 경계 검사)
- 티켓마다 검증 후 `main`에 `feat: …` 한국어 메시지로 커밋

## 9. 티켓 나누기 (제안)

1. `@workspace/price` 패키지: 타입, `verdictOf`, 검색(테스트 먼저), 문구
2. 데이터 경계: `PriceSource`, `fixture-source`, 픽스처
3. 셸 통일: 헤더 · 내비를 `shared/`로, 영역별 메뉴, 판정 색 토큰
4. P1 메인 + 품종 행 + `/` 교체 + SEO
5. P2 검색 + 결과 없음
6. P3 상세(판정 카드, 범위, 장소 목록, 펼치기 차트, 판정 전 · 오래됨 · 표본 적음)
7. P4 담은 품종 + 담기 스토어 + 토스트
