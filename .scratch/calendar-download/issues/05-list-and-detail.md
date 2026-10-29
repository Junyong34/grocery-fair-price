# 05. 목록(종류별 줄)·에디션 상세

Status: resolved
Blocked by: 02, 04

## 목적

04에서 고른 안으로 `/seasonal/downloads` 목록과 `/seasonal/downloads/[edition]` 상세를 만든다.

## 할 일

- [ ] 목록 2-C: 종류별 가로 줄, 줄 제목에 종류 · 개수 · 쪽 수, 칸 이름은 종류를 뺀 짧은 이름. 썸네일은 `next/image`. 상세 3-B(시트 조금 높게), 직접 열면 3-P. 04 `## Answer` 참고.
- [ ] `[edition]` 라우트: `generateStaticParams`(게시 + 내려간 에디션), 없으면 `notFound()`, `createMetadata`, `shared/seo/pages.ts` 등록(색인). 내려간 에디션 화면 자체는 07.
- [ ] `@sheet/(.)downloads/[edition]` 가로채기로 목록에서 바텀시트(`openBottomSheet` 패턴은 `food-sheet.tsx` 참고). 직접 열면 전체 페이지.
- [ ] 연도 있는 에디션: 11월부터 다음 해 에디션을 함께(지난해 것은 운영자가 1월에 내릴 때까지 그대로)(Seoul today는 `useToday()`). 정렬 규칙을 순수 함수 + 테스트로.
- [ ] 내려받기 버튼은 06의 우리 주소. "A3도 원해요" 버튼(동작은 08).
- [ ] 문구는 `DOWNLOADS_COPY`, A3 관련 옛 문구 정리.

## 완료 조건

- 루트 검사 통과. `next-dev-loop`로 375·1280에서 목록 → 시트 → 직접 주소 진입이 되고 콘솔 오류·hydration 경고 없음.

## Answer

2026-10-29 완료.

- 순수 함수 `packages/seasonal/src/print/listing.ts`(+ 테스트): `shelvesOf`(종류 순서 줄, 줄 안 새 연도 먼저), `editionName`("2027 크림 월간 달력": 줄 밖에서 쓰는 이름), `editionMeta`(A4 세로 · 13쪽 · 7.4MB), `megabytes`.
- 매니페스트는 `shared/downloads-manifest.ts`(`DOWNLOADS`, `findEdition`)로 읽는다. 화면과 sitemap(`shared/seo/pages.ts`)이 같이 쓰므로 shared에 뒀다. 에디션 상세는 색인 대상이고 썸네일을 이미지 sitemap으로 알린다.
- 목록 2-C: `EditionShelf`(모바일 가로 넘김, 칸 폭 38%로 끝 칸이 잘려 보임, 데스크톱 4열). 칸 이름은 제목만, 종류가 섞인 "다른 인쇄물" 줄은 `fullNames`.
- 상세 3-B: `EditionDetail`을 시트와 페이지가 같이 쓴다. 썸네일(월간은 표지 + 1월) → 종류 배지 · 메타 → 설명 → 인쇄 팁(월간만 "한 달만" 줄) → [공유][PDF 내려받기 크기]. 시트 제목 줄의 공유 아이콘은 뺐다(버튼 줄에 있음). 전체 페이지(3-P)는 ‹ 목록 링크, h1, "다른 인쇄물" 줄.
- 시트 껍데기 `food-sheet`를 `detail-sheet`(`DetailSheet`, `action` prop)로 이름을 바꿔 품종 · 에디션이 같이 쓴다. `ShareButton`에 `label`(글자 있는 테두리 버튼).
- 게시된 에디션이 없으면 `generateStaticParams`가 `none` 하나를 낸다(Cache Components는 빈 목록이 빌드 오류). `none`은 notFound. `next build` 통과 확인.
- **스펙과 달라진 점**: "11월부터 다음 해 에디션을 함께"를 화면의 날짜 규칙으로 만들지 않았다. 목록이 정적이라 오늘 날짜로 거르려면 클라이언트에서 다시 그려야 하는데, 운영자가 11월에 게시하고 1월에 내리면 같은 결과다. 스펙 결정 표를 고쳤다.
- 확인: 루트 typecheck · lint(오류 0) · test 통과, `next build` 통과. 에디션 4개를 임시로 게시 · 생성해 375 · 1280에서 목록 → 시트(가로채기) → 뒤로 → 직접 주소(전체 페이지) 확인, 가로 넘침 · 콘솔 오류 없음. 임시 데이터는 되돌렸다.
- 남은 것: 내려받기 링크 주소는 06에서 생긴다. 없는 에디션 주소(`/seasonal/downloads/nope`)는 다른 제철 404(`foods/nope`)와 같이 `usePathname()` 경고가 콘솔에 뜬다. 이 티켓 전부터 있던 not-found 작업(커밋 전)의 문제라 따로 본다.
