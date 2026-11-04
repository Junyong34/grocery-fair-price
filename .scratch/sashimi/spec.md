# 제철 회 — 제철달력 탭 화면

2026-11-03 grilling 세션에서 사용자와 정했다. 제철달력 탭 줄에 "제철 회"를 더하고, 달을 골라 그 달 횟감을 보는 화면을 만든다. 용어는 `grocery-price/GLOSSARY.md`를 따른다.

## 0. 먼저 읽을 것

- 콘텐츠 원천과 검증 상태: `apps/web/docs/seafood-content/README.md`, 원문 `reference.json`(`monthlyContent`)
- 28종 + 학꽁치 추천 월의 출처 조사: `research-months.md`(이 폴더)
- 탭 줄: `.scratch/shell-unify/spec.md` 2장, `apps/web/features/seasonal/components/sub-tabs.tsx`
- 비슷한 화면: 1g 명절(`features/seasonal/festivals`, `proxy.ts` 리다이렉트)

## 1. 탭

- 탭 순서: **이달 · 월별 · 계절 · 제철 회 · 명절**. `sub-tabs.tsx`의 `TABS`에 한 줄을 더한다.
- 375px에서 탭 줄이 한 줄을 넘으면 이름을 "회"로 줄인다. 브라우저로 재서 정한다.
- 하단 내비 "제철달력" 칸은 `/seasonal/sashimi/*`에서도 활성이다(`shared/shell/menus.ts`의 `also`).

## 2. 경로

- `routes.seasonal.sashimi`(`/seasonal/sashimi`)와 `routes.seasonal.sashimiMonth(month)`(`/seasonal/sashimi/[month]`).
- 접두 경로는 `proxy.ts`가 서울 기준 이번 달로 보낸다. 지금 `proxy`는 명절 하나만 처리하므로 `pathname`으로 나눈다. `matcher`에 `/seasonal/sashimi`를 더한다.
- `[month]`는 `generateStaticParams`로 1~12를 만들고, 그 밖의 값은 `notFound()`.
- 탭 줄을 쓰려면 `(season)` 또는 `(this-month)` 라우트 그룹 안에 둔다. `(season)/sashimi/[month]/page.tsx`로 둔다.
- 메타데이터: `createMetadata`. 제목 예 "2월 제철 회", 설명은 그 달 품종 이름 몇 개. `shared/seo/pages.ts`에 `[month]` 12개는 indexed로, 접두 경로는 redirect로 등록한다.

## 3. 화면

- 위에서 아래로: 달 칩 12개(가로 스크롤, 현재 달이 선택됨, 칩은 `routes.seasonal.sashimiMonth` 링크) → 그 달 제목(숫자 없음)과 "N종" → 카드 목록 → 안내 한 줄.
- 카드: 품종 그림(`color.svg`), 품종 이름, 한 줄 설명. 누르면 1i(`routes.seasonal.food(id)`) 시트가 열린다. 먹음 기록은 카드에서 하지 않는다.
- 모바일: 가로 카드 1열(그림 왼쪽, 글 오른쪽). 데스크톱: 가운데 단일 열 최대 폭 720, 카드 2열.
- 안내 문구: "추천 시기는 참고용이에요. 지역과 자연산·양식 여부에 따라 달라요." (`copy.ts`)
- 빈 달은 없다(달마다 4~7종). 빈 상태 화면은 만들지 않는다.
- 새 analytics 이벤트는 없다. 달 칩 이동과 1i 시트는 `page_view`로 센다(`apps/web/docs/analytics.md`).

## 4. 데이터

- 품종 55종: 첨부 48종 + 오징어(`squid`), 동해한치(`east-sea-hanchi`), 제주한치(`jeju-hanchi`), 낙지(`long-arm-octopus`), 주꾸미(`webfoot-octopus`), 민어(`croaker`), 병어(`pomfret`). 조개류·멍게·해삼·성게는 넣지 않는다.
- 달: 첨부 48종은 첨부의 달, 추가 7종은 앱의 대표 달(`peak`). 이슈 06에서 출처와 다른 종의 앱 제철을 고치면, 그 종의 회 화면 달도 같이 맞춘다.
- 화면의 그 달 목록(2026-11-05 변경, SEO 감사 F1): 위 "달"은 **추천 달**이다. 그 달 목록은 55종 가운데 그 달이 추천 달이거나 앱 제철(`months`)에 든 품종 전부다. 추천 달만 쓰면 11월에 방어·광어가 빠져 같은 사이트 월별 제철과 어긋났다.
- 한 달 안 순서: 그 달 추천 품종이 앞("이달 추천" 표시), 각 묶음 안은 친숙도(`familiarity`) 1→3, 같은 등급은 첨부 순서.
- `packages/seasonal/src/data/sashimi.ts`: 달 → 품종 id 목록. 순수 TS, `sashimi.test.ts`를 먼저 쓴다(모든 id가 `FOODS`에 있음, 달마다 1개 이상, 중복 없음, 순서 규칙).
- `packages/seasonal/src/data/copy.ts`: 달 제목 12개(숫자 없음, 새로 씀), 품종별 한 줄 설명(첨부 원문을 다듬은 초안, 추가 7종은 새로 씀), 안내 문구. 첨부 원문을 그대로 쓰지 않는다. 첨부의 계절 요약은 쓰지 않는다.

## 5. 이슈

| # | 이슈 | 막힘 |
|---|---|---|
| 01 | `sashimi.ts`와 테스트 | — |
| 02 | `copy.ts` 문구 초안 | 01 |
| 03 | 경로 · proxy · SEO · 탭 · 하단 내비 활성 | 01 |
| 04 | 화면 UI | 02, 03 |
| 05 | 375 · 1280 브라우저 확인 | 04 |
| 06 | 출처 조사 반영: 앱 제철 보정 | 01, `research-months.md` |
