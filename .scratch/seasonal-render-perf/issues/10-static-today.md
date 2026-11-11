# 10. 오늘 표시를 브라우저로, /seasonal 완전 정적

Status: resolved (2026-11-11, 운영 확인은 13)
Type: task (AFK)
Blocked by: 없음

## 목적

`/seasonal` 페이지는 레이아웃의 오늘 Promise 때문에 PPR 구멍이 있고, Next 16.4 resume이 RSC 전체를 한 벌 더 싣고(2a 1.32MB) 요청마다 함수를 돌린다. 오늘을 브라우저가 첫 그리기 전에 표시해 구멍을 없앤다(spec 6.2, Q11 · Q15).

## 할 일

- [ ] 오늘 값을 읽는 곳 전부를 분류한다: `app/seasonal/layout.tsx`, `app/seasonal/(this-month)/page.tsx`, `features/seasonal/` 아래 `getSeoulToday` · `useToday` 사용처 15곳(`grill.md` 라운드 3 조사)
  - 보이는 표시(달력 오늘 동그라미, 일별 카드 "오늘", 2b · 계절 · 명절의 이번 달/지금 태그): `data-date` + 숨긴 표시 + CSS
  - 연도만 필요(2a 먹음 배지): 주소의 연도
  - 누르는 부품(1i 먹음 토글, 나의 식탁, 식재료 달력, 다운로드 연도, 먹음 요약): 마운트 뒤 계산하는 client 훅. 첫 모양은 지금 fallback과 같게
- [ ] 레이아웃 맨 앞 인라인 스크립트: `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' })`로 오늘을 구해 `<style>`을 넣는다(필요하면 이번 달 · 연도 선택자도). CSP · `nonce` 영향이 있는지 확인. 날짜 계산은 `packages/seasonal`의 순수 함수로 두고 vitest 먼저
- [ ] `TodayProvider` · `today-context.tsx` · 서버 `getSeoulToday()`의 `/seasonal` 사용을 걷어낸다. 가격 화면 등 다른 사용처는 그대로
- [ ] AGENTS.md "today" 블록과 `apps/web/docs/nextjs-16-patterns.md` 5.2에 예외를 적는다
- [ ] 로컬 프로덕션 응답(`next build && next start`, `/products/[product]` 빌드 멈춤은 원격 DB 시간 초과라 필요하면 그 페이지만 우회)에서 `/seasonal/at/<이번 달>`의 인라인 RSC가 한 벌인지 확인한다

## 완료 기준

- 2a · 2b · 계절 · 명절 응답에 큰 RSC 조각이 한 벌뿐이다. 2a HTML 압축 전 약 2.1MB 이하
- 375 모바일 첫 화면에서 오늘 동그라미가 늦게 나타나지 않는다(Performance 녹화 첫 프레임에 있음). 하이드레이션 경고 없음
- `pnpm typecheck`, `pnpm lint`, `pnpm test` 통과. `/verify`로 2a · 2b · 계절 · 명절 · 1i · 나의 식탁을 375 · 1280에서 확인, 콘솔 오류 없음
