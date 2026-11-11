# 07. 수채 필터 병목 판정 (조건부)

Status: wontfix (측정상 Rendering 0.66s로 주원인 아님, architecture.md 5장)
Type: task (HITL)
Blocked by: 01, 04, 05

## 목적

그림 SVG 296개는 모두 수채 질감 필터(`feTurbulence` + `feDisplacementMap`)를 쓴다. 브라우저는 그림을 그릴 때마다 이 필터를 계산한다. 04 · 05 뒤에도 스크롤이 버벅이고 그 원인이 그림 그리기라면, 작은 자리 그림을 바꾼다(spec 2.4, Q8). 원인이 아니면 닫는다.

## 할 일

- [ ] 04 · 05 배포 후 01과 같은 방법으로 trace를 다시 잰다. 스크롤 긴 프레임에서 Paint · Rasterize 비중을 본다
- [ ] 주원인이 아니면 `Status: wontfix`, 결과를 `baseline.md`에 적고 닫는다
- [ ] 주원인이면 두 후보를 몇 품종으로 비교한다: (1) 필터를 뺀 SVG 변형(`small.svg`, 빌드 때 생성) (2) WebP · AVIF 래스터 2x. 바이트, 디코드 · 페인트 시간, 120px 이하에서 질감 차이
- [ ] 비교 결과로 사용자에게 고르게 하고(HITL), 고른 안을 새 티켓으로 쓴다

## 완료 기준

- `baseline.md`에 판정과 근거 숫자가 있다
- 주원인이면 사용자가 고른 안의 구현 티켓이 있다
