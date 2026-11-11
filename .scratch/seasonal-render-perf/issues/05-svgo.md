# 05. 그림 SVG SVGO 적용과 인쇄물 재생성

Status: ready-for-agent
Type: task (HITL)
Blocked by: 01

## 목적

그림 SVG 594개(color · motion)의 바이트와 파싱 비용을 줄인다. 그림 모양은 바뀌지 않아야 한다(spec 2.3, Q4).

## 할 일

- [ ] `svgo`를 루트 devDependency로 더한다
- [ ] 새 `scripts/optimize-food-svgs.mjs`: `apps/web/public/foods/*/{color,motion}.svg`를 제자리에서 줄인다. `prototypes/` 없이 돈다. 지킬 것: `<filter>`와 그 안의 요소, `<style>`(motion 키프레임), `data-*` 속성, `role` · `aria-label` · `<title>` · `<desc>`. 경로 정밀도는 그림을 비교해 정한다(시작값 `floatPrecision: 1`)
- [ ] 루트 `package.json`: `foods:optimize` 추가, `foods:sync`를 `sync → optimize → bounds` 순서로 잇는다. AGENTS.md 생성 파일 표와 `docs/project-structure.md`에 반영
- [ ] 비교: 줄이기 전후를 `sharp`로 래스터해 품종마다 픽셀 차이를 잰다. 차이가 큰 상위 10종과 팽이버섯 · 삼채 · 매생이는 사람이 눈으로 확인(HITL)
- [ ] `pnpm foods:bounds`를 다시 돌려 `food-bounds.generated.ts` 변화가 없거나 미미한지 본다
- [ ] 인쇄물: `/admin`의 "PDF 생성"으로 공개 에디션의 PDF · 썸네일 · `manifest.json`을 다시 만들고 썸네일을 전후 비교한다
- [ ] `baseline.md`에 전후 합계(원본 · brotli)와 배포 후 지표를 덧붙인다

## 완료 기준

- 줄인 SVG가 원본과 눈으로 구별되지 않는다(사용자 확인). motion 애니메이션이 그대로 움직인다
- `pnpm typecheck`, `pnpm lint`, `pnpm test` 통과. 2a · 1i 시트를 375 · 1280에서 확인, 콘솔 오류 없음
- 생성 파일(SVG, `food-bounds.generated.ts`, 인쇄 manifest · 썸네일)을 함께 커밋한다
