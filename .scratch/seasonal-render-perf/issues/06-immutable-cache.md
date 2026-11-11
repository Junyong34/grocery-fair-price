# 06. 그림 주소 버전과 immutable 캐시

Status: ready-for-agent
Type: task (AFK)
Blocked by: 05

## 목적

지금 `/foods/*.svg`는 `max-age=14400, must-revalidate`라 4시간마다 재검증한다. 주소에 내용 해시를 붙이고 1년 `immutable`로 캐시해 재방문 때 그림을 확인 없이 쓴다(spec 2.3, Q9).

## 할 일

- [ ] `optimize-food-svgs.mjs`가 끝에 `packages/seasonal/src/data/food-versions.generated.ts`(`FOOD_VERSIONS`, 품종 id → color · motion 내용 해시 앞 8자)를 쓴다. AGENTS.md 생성 파일 표에 추가
- [ ] `FoodImage`(`features/seasonal/components/food-image.tsx` 43행): `src`에 `?v=${FOOD_VERSIONS[food.id]}`를 붙인다. 해시가 없으면 붙이지 않는다
- [ ] `apps/web/next.config.ts`에 `headers()`: `source: "/foods/:path*"`, `has: [{ type: "query", key: "v" }]`, `Cache-Control: public, max-age=31536000, immutable`. 문서: `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/headers.md`
- [ ] `next/image`가 SVG 주소의 쿼리를 그대로 두는지 확인한다(안 되면 `unoptimized`를 명시)
- [ ] 다른 화면에서 `/foods/` 경로를 직접 쓰는 곳이 없는지 확인(현재 `FoodImage` 하나)
- [ ] 배포 후 `curl -sI 'https://jangbol.kr/foods/apple/color.svg?v=…'`로 헤더를 확인하고, Cloudflare가 헤더를 존중하는지(`cf-cache-status: HIT`) 본다

## 완료 기준

- `?v=`가 붙은 요청만 1년 immutable이고, 버전 없는 요청은 지금 헤더 그대로다
- 재방문 때 그림 요청이 네트워크 탭에서 `(disk cache)` 또는 `(memory cache)`로 나온다
- `pnpm typecheck`, `pnpm lint`, `pnpm test` 통과. 2a를 375 · 1280에서 확인, 콘솔 오류 없음
