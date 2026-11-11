# 2a 렌더링 기준선

티켓 01. 운영 `https://jangbol.kr/seasonal`, 이 컴퓨터(한국, 회사망 아님), 커밋 `94fbbd3` 시점 배포.

## 측정 방법

```bash
# Lighthouse 12.6.1 모바일 기본 프리셋(375급 · CPU 4× · 느린 4G 모의), 3회
npx -y lighthouse@12.6.1 https://jangbol.kr/seasonal --quiet --chrome-flags="--headless=new" \
  --only-categories=performance --output=json --output-path=lh-$i.json
# TTFB · 완료, 3회
curl -s -o /dev/null -H 'accept-encoding: br' -w 'ttfb=%{time_starttransfer} total=%{time_total}\n' https://jangbol.kr/seasonal
```

## 기준선 (2026-11-11)

1회차는 캐시가 비어 있어(LCP 11.5s, TBT 690ms) 튀었다. 2·3회차 값을 쓴다.

| 지표 | 1회 | 2회 | 3회 | 목표 |
|---|---|---|---|---|
| 성능 점수 | 0.43 | 0.80 | 0.88 | |
| LCP | 11.5s | 3.2s | 3.0s | ≤ 2.5s |
| TBT | 690ms | 180ms | 140ms | ≤ 200ms |
| CLS | 0.003 | 0.001 | 0.002 | |
| Speed Index | | 7.2s | 4.8s | |
| 메인 스레드 작업 | 6.5s | 5.9s | 4.4s | ↓ |
| JS 실행(bootup) | 1.5s | 1.3s | 1.2s | ↓ |
| DOM 요소 | 8,292 | 8,292 | 8,292 | ↓ |
| 전송량 · 요청 | | 2,914KiB · 195 | 2,914KiB · 195 | |

메인 스레드 내역(2회 / 3회, ms): Other 1906/1195 · **Style & Layout 1530/1088** · Script Evaluation 1222/1039 · **Rendering 776/553** · Script Parsing 368/330 · Parse HTML & CSS 105/140.

- LCP 요소는 그림이 아니라 데스크톱 패널 쪽 큰 숫자 `h2.font-number`다(모바일 뷰포트에서 잡힘). 이미지가 LCP를 막지는 않는다.
- HTML 압축 전 2.35MB, brotli 202KB, `<img>` 782개. TTFB 0.54 · 0.77 · 0.58s, 완료 2.1 · 2.3 · 2.1s.

**판정:** Paint(Rendering)는 0.55~0.78s로 Style & Layout(1.1~1.5s)과 Script(1.4~1.6s)보다 작다. 지금은 DOM 크기와 하이드레이션이 먼저다. 수채 필터(티켓 07)는 04 · 05 뒤에 다시 본다.

## 변경 후

### 04 + 08 뒤, 로컬 프로덕션 빌드 (2026-11-11)

`apps/web`에서 `next build`, 프리렌더 결과 `.next/server/app/seasonal/at/2026-11.html`. 운영 응답과 같은 정적 셸이지만 운영 측정이 아니다. 빌드는 2a를 만든 뒤 무관한 `/products/[product]`(원격 DB `"use cache"` 시간 초과)에서 멈췄다.

| 지표 | 기준선(운영) | 04 + 08(로컬) |
|---|---|---|
| HTML 압축 전 | 2.35MB | 806KB |
| HTML brotli | 202KB | 40KB |
| `<img>` | 782 | 782 |
| 그림마다 붙던 client 컴포넌트 | `DraggableScatter` 판 + `next/image` 782개 | `IntentLink`(판 그림 링크)만 |

Lighthouse · TTFB는 push · 배포 뒤 운영에서 다시 잰다.
