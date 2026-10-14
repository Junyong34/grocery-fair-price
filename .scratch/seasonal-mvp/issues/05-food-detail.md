# 05. 1i 품종 상세

Status: resolved
Blocked by: 03

## 목적

명세가 비워 둔 1i 화면을 spec "화면별"의 구성대로 만든다.

## 할 일

- [x] `foods/[food]`의 `generateStaticParams`를 `foods.ts` 전체 id로 바꾸고, 없는 id는 `notFound()`로 막는다(파일의 TODO).
- [x] 구성: 큰 일러스트(`motion` 변형 `<img>`. CSS 키프레임이 SVG 안에 있어 GSAP이 필요 없다), 품종명과 계절 태그, 12칸 제철 막대, 먹음 기록 토글(+1 pop), 관련 명절 링크(없으면 생략), 같은 달 다른 품종 가로 스크롤, "가격 보기" 비활성('준비 중').
- [x] 같은 내용을 세 껍데기에 넣는다: 모바일 하단 시트(`@sheet` 가로채기), 데스크톱 오른쪽 패널(cojeev `sheet`, `pnpm ui:add`), 주소로 직접 연 전체 페이지.
- [x] 줄인 모션 설정이면 일러스트 움직임과 pop을 끈다.

## 완료 조건

- 2a에서 품종을 누르면 시트(모바일) 또는 패널(데스크톱)이 열리고, 닫으면 스크롤 위치가 그대로다.
- 상세에서 기록하면 뒤 화면의 ✓가 바로 바뀐다.

## Answer

2026-10-14 완료.

- 본문 `features/seasonal/food-detail/food-detail.tsx`(서버 컴포넌트) 하나를 세 껍데기가 쓴다: 모바일 하단 시트(`BottomSheet`), 데스크톱 오른쪽 패널(cojeev `sheet`), 전체 페이지. 시트·패널 선택은 `matchMedia(min-width: 1024px)`(`useSyncExternalStore`, 서버는 모바일로 봄).
- "같은 때 제철"은 제철 달이 겹치는 품종을 겹치는 달이 많은 순으로 12개(`foodsInSeasonWith`). 누르면 시트 안에서 `replace`로 바뀌어 뒤로 가기가 쌓이지 않는다.
- 관련 명절은 그 무렵 제철 품종으로 그 품종을 꼽은 명절(`festivalsWithFood`).
- 먹음 기록 토글은 올해(서울)를 `TodayProvider`(seasonal 레이아웃, Promise)에서 `use()`로 읽는다. 상세 본문은 정적이고 토글만 `<Suspense>` 구멍이다. 품종 79개 × (페이지 + 가로채기) 정적 생성.
- 없는 id: 전체 페이지는 not-found(스트리밍이라 상태 코드는 200, `noindex`), 시트는 뜨지 않는다.
- 검증(프로덕션 빌드 `next start`): 모바일 시트(전어) → 기록 → 뒤 화면 ✓ 즉시 반영·+1 pop, Esc로 닫으면 스크롤 위치 그대로, 데스크톱 패널(사과) → 같은 때 제철(고등어)로 전환, 직접 주소 전체 페이지, 테스트 19개.
- dev 서버(3000)는 cojeev `sheet` 설치 도중의 CSS(`@/styles/...` import)를 캐시해 globals.css 오류를 계속 냈다. 파일과 빌드는 정상이다. dev 서버를 다시 시작하면 사라진다(handoff의 "dev server kept stale state").
