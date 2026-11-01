# 03. 통일 설정 화면 `/settings`

Status: resolved
Type: task (AFK)
Blocked by: 없음

## 목적

⚙를 어디서 눌러도 같은 설정 화면을 연다. 2a 전용 설정 시트를 없애고, 주제별 섹션(화면 표시 · 내 기록 · 정보)으로 모은다(spec 5장, 캔버스 E 페이지 S2).

## 할 일

- [x] `shared/routes.ts`에 `settings: { root: "/settings", sources: "/settings/sources" }`를 더한다. `proxy.ts` matcher와 겹치지 않는지 확인한다.
- [x] 라우트 `app/(price)/settings/page.tsx` · `settings/sources/page.tsx`를 만든다(셸은 01 이후 공통이므로 그룹은 쓰기 편한 곳에 둔다). `createMetadata`를 쓰고, `shared/seo/pages.ts`에 noindex로 등록한다.
- [x] 새 feature `apps/web/features/settings/`: `settings-view`(섹션 3개), `sources-view`, `clear-confirm`(기록 지우기 확인 시트, `openBottomSheet`), `copy.ts`
- [x] 화면 표시 섹션은 지금 `this-month/settings-fields.tsx`의 필드(공휴일, 먹은 음식, 달력 모양 `calendar-style-picker`, 달 이름)를 옮겨 쓴다. 행마다 "제철달력"을 작게 표시한다.
- [x] 내 기록 섹션은 담은 품종 비우기(n개), 최근 본 품종 지우기, 먹음 기록 지우기(n개)다. store 모듈에 `clearBasket` · `clearRecent` · `clearEaten`을 더하고 테스트를 먼저 쓴다. features끼리 import하지 않도록, 설정 화면이 쓰는 store 훅과 함수는 `shared/`에서 오게 한다(필요하면 store 파일을 `shared/`로 옮긴다. 키 이름은 그대로 둔다).
- [x] 정보 섹션은 데이터 출처(KAMIS 평일 · 축산물품질평가원 매일 · 참가격 격주, 근거 `grocery-price/docs/30-data/sources/`), 개인정보 처리방침(`routes.privacy`), 버전이다. 맨 아래에 "이 기기에만 저장돼요" 안내를 둔다.
- [x] 2a 설정 시트를 지운다: `settings-panel.tsx`, `settings-scope.tsx`, `ThisMonthOnly`(다른 곳에서 안 쓰면). 제철 헤더의 ⚙는 `/settings` 링크로 바꾼다(모바일 · 데스크톱). 루트 헤더 전체에 ⚙를 넣는 일은 04에서 한다.
- [x] 분석 이벤트를 바꾸거나 더하면 `shared/analytics/events.ts`와 `apps/web/docs/analytics.md` 절차를 따른다.
- [x] `docs/project-structure.md`의 라우트 · features · 상태 표를 고친다.

## 완료 기준

- 루트 `pnpm typecheck` · `pnpm lint` · `pnpm test` 통과(SEO 가드 테스트 포함)
- 375 · 1280에서 확인한다:
  - 2a ⚙ → 설정 → 달력 모양을 바꾸고 ‹ → 2a에 반영된다.
  - 기록 지우기 확인 → 지운 뒤 개수가 0이 되고, P4 · 1h에 반영된다.
  - 데이터 출처 화면이 열리고 ‹로 설정에 돌아온다.

## Answer

2026-11-02. `/settings`(`app/(price)/settings`)와 `/settings/sources`를 만들었다. 둘 다 noindex다.

- 화면 틀 `features/settings/`는 다른 feature를 import하지 않는다. 항목은 라우트가 각 feature에서 가져와 넣는다.
  - `features/seasonal/settings/display-settings.tsx`: 옛 `settings-fields`를 옮긴 것. `SeasonalDisplaySettings`, `EatenRecordSetting`
  - `features/price/settings/price-record-settings.tsx`
- 행 부품 `SettingSection` · `ClearRow`(확인 시트)는 `shared/settings/`에 있다.
- 달력 모양 미리보기는 `useToday()`를 읽는다. 그래서 `/settings` 라우트가 `TodayProvider`를 깐다.
- 2a 설정 시트(`settings-panel`)와 `ThisMonthOnly`를 지웠다. 제철 헤더의 ⚙는 `/settings` 링크(`settings-link`)다.
- store를 `shared/`로 옮기지 않았다. 지우기 함수는 각 store 모듈에 둔다: `clearEaten` · `useEatenTotal`은 새로 만들었고, `clearBasket` · `clearRecent`는 원래 있던 것이다.
- 확인한 것:
  - 375 · 1280에서 오류가 없다.
  - 2a ⚙ → `/settings` → 격자를 고르면 `seasonal:settings`에 반영된다.
  - 최근 본 품종 2개 → 지우기 확인 → 0개가 된다.
  - 스위치가 오른쪽으로 10px 넘치던 문제(화면 지도 버그 6)도 고쳤다.
- 개발 서버 주의: `export const useX = store.useHydrated` 꼴로 새로 더한 export가 개발 서버 SSR에서 "is not a function"으로 실패했다. 함수로 감싸니 풀렸다.
