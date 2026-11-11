# 01. 운영 기준선 측정

Status: resolved
Type: task (AFK)
Blocked by: 없음

## 목적

이후 티켓의 효과를 판정할 운영 2a 기준선을 남긴다(spec 2.1, Q1). 수채 필터가 병목인지(티켓 07)도 이 측정으로 가린다.

## 할 일

- [ ] `.scratch/seasonal-render-perf/baseline.md`를 만든다. 측정 날짜, 커밋, 환경(이 컴퓨터, 망)을 적는다
- [ ] 운영 `https://jangbol.kr/seasonal`에서 Lighthouse 모바일 프리셋(375)을 3회 돌리고 중간값을 적는다: LCP, TBT, CLS, 성능 점수
- [ ] 375 모바일 CPU 4× 감속 Performance trace: 처음부터 12월까지 스크롤. 긴 프레임(50ms 넘는 task) 수와, 그 시간 중 Scripting(하이드레이션) · Paint/Rasterize · Layout 비중
- [ ] HTML(압축 전 · brotli), RSC payload 크기, `<img>` 수, 하이드레이션되는 client component 수(React DevTools 또는 trace)
- [ ] TTFB · 완료 시간(`curl`, 3회 중간값). `/seasonal`, `/seasonal/at/2026-11`, `/seasonal/months/3`
- [ ] 결과 끝에 한 줄 판정: "Paint/Rasterize가 긴 프레임의 주원인인가"

## 완료 기준

- `baseline.md`에 위 항목이 모두 숫자로 있다. 측정 방법을 다시 따라 할 수 있게 명령과 설정을 함께 적었다
- 이후 티켓이 같은 표에 줄을 덧붙일 수 있는 형식이다
