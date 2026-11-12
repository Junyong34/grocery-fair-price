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
| 프리렌더 `.html` 파일(인라인 RSC 제외) | | 806KB |
| `<img>` | 782 | 782 |
| 그림마다 붙던 client 컴포넌트 | `DraggableScatter` 판 + `next/image` 782개 | `IntentLink`(판 그림 링크)만 |

**주의:** 이 `.html` 파일에는 Next가 응답할 때 붙이는 인라인 RSC(`self.__next_f`)가 없다. 운영 HTML과 비교할 수 있는 값이 아니다. 아래 운영 측정을 본다.

### 04 + 08 뒤, 운영 (2026-11-11, 커밋 6e7c692 배포)

같은 방법(Lighthouse 12.6.1 모바일 3회, curl 3회). 응답은 `x-nextjs-prerender: 1`, `x-vercel-cache: HIT`.

| 지표 | 기준선 2·3회 | 1회 | 2회 | 3회 |
|---|---|---|---|---|
| 성능 점수 | 0.80 · 0.88 | 0.74 | 0.77 | 0.72 |
| LCP | 3.2 · 3.0s | 3.9s | 3.3s | 3.4s |
| TBT | 180 · 140ms | 180ms | 330ms | 290ms |
| 메인 스레드 | 5.9 · 4.4s | 5.7s | 5.1s | 5.9s |
| JS 실행(bootup) | 1.3 · 1.2s | 1.4s | 1.4s | 1.5s |
| DOM 요소 | 8,292 | 8,279 | 8,279 | 8,279 |
| HTML 압축 전 · brotli | 2.35MB · 202KB | 3.45MB · 304KB | | |
| TTFB · 완료 | 0.54~0.77s · 2.1~2.3s | 0.95s · 4.1s | 1.84s · 4.7s | 2.12s · 5.8s |

메인 스레드 내역(ms): Other 1661/1407/1607 · Style & Layout 1327/1263/1451 · Script Evaluation 1229/1151/1215 · Rendering 817/655/932 · Script Parsing 465/450/513.

**판정: 나아지지 않았다. HTML은 47% 커졌고 TBT · LCP · TTFB도 같거나 나쁘다.**

원인 분석(운영 HTML `after.html`):

- 인라인 스크립트 2개가 각각 약 1.32MB이고, 둘 다 2a 전체 트리를 담는다(`/foods/` 2,310회씩). 두 번째는 `43:o1,~43:…`로 시작하는 resume 스트림이다. **RSC 트리가 두 번 실린다.** 마크업은 약 0.8MB로 로컬 프리렌더와 같다.
- 04에서 판을 서버 컴포넌트로 옮기자 그림 하나하나의 마크업(className 6,600여 회 등)이 RSC 트리에 그대로 들어갔다. 전에는 `DraggableScatter`가 압축된 props(seed, foods)를 받아 브라우저에서 그렸다. **"서버에서 그리면 가볍다"는 가정이 RSC 크기에서는 반대로 작동했다.**
- 기준선 2.35MB도 마크업 약 0.8MB + 인라인 RSC 약 1.55MB였을 것으로 추정한다(중복 여부는 그때 응답을 남기지 않아 확인하지 못했다).
- TTFB 증가는 resume 쪽 렌더 비용 또는 응답 크기 때문일 수 있다. 티켓 03에서 가린다.
- Style & Layout(1.3~1.5s)과 DOM 8,279개는 그대로다. 하이드레이션을 줄여도 Script Evaluation이 줄지 않았다.

## RSC 중복 원인 (2026-11-11)

**결론: 요청 때 채우는 구멍(PPR resume)이 있는 페이지는 인라인 RSC가 두 벌 실린다. Next 16.4의 resume 동작이며 2a만의 문제가 아니다.**

운영 HTML의 인라인 RSC(`self.__next_f.push`) 비교:

| 경로 | 구멍 | HTML | 큰 RSC 조각 |
|---|---|---|---|
| `/` (시세 메인) | 없음, 완전 정적 | 148KB | 한 벌(작은 조각 26개) |
| `/seasonal/downloads` | 레이아웃의 오늘 Promise | 156KB | 57.8KB + 57.1KB |
| `/seasonal/seasons/winter` | 오늘 | 493KB | 176.6KB + 176.0KB |
| `/seasonal/months/3` | 오늘 | 577KB | 154.4KB + 150.6KB |
| `/seasonal/at/2026-11` (2a) | 오늘 | 3.45MB | 1.32MB + 1.32MB |

