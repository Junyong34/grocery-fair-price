# 04. 2a 판 드래그 제거

Status: resolved (커밋 e754153)
Type: task (AFK)
Blocked by: 01

## 목적

12개월 판(최대 360개 그림)이 모두 하이드레이션되는 비용을 없앤다. 판은 서버에서 그리고 그림 한 칸만 client로 남긴다(spec 2.2, Q5 · Q7).

## 할 일

- [x] `ScatterField`(`features/seasonal/components/scatter-field.tsx`)가 `scatterLayout()` 결과로 판과 그림 자리를 직접 그린다. 서버 컴포넌트
- [x] `draggable-scatter.tsx`의 `FoodTile`(368행~)을 `ScatterField` 안으로 옮긴다(client는 `IntentLink` · `EatenName`): `IntentLink` → 1i 시트, `FoodImage`, `useIsEaten` 먹음 표시, 이름표 위치(`FOOD_BOTTOM`)
- [x] 판 테두리: 점선 outline(`outline-dashed` 등, 240행)은 지우고 `PatternBackground` 점무늬는 둔다
- [x] 모바일 판 바닥 달력의 폭 맞춤 배율(`useCalendarScale`, 347행)을 CSS(컨테이너 단위)나 작은 client 부분으로 옮긴다. 375 · 430 · 600 폭에서 달력이 비워 둔 자리를 채우는지 확인
- [x] 데스크톱 달 판의 달력은 기본 자리에 고정한다
- [x] 지운다: `draggable-scatter.tsx`, `use-drag-gesture.ts`, `stores/scatter-store.ts`. 기기의 `seasonal:scatter`는 읽지도 지우지도 않는다. `arrangement.ts`와 테스트도 드래그 전용이라 지우고, `scatter.ts`에서 밖에서 안 쓰는 export를 내렸다
- [x] 안내 문구 삭제: `this-month-view.tsx` 81행 "그림을 끌어 옮겨 보세요", 174행 "그림을 끌어 달력 위에도 놓아 꾸며 보세요". "N가지 제철"은 남김. 주석의 드래그 설명도 고친다(`scatter-field.tsx` 9~12행)
- [ ] 배포 후 `baseline.md` 표를 다시 재서 한 줄 덧붙인다(TBT, 긴 프레임, RSC 크기)

## 완료 기준

- `pnpm typecheck`, `pnpm lint`(0 errors), `pnpm test` 통과
- `next-dev-loop`로 2a를 375 · 1280에서 확인: 그림을 끌어도 움직이지 않고, 누르면 1i 시트가 열리고, 먹음 표시가 보인다. 콘솔 오류 · 하이드레이션 경고 없음
- 판 배치가 바뀌기 전과 같다(같은 seed → 같은 자리)

## Comments

- 2026-11-11: 구현. 판은 서버 컴포넌트(`scatter-field.tsx`)가 그리고, client는 `IntentLink` · `EatenName` · `CalendarFit`(모바일 달력 배율)뿐이다. typecheck · lint · test 통과, 375 · 1280에서 탭 → 1i 시트, 달력 배율, 콘솔 확인. 운영 재측정은 push 뒤에 한다.
