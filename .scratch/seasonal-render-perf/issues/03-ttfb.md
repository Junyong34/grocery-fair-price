# 03. TTFB 0.55초 원인

Status: resolved (architecture.md 1장 Cloudflare LAX 경유 · 3장 resume 함수 실행으로 답함. 고치는 일은 09 · 10, 2026-11-11)
Type: task (AFK)
Blocked by: 없음

## 목적

2a는 정적 페이지인데 운영 첫 바이트가 약 0.55초다. 11-05 목표는 200ms 이하였다(`.scratch/seasonal-static/spec.md` 확인 5). proxy rewrite, Cloudflare, Vercel 캐시 중 어디서 늦는지 가린다.

## 할 일

- [ ] `/seasonal`(rewrite), `/seasonal/at/2026-11`(rewrite 없음), `/seasonal/months/3`(정적), `/`(완전 정적)의 TTFB를 같은 조건으로 3회씩 잰다
- [ ] 응답 헤더 비교: `cf-cache-status`, `x-vercel-cache`, `cache-control`, `x-nextjs-rewritten-path`. 오늘 표시 구멍(PPR) 때문에 HTML이 Cloudflare에서 캐시되지 않는지 본다
- [ ] Vercel 로그에서 proxy(`proxy.ts`) 실행 시간과 함수 지역(`hnd1`)을 확인한다
- [ ] 결과와 고칠 방향을 `baseline.md`의 "TTFB" 절에 쓴다. 설정 한 줄로 끝나면 이 티켓에서 고치고, 구조 변경이면 새 티켓으로 남긴다

## 완료 기준

- 0.55초를 구간별로 설명한다(망 · Cloudflare · proxy · 렌더)
- 고쳤다면 운영 TTFB를 다시 재서 `baseline.md`에 덧붙였다
