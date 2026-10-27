# 04. P1 시세 메인 + 품종 행 + `/` 교체 + SEO

Status: resolved
Type: task (AFK)
Blocked by: 02, 03

## 할 일

- [x] `routes.home`을 `/`로, `routes.price.*`(search, variety, basket) 추가
- [x] 가격 영역 레이아웃(셸 + 가격 메뉴). 라우트 그룹으로 `/`, `/search`, `/prices/*`, `/basket`을 묶는다
- [x] 공용 조각 `features/price/components/`: 품종 행(네 열 같은 폭: 품종 | 판정 칩 | 가격 두 줄 | 동작), 판정 칩("보통 +8%", 없으면 회색 "판정 전"), 가격 두 줄, 설명 한 줄
- [x] P1: 큰 제목, 검색창 버튼(누르면 `/search`), 최근 본 품종 알약(기기 저장 `price:recent`), 자주 사는 품종(`featuredIds`), 설명 한 줄, 근거 한 줄
- [x] `app/page.tsx` redirect를 P1로. `JsonLd website() · organization()`를 새 홈으로 옮기고 `homeSeo()`를 새 홈 문구로, 제철 메인은 별도 제목
- [x] `shared/seo/pages.ts`: `/`를 `SEO_PAGES`로, `/prices/[variety]` · `/search` · `/basket` 자리는 각 티켓에서 등록. `proxy.ts` matcher 확인
- [x] + 담기: 담기 store(`price:basket`)를 이 티켓에서 먼저 만들어 잇는다. 토스트 · 배지 · P4는 07

## 완료 기준

- 375 · 1280에서 P1이 보이고 콘솔 오류 · 하이드레이션 경고 없음. 열 정렬 확인. 루트 검사 통과.

## Answer

2026-10-27. 라우트 그룹 `app/(price)/`(레이아웃 + P1 `page.tsx`, 옛 `app/page.tsx` redirect는 지움), `features/price/home/home-view`, 공용 조각 `features/price/components/`, store `features/price/stores/`.

- 품종 행은 `ROW_COLUMNS`(품종 1fr | 칩 5.75rem | 가격 5.25rem | 동작 2.5rem) 위에 링크가 `grid-cols-subgrid`로 세 칸을 덮는다. 행을 누르면 P3, 동작 버튼은 따로.
- 최근 본 품종 알약은 본 품종이 없으면 칸째 숨긴다(하이드레이션 뒤 나타난다). 채우는 일은 06.
- SEO: `/`를 `SEO_PAGES`로, `REDIRECT_ROUTES`는 비었다. `homeSeo()`는 새 홈 문구, 제철 메인은 `seasonalHomeSeo()`("제철 음식 달력"). JSON-LD `website() · organization()`은 새 홈으로 옮겼다. `SITE_CONFIG` 기본 제목 · 설명에 시세를 더했다. `proxy.ts` matcher(`/seasonal/festivals`)는 고칠 것이 없다. OG 이미지는 새 색을 쓰지 않아 `OG_COLORS`도 그대로.
- 빵부스러기 첫 칸은 이제 `/`(장볼날)다.
- 확인: 375 · 1280에서 P1, 콘솔 오류 · 하이드레이션 경고 없음, + 담기가 `price:basket`에 남고 새로고침 뒤 "빼기"로 보인다.
- 주의: `.next/types/validator.ts`는 10/16 빌드가 남긴 파일이라 `app/page.tsx`를 지우면 `pnpm typecheck`가 깨진다. `pnpm --filter web exec next typegen`으로 다시 만들었다.
