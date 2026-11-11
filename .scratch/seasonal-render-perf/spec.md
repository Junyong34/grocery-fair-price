# 제철달력 렌더링 속도 개선 — 2a 판 정적화 · SVG 캐시 · 측정

2a(`/seasonal`)는 이미 빌드 때 정적으로 그려지지만(`.scratch/seasonal-static`), HTML이 2.35MB(`<img>` 782개)이고 12개월 판이 모두 하이드레이션되며, 그림 SVG 297종이 모두 수채 필터를 써서 모바일에서 그릴 때 CPU 비용이 크다. 렌더링 방식은 그대로 두고, 운영 기준선을 잰 뒤 판 드래그를 없애고 SVG 전송·캐시를 손본다. 작성 2026-11-11. 질문 기록: `grill.md`, HTML 계획: `plan.html`.

> **재설계 (2026-11-11):** 04 · 08 배포 뒤 운영 재측정이 나빠져(`baseline.md`) 구조를 다시 분석했다(`architecture.md`). Q3(렌더링 방식 유지)과 4장의 "오늘 표시 구멍"은 6장이 대체한다. 지금 할 일은 6장과 티켓 09~13이다.

## 0. 먼저 읽을 것

- AGENTS.md 블록: 생성 파일 표(`foods:sync`, 인쇄 PDF), 기기 저장(`deviceStore`), 애니메이션, 마무리·검증
- `.scratch/seasonal-static/spec.md` (완료): 2a 정적화 구조와 11-05 측정값
- `apps/web/docs/nextjs-16-patterns.md`
- Next 16.4 문서: `apps/web/node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/headers.md` (`has` 쿼리 매칭, "Headers are checked before the filesystem which includes … `/public` files")
- 코드: `features/seasonal/components/{scatter-field,draggable-scatter,food-image}.tsx`, `use-drag-gesture.ts`, `stores/scatter-store.ts`, `this-month/this-month-view.tsx`, `scripts/{sync-food-images,measure-food-bounds}.mjs`

## 1. 결정

| # | 결정 | 근거 |
|---|---|---|
| Q1 | 성공 기준: 375 모바일 Lighthouse(LCP·TBT) + 스크롤 중 긴 프레임, 운영 기준선 대비 | 라운드 1. 바이트(brotli 202KB)보다 CPU가 의심된다 |
| Q2 | 범위는 2a. `FoodImage` 변경은 다른 화면도 함께 받는다 | 라운드 1. 그림 782개가 2a에 몰려 있다 |
| Q3 | 렌더링 방식 유지: 정적 + proxy rewrite + 오늘 구멍. SSR·ISR 전환 없음 | 라운드 1. 이미 가장 빠른 형태 |
| Q4 | 그림은 SVG 유지, SVGO로 줄인다 | 라운드 1. 필터 비용은 남는다 → Q8 |
| Q5·Q7 | 판 드래그 전부 제거(그림·달력 드래그, "처음 자리로", 안내 문구). 탭 → 1i 시트, 먹음 표시는 남김 | 라운드 1·2. 사용자가 거의 조작하지 않는다는 판단(사용량 데이터는 없음) |
| Q8 | 수채 필터가 병목인지는 측정 후 판단하고, 그때 대체안을 정한다 | 라운드 2 |
| Q9 | 넣음: 캐시 헤더, HTML 증가 원인, TTFB 원인. 뺌: 거대 SVG 다시 그리기 | 라운드 2 |
| 계획 | 판의 점선 테두리만 지우고 점무늬 배경은 둔다 | HTML 응답. 테두리는 끌기 범위 표시였다 |
| 계획 | 기기의 `seasonal:scatter`는 읽지 않고 지우지도 않는다 | HTML 응답. 키는 다른 용도로 재사용하지 않는다 |

## 2. 동작

### 2.1 모든 개선은 운영 기준선과 비교해 판정한다

- 첫 티켓이 `.scratch/seasonal-render-perf/baseline.md`에 표를 채운다: LCP, TBT, 스크롤 중 긴 프레임 수와 그중 Paint·Rasterize 비중, HTML·RSC 크기, `<img>` 수, TTFB. 375 모바일(Lighthouse 모바일 프리셋 + Performance trace), 운영 `jangbol.kr/seasonal`, 3회 중간값.
- 이후 티켓은 배포 뒤 같은 표를 다시 재서 한 줄씩 덧붙인다.
- 목표: LCP ≤ 2.5s, TBT ≤ 200ms, TTFB ≤ 200ms, 스크롤 긴 프레임은 기준선보다 적게.

### 2.2 2a의 그림 판은 끌어 옮길 수 없고, 그림을 누르면 품종 시트가 열린다

