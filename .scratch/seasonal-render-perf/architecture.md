# 제철달력 2a — 현재 구조 분석

2026-11-11, 커밋 `6e7c692` 배포 기준. 측정은 이 컴퓨터(한국, `loc=KR`)에서 했다. 설계를 다시 잡기 전에 "요청이 어디를 거쳐 오고, 어디서 캐시되고, 브라우저가 무엇을 하는지"를 한 장에 둔다. 숫자 출처: `baseline.md`, 운영 응답 헤더, Lighthouse JSON(`lh-after-2.json`).

## 1. 요청 경로

```
브라우저(서울)
  │  DNS: jangbol.kr → Cloudflare(104.21.x, 172.67.x), NS도 Cloudflare. 프록시(주황 구름) 켜짐
  ▼
Cloudflare PoP  ── colo=LAX (로스앤젤레스)      ← cloudflare.com은 같은 컴퓨터에서 colo=ICN(서울)
  │  HTML: cf-cache-status DYNAMIC (캐시 안 함, 그냥 통과)
  │  /_next/static: HIT,  /foods/*.svg: REVALIDATED
  ▼
Vercel 엣지  ── x-vercel-id sfo1 (샌프란시스코)  ← Vercel에 직접 붙으면 icn1(서울)
  │  proxy.ts (Routing Middleware): /seasonal → rewrite /seasonal/at/2026-11
  │  정적 셸: x-vercel-cache HIT (x-nextjs-prerender: 1)
  ▼
Vercel 함수  ── regions ["hnd1"] (도쿄, apps/web/vercel.json)
     PPR resume: 오늘 구멍 3개를 채우며 2a RSC 전체를 새로 그림
```

| 구간 | 경유(지금) | 직접(Vercel icn1) |
|---|---|---|
| `/`(완전 정적, 18KB) TTFB · 완료 | 1.23~1.60s · 2.8~5.0s | 0.33~0.72s · 0.34~0.72s |
| `/seasonal/months/3` TTFB · 완료 | 0.93~1.47s · 1.55~1.68s | 0.25~0.45s · 0.42~0.65s |
| `/seasonal`(2a) TTFB · 완료 | 1.02~2.22s · 4.1~6.3s | 0.36~0.45s · 1.81~1.83s (첫 회 1.87 · 3.06) |

- **한국 사용자 요청이 태평양을 두 번 건넌다.** 서울 → Cloudflare LA → Vercel SF → (resume이면) 도쿄 함수 → SF → LA → 서울. 완전 정적인 `/`도 1초 넘게 걸리는 이유다.
- Cloudflare는 HTML을 캐시하지 않으므로(`DYNAMIC`) 이 구간은 이득 없이 지연만 더한다. Cloudflare가 왜 이 도메인의 한국 트래픽을 LAX로 보내는지는 확인하지 못했다(요금제·라우팅 정책 추정, 대시보드 확인 필요).
- 11-05 측정(`/` 20ms)과 크게 다르다. 그 사이 Cloudflare 라우팅이 바뀌었거나 측정 조건이 달랐다.

## 2. 캐시 계층

| 리소스 | 브라우저 | Cloudflare | Vercel CDN | 비고 |
|---|---|---|---|---|
| 2a HTML 셸 | `max-age=0, must-revalidate`(매번 요청) | DYNAMIC | HIT(프리렌더) | 빌드 때 (연, 월)마다 생성 |
| 2a 오늘 구멍(resume) | 없음 | 통과 | 매 요청 함수 실행 | RSC 전체를 다시 그림 |
| RSC(클라이언트 이동) | 라우터 캐시 `x-nextjs-stale-time: 300` | 통과 | HIT | `Vary: rsc, next-router-*` |
| `/_next/static/**` | 1년 immutable | HIT | HIT | 파일명에 해시 |
| `/foods/*.svg` | `max-age=14400, must-revalidate` | REVALIDATED | MISS 있음 | 4시간마다 재검증, 티켓 06 |
| 폰트(`/_next/static/media`) | 1년 immutable | HIT | HIT | |

## 3. 서버 렌더 구조

```
app/layout.tsx              폰트 3종(Pretendard 동적 서브셋, Gowun Batang, Bricolage) · Providers · GA
└ app/seasonal/layout.tsx   TodayProvider(getSeoulToday() Promise ← connection(), 요청 때 값)  ← 모든 /seasonal이 동적 구멍을 갖는 원인
  │                         SeasonalShell(헤더 · 하단 내비 · @sheet 슬롯)
  └ (this-month)/layout     SeasonalTabs
    └ at/[yearMonth]/page   generateStaticParams(2026 · 2027 × 12) → ThisMonthView
         히어로 + 1~12월 섹션(판 · 달력 · 더 보기 목록) + YearEnd
         오늘 구멍: 이번 달 달력 2벌(모바일 · 데스크톱) + 일별 카드 = 3개
```

