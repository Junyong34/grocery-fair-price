# 05. 목록(종류별 줄)·에디션 상세

Status: ready-for-agent
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