- 판은 시드 배치(`scatterLayout`) 그대로 보인다. 그림을 누르면 지금처럼 1i 시트가 열리고, 먹음 표시(`eaten-highlight`)도 그대로다.
- 점선 테두리, "처음 자리로" 버튼, 안내 문구("그림을 끌어 옮겨 보세요", "그림을 끌어 달력 위에도 놓아 꾸며 보세요")가 사라진다. "N가지 제철"은 남는다.
- 점무늬 배경(`PatternBackground`)은 남는다.
- 데스크톱 달 판의 달력은 기본 자리에 고정된다. 모바일 판 바닥 달력의 폭 맞춤 배율은 그대로 동작해야 한다.

### 2.3 그림 SVG는 SVGO로 줄인 파일이고, 재방문 때 재검증 없이 캐시에서 읽는다

- `public/foods/*/{color,motion}.svg`를 SVGO로 줄인다. 수채 필터, `<style>`, `data-*` 속성(motion 애니메이션 선택자)은 지킨다.
- `FoodImage`는 주소에 품종별 내용 해시를 붙인다(`/foods/<id>/color.svg?v=<hash>`).
- `?v=`가 붙은 `/foods/*` 요청만 `Cache-Control: public, max-age=31536000, immutable`. 버전 없는 요청은 지금 헤더 그대로다.
- 인쇄 페이지도 같은 SVG를 그리므로 PDF와 썸네일을 다시 만든다.

### 2.4 수채 필터가 느린 원인이면 작은 그림만 따로 정한다 (조건부)

- 모든 그림 SVG에는 수채 질감을 내는 필터가 들어 있다. 이 필터는 브라우저가 그림을 그릴 때마다 계산하므로, 그림이 많은 화면을 스크롤할 때 버벅임의 원인일 수 있다.
- 2.1 측정에서 스크롤 중 긴 프레임의 주원인이 그림 그리기(Paint·Rasterize)로 나오면, 작은 자리(표시 120px 이하) 그림을 바꾼다. 후보: (1) 필터를 뺀 SVG 변형을 빌드 때 만든다 (2) WebP·AVIF 래스터(Q4 B).
- 원인이 아니면 이 항목은 닫는다.

## 3. 구조

- **판 (Features 레이어):** `ScatterField`(서버)가 `scatterLayout()`으로 배치를 계산하고 판·그림을 그대로 그린다. 클라이언트 부분은 그림 링크(`IntentLink`), 먹음 표시(`EatenName`), 모바일 달력 배율(`CalendarFit`)뿐이다. `DraggableScatter`, `use-drag-gesture.ts`, `stores/scatter-store.ts`는 지운다. `packages/seasonal/src/layout/arrangement.ts`(배치 저장 · 끄는 동안 겹침 풀기)도 드래그 전용이라 테스트와 함께 지운다. `season-poster.tsx`의 `arrangement()`는 이름만 같은 로컬 함수다.
- **SVG 최적화 (스크립트):** 새 `scripts/optimize-food-svgs.mjs`가 `public/foods`의 SVG를 제자리에서 줄이고 내용 해시 표 `packages/seasonal/src/data/food-versions.generated.ts`(`FOOD_VERSIONS: Record<string, string>`)를 쓴다. `prototypes/` 없이 돈다. 루트 `package.json`의 `foods:sync`를 `sync → optimize → bounds` 순서로 잇고, `foods:optimize`를 따로 둔다.
- **캐시 헤더:** `apps/web/next.config.ts` `headers()`, `source: "/foods/:path*"`, `has: [{ type: "query", key: "v" }]`.
- **측정 기록:** `.scratch/seasonal-render-perf/baseline.md`.

```ts
// packages/seasonal/src/data/food-versions.generated.ts (생성 파일, 스케치)
export const FOOD_VERSIONS: Readonly<Record<string, string>> = {
  apple: "3f9a1c2e",
  // … 품종 id → color·motion 내용 해시 앞 8자
}
```

## 4. 바꾸지 않는 것

- 렌더링 구조: proxy rewrite, `/seasonal/at/[yearMonth]` 정적 생성, 오늘 표시 구멍(Q3).
- 2a 구성과 순서, 스크롤, 레일·점프, 데스크톱 패널, 먹음 기록, 1i 시트.
- motion SVG와 CSS 애니메이션. 일러스트 다시 그리기(Q9에서 뺌).
- 2b·식재료·명절 화면 구조(Q2). `FoodImage` 변경만 함께 받는다.
- 저장 키 `seasonal:scatter`의 이름(다른 용도로 재사용하지 않는다).

## 5. 티켓

| # | 티켓 | 막힘 |
|---|---|---|
| 01 | 운영 기준선 측정 | 없음 |
| 02 | HTML이 2.35MB로 커진 원인 | 없음 |
| 03 | TTFB 0.55초 원인 | 없음 |
| 04 | 2a 판 드래그 제거 | 01 |
| 05 | 그림 SVG SVGO 적용과 인쇄물 재생성 | 01 |
| 06 | 그림 주소 버전과 immutable 캐시 | 05 |
| 07 | 수채 필터 병목 판정 (조건부) | 01, 04, 05 |
| 08 | FoodImage를 일반 img로 (구현 중 추가) | 없음 |
| 09 | Cloudflare 프록시 끄기 (사용자 작업) | 없음 |
| 10 | 오늘 표시를 브라우저로, /seasonal 완전 정적 | 없음 |
| 11 | 2a 첫 HTML은 이번 달 · 다음 달만, 나머지 달은 늦게 그림 | 10 |
| 12 | 큰 숫자 폰트 서브셋 | 없음 |
| 13 | 재설계 뒤 운영 재측정 | 09, 10, 11, 12 |

