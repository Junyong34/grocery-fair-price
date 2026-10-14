# 09. 1g 명절

Status: resolved
Blocked by: 03

## 목적

명세 3.4를 `/seasonal/festivals/[festival]`에 만든다.

## 할 일

- [x] 명절 칩 가로 스크롤(라우트 이동). `/seasonal/festivals`는 지금처럼 `proxy.ts`가 다가오는 명절로 보낸다.
- [x] 명절명, 시기와 양력 날짜(그해 값이 없으면 날짜를 숨긴다), 배경 설명(`copy.ts`).
- [x] 전통 음식: 실선 카드, 링크 없음. 그 무렵 제철 품종: 점선 카드, 1i로 간다. 범례.
- [x] "{m}월 달력에서 보기 →" → `routes.seasonal.rootAt(m)`.
- [x] 데스크톱: 가운데 단일 열(최대 폭 720), 전통 음식 3열, 제철 품종 줄바꿈.

## 완료 조건

- 2027년 날짜가 없는 명절도 화면이 깨지지 않는다(기준일을 바꿔 확인).
- 375와 1280 스크린샷.

## Answer

2026-10-14 완료.

- 명절 칩은 `app/seasonal/(season)/festivals/layout.tsx`에 둬서 명절을 바꿔도 남는다(고른 명절은 `useParams`). `/seasonal/festivals`는 proxy가 다가오는 명절로 보낸다(10월 → 동지).
- 본문 `FestivalView`는 정적이다. 올해 양력 날짜(요일 포함)와 "{m}월 달력에서 보기"의 달만 `useToday()`로 Suspense 안에서 읽는다. 날짜가 없으면(삼복, 표에 없는 연도) 시기 문구만 보이고, 달력 링크는 대표 달로 간다. 정월대보름은 2026년 3월, 2027년 2월로 링크가 바뀐다.
- 전통 음식은 실선 카드(그림이 없어 lucide `Soup` 아이콘), 링크 없음. 그 무렵 제철 품종은 점선 카드 → 1i. 범례.
- 데스크톱도 가운데 한 열(최대 720), 전통 음식 3열, 칩은 가운데 정렬로 줄바꿈.
- "표에 없는 연도"를 화면에서 직접 바꿔 보지는 않았다. 같은 null 경로를 삼복 화면으로 확인했고, 연도별 null은 `festivalDate` 테스트가 다룬다.
- 새 레이아웃을 넣은 뒤 `pnpm typecheck`가 `LayoutProps<"/seasonal/festivals">`에서 실패했다. `.next/types`(빌드 타입)가 이전 빌드 것이라서다. `next build`로 다시 만들면 통과한다.
- 검증(375·1280): 칩 이동, 동지·삼복·정월대보름·추석 날짜 줄, 달력 링크 → 2a 9월 섹션으로 즉시 이동, `get_errors` 없음, `next build` 통과.
