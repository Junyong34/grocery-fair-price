# 03. 제철 셸: 내비·헤더·서체·토큰·`FoodImage`·store

Status: resolved
Blocked by: 02

## 목적

모든 제철 화면이 함께 쓰는 틀과 부품을 만든다.

## 할 일

- [x] **서체**: `apps/web/app/layout.tsx`의 Roboto를 Pretendard(`next/font/local`), 명조 제목 서체, cojeev 숫자 서체로 바꾼다. `--font-sans`, `--font-heading`, 숫자용 변수를 연결한다.
- [x] **토큰**: spec의 매핑표대로 쓴다. 연한 gold 배경이 필요하면 `--color-gold-wash`를 `globals.css`에 추가한다.
- [x] **Floating Nav**(명세 2.2): `SeasonalShell`의 임시 내비를 바꾼다. 활성 항목은 아이콘과 라벨, 비활성은 아이콘만 보인다. 전환 .25s. 활성 매핑은 지금 `NavLink`의 `also` 규칙을 그대로 쓴다. 데스크톱(≥1024)에서는 숨기고 상단 내비를 보인다.
- [x] **데스크톱 상단 내비**: 브랜드, `이달 · 계절 · 나의 식탁`, 검색 입력 자리(10에서 연결), ⚙ 자리(04에서 연결).
- [x] **모바일 헤더와 2차 탭**(명세 2.1): 지금 `SubTabs`를 명세 모양으로 바꾼다. cojeev `tabs`가 맞으면 쓴다.
- [x] **공통 부품**: 계절 태그(2.4), 12칸 제철 막대, 먹음 배지 ✓(2.3), CSS 키프레임 `pop`·`tick`·`fade-in`·`rise`.
- 칩과 보기 전환 세그먼트(cojeev `toggle-group`)는 처음 쓰는 06·07로 옮겼다.
- [x] **`FoodImage`**: id를 받아 `/foods/<id>/color.svg`를 보인다. `drawn-foods.ts`에 없으면 이름 카드로 대신한다. `variant="motion"`은 05에서 쓴다.
- [x] **zustand**: `apps/web`에 설치한다. 먹음 기록 store(`apps/web/shared/`, 연도별 Set, persist, `skipHydration`)와 클라이언트 재수화 위치(`shared/providers.tsx`)를 만든다. 먹음 기록을 읽는 훅은 하이드레이션 전에 빈 값을 낸다.

## 완료 조건

- 모든 제철 라우트에서 내비 활성 상태가 맞다(375, 1280 스크린샷).
- 새로고침 뒤에도 먹음 기록이 남고, 하이드레이션 경고가 없다.
- 컴포넌트에 hex 값이 없다.

## Answer

2026-10-14 완료.

- 서체: 본문 Pretendard(`pretendard` 패키지의 동적 서브셋 CSS. cojeev `--font-text`를 덮어씀), 제목 Gowun Batang(`next/font/google`, `--font-serif-ko`, `font-heading`), 큰 숫자 Bricolage(`font-number`). 한글 명조에는 이탤릭이 없으므로 명세의 italic 문구는 기울이지 않는다.
- 토큰: `--color-gold-wash`, `--animate-pop|tick|fade-in|rise`를 `packages/ui` globals.css에 추가했다.
- 내비: cojeev `dock`(콜백형 런처), `tabs`(패널 탭)는 링크 내비와 맞지 않아 직접 만들었다(`features/seasonal/components/main-nav.tsx`). 활성 판정은 `useIsActive`.
- 헤더의 검색(10)과 ⚙(04) 자리는 비워 두었다. 데스크톱은 `TopNav actions`, 모바일은 헤더 오른쪽.
- 먹음 기록: `apps/web/shared/eaten-store.ts`(zustand persist `seasonal:eaten`, 연도별 id 목록, `skipHydration`). `Providers`가 마운트 뒤 다시 불러온다.
- `next/image`의 `priority`는 Next 16에서 지원 중단 → `FoodImage`는 `preload`를 받는다.
- 확인 페이지: `/examples/seasonal-parts`(계절 태그, 품종 이미지·이름 카드, 먹음 배지, 12칸 막대, 서체).
- 검증: 모든 제철 라우트에서 상단·2차 탭·하단 내비 활성 표시 확인(375, 1280). 기록 2개 → 새로고침 뒤에도 배지 2개, 하이드레이션 경고와 `get_errors` 없음. `next build` 통과.