02 · 03은 분석으로 답이 나와 닫았고, 04 · 08은 완료, 05 · 06은 13 뒤로 미뤘고, 07은 wontfix다.

## 6. 재설계 (라운드 3 · 4)

병목 순위(`architecture.md` 5장)를 층별로 정했다. 붙여넣은 일반 전략 중 쓸 것은 ④-2(늦게 그리기) 하나이고, 그마저 payload가 줄도록 방식을 바꿨다(`grill.md` 라운드 3).

### 6.1 한국 요청은 Vercel 서울로 바로 간다 (Q10)

- `jangbol.kr` · `www` DNS 레코드의 Cloudflare 프록시를 끈다(회색 구름). 응답에 `cf-ray`가 없고 `x-vercel-id`가 `icn1`로 시작한다.
- 끄기 전에 Cloudflare Rules · WAF에 쓰는 규칙이 있는지 본다. www → apex 리다이렉트는 Vercel이 하므로 남는다.

### 6.2 /seasonal은 요청 때 서버가 그리지 않는다 (Q11 · Q15)

- `/seasonal` 아래 페이지는 구멍 없는 완전 정적이다. 응답에 RSC가 한 벌만 실리고, 요청마다 함수가 돌지 않는다.
- 일 단위 오늘 표시(달력의 오늘 동그라미, 일별 카드의 "오늘")는 첫 그리기 전에 보인다. 서버 HTML의 날짜 칸에 `data-date="YYYY-MM-DD"`와 숨긴 표시를 미리 넣고, 레이아웃 맨 앞의 인라인 스크립트가 서울 날짜(`Intl`, `Asia/Seoul`)로 `<style>[data-date="…"] …{…}</style>`를 넣는다. 서버 · 클라이언트 마크업이 같아 하이드레이션 불일치가 없다.
- 연도만 필요한 곳(2a 먹음 배지)은 주소의 (연, 월)을 쓴다.
- 누르는 부품(1i 먹음 토글, 나의 식탁, 다운로드 연도 등)은 마운트 뒤 계산한 오늘을 쓴다. 지금 fallback과 같은 모양으로 시작한다.
- `TodayProvider`(`app/seasonal/layout.tsx`)와 서버 `getSeoulToday()` 의존을 `/seasonal`에서 걷어낸다. AGENTS.md "today" 블록과 `nextjs-16-patterns.md` 5.2에 이 예외를 적는다.

### 6.3 2a의 첫 HTML에는 이번 달과 다음 달만 있다 (Q12 · Q16~18)

- 첫 HTML: 히어로, 이번 달, 다음 달 섹션(12월이면 12월만), YearEnd. 다른 달은 예상 높이(지금 `contain-intrinsic` 값)만큼 자리만 잡은 빈 섹션이다(`id` · `data-month`는 유지).
- 빈 섹션이 화면에서 약 1화면 거리로 오면 그 달 데이터를 `import()`한 청크로 받아 브라우저에서 그린다. 청크는 정적 JS라 CDN · 브라우저 캐시를 그대로 탄다.
- 월 레일 · 데스크톱 휠 · `#month-N` 해시로 안 그린 달에 바로 가면, 그 달을 먼저 그린 뒤 스크롤한다. 사이 달은 스크롤 때 그린다. 위쪽 달이 나중에 채워져도 화면 위치가 튀지 않는다(스크롤 앵커링 + 예상 높이).
- 늦게 그린 달은 서버에서 그린 달과 생김새 · 동작(1i 시트, 먹음 표시, 달력 배율)이 같다.
- 대가: 안 그린 달은 페이지 내 검색에 걸리지 않는다. 검색엔진은 2b(`/seasonal/months/N`)가 달마다 색인된다.

### 6.4 큰 숫자 폰트는 숫자만 받는다 (Q13)

- Bricolage(`shared/fonts/BricolageGrotesque.woff2`, 208KB)를 실제로 쓰는 글자(숫자, 기호, 쓰이는 영문)만 남긴 서브셋으로 줄이고 preload한다. 한글 Pretendard는 범위 밖이다.
- 목표: 운영 375 모바일 LCP ≤ 2.5s.

### 6.5 성공 기준

`baseline.md`와 같은 방법(Lighthouse 12.6.1 모바일 3회, curl 3회). 목표: TTFB ≤ 200ms, HTML 압축 전 ≤ 1MB, DOM ≤ 2,500, LCP ≤ 2.5s, TBT ≤ 200ms.