2a 응답 순서: 정적 셸 마크업(0~795KB, 히어로와 1~12월 전부) → RSC 1벌째(1.32MB) → 오늘 구멍 HTML `S:0~S:2`(각 약 7.6KB) → RSC 2벌째(1.32MB, `43:o1,~43:…`로 시작).

근거 코드: `next@16.4.3/dist/server/app-render/app-render.js` 2305~2335행. postponed 상태로 resume할 때 `reactServerResult`(요청 때 새로 그린 **전체** RSC)를 `createNodeInlinedDataStream`으로 HTML 뒤에 인라인한다. 정적 셸에도 프리렌더 RSC가 이미 들어 있어서 두 벌이 된다. 다운로드 화면의 1벌째에 `{"year":2026,"month":11,"day":11}`이 들어 있어, 두 조각이 어떻게 나뉘는지는 소스만으로 다 설명하지 못했다. 로컬 `next build`가 `/products/[product]`(원격 DB `"use cache"` 시간 초과)에서 매번 멈춰 `next start` 재현은 하지 못했다.

함께 설명되는 것:

- **TTFB 0.5~2초(티켓 03):** 셸은 Vercel 캐시 HIT이지만 resume은 매 요청 함수가 2a 전체 RSC를 새로 그린다. 완전 정적인 `/`는 약 20ms다.
- **04 뒤 HTML 47% 증가:** 판을 서버 컴포넌트로 옮겨 RSC 한 벌이 커졌고(그림마다 className · style이 트리에 들어감), 그것이 두 배로 실렸다.

고칠 방향(결정 필요):

1. `/seasonal` 페이지를 구멍 없는 완전 정적으로 만든다. 일 단위 "오늘"(달력 동그라미, 일별 카드, 먹음 기록 해)을 서버 요청 대신 브라우저에서 마운트 뒤 계산한다. 첫 화면은 지금 fallback과 같은 "오늘 표시 없는" 모양이라 하이드레이션 불일치는 없다. 그러면 RSC 한 벌, TTFB는 CDN 수준이 된다. AGENTS.md "today" 규칙과 `nextjs-16-patterns.md` 5.2를 바꿔야 한다.
2. RSC 한 벌 자체를 줄인다. 판 그림마다 반복되는 className · style을 줄이거나, 판을 압축된 props를 받는 client 컴포넌트로 되돌린다(드래그 코드는 없이).

## 09 Cloudflare 프록시 끔 (2026-11-11)

DNS: `jangbol.kr` A `216.198.79.1`, `www` CNAME `…vercel-dns-017.com`(Vercel). 이 컴퓨터의 OS DNS 캐시가 아직 Cloudflare IP를 돌려줘서, 아래는 `curl --resolve jangbol.kr:443:216.198.79.1`로 쟀다. 응답 `server: Vercel`, `x-vercel-id: icn1`(서울), `cf-ray` 없음. `www` → `https://jangbol.kr/` 308 유지.

| 경로 | 경유(전, 같은 시각 재측정) TTFB · 완료 | 직결(후) TTFB · 완료 |
|---|---|---|
| `/` | 1.57~2.20s · 2.1~3.1s | 0.03~0.56s · 0.04~0.56s |
| `/seasonal` | 1.36~1.52s · 4.8~7.0s | 0.13~0.50s · 1.37~2.05s |
| `/seasonal/months/3` | 1.19~2.83s · 1.8~5.2s | 0.04~0.48s · 0.22~0.85s |

첫 회는 연결 · 엣지 캐시 준비로 0.4~0.5s, 이후 0.03~0.15s. `/seasonal` 완료 1.4~2s는 resume 함수 실행과 HTML 3.45MB 때문이며 티켓 10 · 11 몫이다.

## 12 큰 숫자 폰트 서브셋 (2026-11-11)

`scripts/subset-display-font.sh`: 기본 라틴 · Latin-1 · 문장부호 · 화살표 · ₩ · €만 남기고 폭(wdth) 축을 100%로 고정(코드 어디에서도 폭을 바꾸지 않음). 굵기 · 광학 크기 축과 OpenType 기능(tabular-nums 등)은 남김.

| 파일 | 크기 |
|---|---|
| 원본 `BricolageGrotesque-full.woff2` | 212,152B |
| 글자만 줄임 | 150,340B |
| + 폭 고정(사용 파일) | 87,084B (−59%) |

검증: 원본과 서브셋으로 `0-9 · 영문 달 이름 · 1,280 · 12.5% · → ₩ — · ×`를 굵기 300/400/600/800 × 크기 15/40/88px로 그려 픽셀 비교, 모두 차이 없음. LCP는 배포 뒤 13에서 잰다.

## 13 재설계 뒤 운영 (2026-11-11, 커밋 547bde3 배포)