- 렌더 방식: Cache Components + PPR. 빌드 때 셸(마크업 약 795KB)과 postponed 상태를 만든다. 요청 때는 셸을 바로 보내고, 함수가 resume으로 구멍을 채운다.
- **resume은 구멍만이 아니라 RSC 트리 전체를 다시 그려 인라인한다**(`next@16.4.3/dist/server/app-render/app-render.js` 2305~2335). 셸에 이미 RSC가 있어서 2a는 1.32MB × 2가 실린다. `/seasonal` 아래 모든 페이지가 같다(`baseline.md` "RSC 중복 원인").
- 응답 구성(압축 전 3.45MB): 셸 마크업 0.80MB → RSC 1벌 1.32MB → 구멍 HTML 0.02MB → RSC 2벌 1.32MB. brotli 304KB.

## 4. 브라우저 비용 (Lighthouse 모바일, 04 + 08 배포 뒤 2회차)

| 항목 | 값 |
|---|---|
| 전송(종류별) | 폰트 44개 **1,160KB** · 스크립트 46개 817KB · 그림 69개 598KB(나머지는 lazy) · HTML 148KB · CSS 90KB |
| 큰 파일 | Bricolage(큰 숫자 폰트) 208KB · GA `gtag` 192KB · 앱 JS 72KB · 37KB · 35KB |
| DOM | 8,279개, 최대 깊이 17 |
| client 컴포넌트 인스턴스 | `IntentLink` 1,157 · `EatenName` 1,157 (판 360 + 더 보기 목록 등), 나머지는 수십 개 |
| 메인 스레드 5.1s | Other 1.4s · Style & Layout 1.26s · Script Evaluation 1.15s · Rendering 0.66s · Parse 0.45s |
| 문서 자체(파싱 · 스타일 · 레이아웃) | 2.4s (bootup "seasonal") |
| 긴 작업 | 13개. 최대 204ms(앱 JS), GA 122ms · 86ms |
| LCP 요소 | `h2.font-number`(88px 큰 숫자, Bricolage 폰트) 3.3s |

- 그림은 lazy가 잘 작동한다(782개 중 69개만 요청).
- 가장 큰 전송은 폰트다. 한글 서브셋 조각 수십 개와 Bricolage 208KB. LCP 요소가 이 폰트를 기다린다.
- 하이드레이션 대상 링크 · 이름이 2,300여 개다. 판 드래그를 지웠어도 그림 링크 하나하나가 client 컴포넌트(`IntentLink`)다.

## 5. 병목 순위 (측정 근거)

| # | 병목 | 층 | 크기 | 근거 |
|---|---|---|---|---|
| 1 | Cloudflare가 한국 요청을 LAX → Vercel sfo1로 보냄 | 네트워크 | 모든 페이지 TTFB +0.7~1.5s | 1장 비교 |
| 2 | PPR resume이 RSC 전체를 다시 그려 두 번 실음, 매 요청 함수 실행 | 서버 렌더 | 2a HTML +1.32MB, 함수 렌더 시간 | 3장 |
| 3 | 한 화면에 12개월 전체(DOM 8.3천, 링크 1,157, HTML 0.8MB 마크업) | 화면 설계 | Style & Layout 1.3s, Parse 0.45s | 4장 |
| 4 | 폰트 1.16MB, LCP가 Bricolage 대기 | 자원 | LCP 3.3s | 4장 |
| 5 | client 링크 · 이름 2,300여 개 하이드레이션, GA | JS | Script 1.15s, 긴 작업 13개 | 4장 |
| 6 | `/foods` 4시간 재검증 | 캐시 | 재방문 시 그림 요청마다 왕복 | 2장 |

수채 필터(그림 그리기)는 Rendering 0.66s 안에 있고, 위 항목보다 작다.

## 6. 지금까지의 시도와 이 표의 관계

- 04(판 드래그 제거)와 08(`next/image` 제거)은 5번을 줄이려 했다. 하지만 1~3번이 훨씬 커서 효과가 묻혔다. 04는 2번(RSC 두 벌)과 겹쳐 HTML을 키웠다.
- 다음 설계는 위에서부터, 층 단위로 정한다.
