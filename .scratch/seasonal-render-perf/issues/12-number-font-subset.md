# 12. 큰 숫자 폰트 서브셋

Status: resolved (2026-11-11, LCP는 13)
Type: task (AFK)
Blocked by: 없음

## 목적

모바일 LCP 요소는 큰 숫자 `h2.font-number`(Bricolage, 208KB)이고 폰트를 기다려 3.3초다(spec 6.4, Q13).

## 할 일

- [ ] `font-number` · `font-display`(Bricolage)가 쓰이는 글자를 모은다(숫자, `.` · `~` · `%` 등 기호, 영문 달 이름 등). 가격 화면도 같은 폰트를 쓰는지 확인
- [ ] 가변 축(굵기 · 폭)은 실제로 쓰는 범위만 남겨 서브셋을 만든다(`pyftsubset` 또는 `subset-font`). 원본은 남기고 만드는 명령을 스크립트로 둔다
- [ ] `shared/fonts/display-font.ts`가 서브셋을 쓰고 preload되는지(`next/font/local` 기본 동작) 확인한다
- [ ] 빠진 글자가 없는지 2a · 2b · 가격 메인 · 다운로드를 눈으로 본다

## 완료 기준

- 폰트 파일 크기 전후와 로컬 Lighthouse LCP를 `baseline.md`에 적었다
- `pnpm typecheck`, `pnpm lint`, `pnpm test` 통과. 375 · 1280 확인, 콘솔 오류 없음