Cloudflare 프록시 끔(09), 오늘 구멍 없앰(10), 2a는 1월 · 이번 달 · 다음 달만 서버가 그림(11), 숫자 폰트 87KB(12).

| 지표 | 기준선 | 04+08 뒤 | 재설계 뒤 |
|---|---|---|---|
| HTML 압축 전 · brotli | 2.35MB · 202KB | 3.45MB · 304KB | **0.65MB · 54KB** |
| 인라인 RSC | 추정 1.55MB | 1.32MB × 2벌 | 한 벌(조각 최대 6KB) |
| `<img>`(첫 HTML) | 782 | 782 | **242** |
| DOM(Lighthouse) | 8,292 | 8,279 | **2,902** |
| TTFB · 완료(curl, 3회) | 0.54~0.77s · 2.1~2.3s | 0.95~2.12s · 4.1~5.8s | **0.16~0.52s · 0.17~0.53s** |
| 전송량(Lighthouse) | 2,914KiB | | 1,943~2,316KiB(폰트 34개 798KiB가 가장 큼) |

**Lighthouse 시간 지표(LCP · TBT)는 이번에 판정하지 못했다.** 측정한 컴퓨터의 부하 평균이 약 18(8코어)이었다. 다른 세션의 `next` 빌드가 같은 시간에 돌았고, 메인 스레드 시간이 19~36초로 기준선(4~6초)과 비교할 수 없이 튀었다. 부하가 없을 때 다시 잰다.

그래도 구조 문제 하나는 측정에서 드러나 고쳤다(547bde3). 1월 섹션까지 늦게 그리자 히어로 바로 아래 1월 제목이 LCP 요소가 되었고, LCP의 95%가 Render Delay(JS를 받아 그릴 때까지)였다. 1월은 언제나 히어로 바로 아래라 서버에서 그린다. 그 대가로 첫 HTML DOM이 목표(2,500)를 약 400 넘는다.

### 13 재측정 (2026-11-12 09:15, 부하 평균 1.6)

같은 방법(Lighthouse 12.6.1 모바일 3회, curl 3회). 커밋 547bde3 배포.

| 지표 | 기준선 2 · 3회 | 1회 | 2회 | 3회 | 목표 |
|---|---|---|---|---|---|
| 성능 점수 | 0.80 · 0.88 | 0.58 | 0.77 | 0.65 | |
| LCP | 3.2 · 3.0s | 10.5s | 4.8s | 6.8s | ≤ 2.5s ✗ |
| FCP | | 6.9s | 2.9s | 4.5s | |
| TBT | 180 · 140ms | 100ms | 60ms | 70ms | ≤ 200ms ✓ |
| 메인 스레드 | 5.9 · 4.4s | 4.5s | 2.2s | 2.1s | ↓ ✓ |
| JS 실행 | 1.3 · 1.2s | 0.8s | 0.7s | 0.7s | ↓ ✓ |
| DOM | 8,292 | 2,902 | 2,902 | 2,902 | ≤ 2,500 △ |
| 전송량 | 2,914KiB | 2,317KiB | | | |
| TTFB(curl) | 0.54~0.77s | 2.03s(첫 회) | 0.39s | 0.39s | ≤ 200ms ✗ |

**판정: 스크립트 · DOM · HTML은 목표를 넘겼고, LCP · FCP는 기준선보다 나쁘다.**

- LCP 요소는 히어로 아래로 살짝 보이는 1월 제목 `h2.font-number`(뷰포트 412×823에서 top 781)다. LCP 단계의 대부분이 Render Delay(4.2~9.7초)이고, 이제 JS를 기다리지 않는다(서버가 그림).
- 첫 그리기 전에 받는 것: 폰트 34개 798KiB(Pretendard 동적 서브셋 조각들과 next/font 조각이 VeryHigh), 스크립트 48개 802KiB, 그림 57개 468KiB, CSS 89KiB(렌더 차단 65KiB 하나). 느린 4G 모의에서는 이 2.2MB가 대역폭을 나눠 쓴다.
- 기준선의 LCP가 왜 더 빨랐는지는 확인하지 못했다(그때 LCP 요소는 데스크톱 패널의 큰 숫자였다고 기록돼 있다). Lighthouse의 모의 계산(Lantern)은 회차마다 4.8~10.5초로 흔들려 한 원인으로 단정하지 않는다.
- 다음 후보: (1) 폰트 798KiB(가장 큰 전송)를 줄이기, (2) 첫 화면 밖 그림(57개)의 요청 시점 늦추기, (3) 히어로 크기를 다듬어 1월 제목이 첫 화면에 걸리지 않게 하기(화면 설계 변경).
