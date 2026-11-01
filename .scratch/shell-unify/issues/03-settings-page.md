# 03. 통일 설정 화면 `/settings`

Status: ready-for-agent
Type: task (AFK)
Blocked by: 없음

## 목적

⚙를 어디서 눌러도 같은 설정 화면을 연다. 2a 전용 설정 시트를 없애고, 주제별 섹션(화면 표시 · 내 기록 · 정보)으로 모은다(spec 5장, 캔버스 E 페이지 S2).

## 할 일

- [ ] `shared/routes.ts`에 `settings: { root: "/settings", sources: "/settings/sources" }`를 더한다. `proxy.ts` matcher와 겹치지 않는지 확인한다.
- [ ] 라우트 `app/(price)/settings/page.tsx` · `settings/sources/page.tsx`를 만든다(셸은 01 이후 공통이므로 그룹은 쓰기 편한 곳에 둔다). `createMetadata`를 쓰고, `shared/seo/pages.ts`에 noindex로 등록한다.
- [ ] 새 feature `apps/web/features/settings/`: `settings-view`(섹션 3개), `sources-view`, `clear-confirm`(기록 지우기 확인 시트, `openBottomSheet`), `copy.ts`
- [ ] 화면 표시 섹션은 지금 `this-month/settings-fields.tsx`의 필드(공휴일, 먹은 음식, 달력 모양 `calendar-style-picker`, 달 이름)를 옮겨 쓴다. 행마다 "제철달력"을 작게 표시한다.
- [ ] 내 기록 섹션은 담은 품종 비우기(n개), 최근 본 품종 지우기, 먹음 기록 지우기(n개)다. store 모듈에 `clearBasket` · `clearRecent` · `clearEaten`을 더하고 테스트를 먼저 쓴다. features끼리 import하지 않도록, 설정 화면이 쓰는 store 훅과 함수는 `shared/`에서 오게 한다(필요하면 store 파일을 `shared/`로 옮긴다. 키 이름은 그대로 둔다).
- [ ] 정보 섹션은 데이터 출처(KAMIS 평일 · 축산물품질평가원 매일 · 참가격 격주, 근거 `grocery-price/docs/30-data/sources/`), 개인정보 처리방침(`routes.privacy`), 버전이다. 맨 아래에 "이 기기에만 저장돼요" 안내를 둔다.
- [ ] 2a 설정 시트를 지운다: `settings-panel.tsx`, `settings-scope.tsx`, `ThisMonthOnly`(다른 곳에서 안 쓰면). 제철 헤더의 ⚙는 `/settings` 링크로 바꾼다(모바일 · 데스크톱). 루트 헤더 전체에 ⚙를 넣는 일은 04에서 한다.
- [ ] 분석 이벤트를 바꾸거나 더하면 `shared/analytics/events.ts`와 `apps/web/docs/analytics.md` 절차를 따른다.
- [ ] `docs/project-structure.md`의 라우트 · features · 상태 표를 고친다.

## 완료 기준

- 루트 `pnpm typecheck` · `pnpm lint` · `pnpm test` 통과(SEO 가드 테스트 포함)
- 375 · 1280에서 확인한다:
  - 2a ⚙ → 설정 → 달력 모양을 바꾸고 ‹ → 2a에 반영된다.
  - 기록 지우기 확인 → 지운 뒤 개수가 0이 되고, P4 · 1h에 반영된다.
  - 데이터 출처 화면이 열리고 ‹로 설정에 돌아온다.
