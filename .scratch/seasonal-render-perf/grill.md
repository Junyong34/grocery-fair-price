# 제철달력 렌더링 속도 개선 — 질문 기록

`/grill-plan` 질문 라운드 기록. 시작 2026-11-11.

## 조사한 사실 (2026-11-11)

- 2a(`/seasonal`)는 이미 정적이다. `proxy.ts`가 `/seasonal/at/[yearMonth]`로 rewrite하고, 그 페이지는 `generateStaticParams`로 빌드 때 그린다. 오늘 표시만 `<Suspense>` 구멍(PPR). `.scratch/seasonal-static/spec.md` (완료, 커밋 66784fe).
- 2b·식재료 월별·명절·제철 회도 `generateStaticParams` 정적.
- 2a 운영 HTML: 압축 전 2.35MB (11-05엔 1.58MB), brotli 202KB, `<img>` 782개. 이 컴퓨터에서 TTFB 약 0.55s, 완료 약 2.1s(3회).
- 12개월 섹션 모두 `[content-visibility:auto]` 적용. 그림은 `next/image`(기본 `loading="lazy"`)로 `/foods/<id>/color.svg`를 띄운다. SVG는 next/image가 최적화하지 않고 원본 그대로 보낸다.
- 판(`DraggableScatter`)은 `"use client"`. 12개월 × 최대 30개(`SCATTER_MAX_FOODS`)가 모두 하이드레이션된다.
- SVG 297종. color 합계 13MB(원본) / 2.0MB(brotli). 평균 44KB, 최대 405KB(팽이버섯, path 1,029개, clipPath 132개).
- **296개 SVG 모두 수채 필터(`feTurbulence` + `feDisplacementMap`)를 쓴다.** 브라우저가 래스터할 때 CPU 비용이 크다(특히 모바일).
- 운영 `/foods/*.svg`: Cloudflare 앞단, `cache-control: public, max-age=14400, must-revalidate`, brotli 전송. 4시간마다 재검증.
- `sharp`는 이미 의존성에 있다(`scripts/measure-food-bounds.mjs`).

## 라운드 1 (2026-11-11)

| Q | 질문 | 추천 | 사용자 답 (원문) | 바뀐 것 |
|---|---|---|---|---|
| Q1 | 성공 기준 | A. 375 모바일 Lighthouse(LCP·TBT) + 스크롤 프레임 드랍, 운영 기준선 대비 | `Q1.  A` | 첫 티켓은 기준선 측정 |
| Q2 | 범위 | A. 2a 중심, 이미지 변경은 `FoodImage`로 전체 적용 | `Q2. A` | |
| Q3 | 렌더링 방식 | A. 유지(정적 + proxy rewrite + 오늘 구멍) | `Q3. A` | SSR·ISR 전환 없음 |
| Q4 | 이미지 포맷 | B. 작은 자리 래스터, 큰 자리 SVG | `Q4 A` | SVG 유지 + SVGO. 필터 비용은 남음 → Q8 |
| Q5 | 화면 밖 달 판 | B. 드래그만 화면 근처에서 켜기 | `Q5 드래그는 그냥 제거 할까? 크게 사용자가 조작하지 않을거로 판단돼` | 판 드래그 제거 방향 → Q7에서 범위 확정 |
| Q6 | 그 밖의 개선 | 1·2·3·4 모두 | `Q6. 어떤걸 선택해야할지 모르게어` | 라운드 2에서 항목별로 다시 묻기 (Q9) |

추가 사실: 판 드래그는 `features/seasonal/components/draggable-scatter.tsx`(406줄) + `use-drag-gesture.ts`(81줄), 배치 저장은 `stores/scatter-store.ts`(`seasonal:scatter`, 그림 배치 + 데스크톱 달력 자리). 드래그 analytics 이벤트는 없다(사용량 데이터 없음). 판의 그림은 `IntentLink`로 1i 시트를 연다.

## 라운드 2 (2026-11-11)

| Q | 질문 | 추천 | 사용자 답 (원문) | 바뀐 것 |
|---|---|---|---|---|
| Q7 | 드래그 제거 범위 | A. 전부 제거(그림·달력 드래그, "처음 자리로" 버튼, 히어로 안내 문구). 탭 → 1i 시트와 먹음 표시는 남김 | `Q7.  드래이그 기능 자체를 제거하여  사용자에게 그림을 끓이는 기능을 제공안하면 어때 ?` | A로 확정. 판은 서버에서 그리는 정적 배치 |
| Q8 | 필터 비용 조건부 | A. 측정에서 병목이면 그때 정함(필터 뺀 작은 SVG 변형 또는 래스터) | `Q8. 추천안` | 조건부 티켓 하나 |
| Q9 | 그 밖의 개선 | 1 캐시 헤더 · 3 HTML 증가 원인 · 4 TTFB 넣고, 2 거대 SVG 단순화 뺌 | `Q9. 예` | 티켓 3개 추가 |

frontier 빔. 가정: 기기에 저장된 `seasonal:scatter`는 더 읽지 않고 지우지도 않는다(키 이름 규칙상 다른 용도로 재사용하지 않음).

## HTML 계획 응답 (2026-11-11)

계획: `plan.html` (게시본 https://claude.ai/artifact/6dYGZCN9FzSm7CA3zAMvcb). 코드를 읽다 새로 나온 결정 2개.

| 결정 | 추천 | 사용자 답 | 바뀐 것 |
|---|---|---|---|
| 판의 점선 테두리 · 점무늬 | 점선 테두리만 지우고 점무늬는 둔다 | 열어 봄 · 제안대로 유지 → `dots` | |
| `seasonal:scatter` 저장 배치 | 읽지 않고 그대로 둔다 | 열어 봄 · 제안대로 유지 → `ignore` | |

댓글 (주장 4의 "조건부" 메모): `무슨질문인지 이해못했어` → 질문이 아니라 Q8 답(측정 뒤 정함)을 적은 메모였다. 계획 변경 없음. 스펙에서 쉬운 말로 다시 쓴다.
