# 14. 가격 화면 첫 요청과 함수 리전

Status: needs-triage
Type: research
Blocked by: —

[jangbol-growth/08](../../jangbol-growth/issues/08-performance.md)에서 옮겼다(2026-11-27). 제철 화면 쪽은 이 명세의 01~13이 답했다. 가격 화면은 이 명세 범위 밖이었지만 측정 방법(`baseline.md`)을 그대로 쓰려고 여기 둔다.

## 질문

가격 상세(`/prices/[variety]`, `/products/[goodId]`)의 첫 요청에서 DB 왕복 · 쿼리 · 콜드 스타트 · 캐시 중 무엇이 가장 큰가? 함수 리전(`apps/web/vercel.json`의 `hnd1`)과 Supabase 리전 조합을 바꾸면 얼마나 줄어드는가?

## 완료 기준

- 대표 URL 몇 개의 첫/반복 요청 TTFB를 `baseline.md` 방법으로 재고, 리전을 바꿀지 판정과 반증 조건을 적는다.
