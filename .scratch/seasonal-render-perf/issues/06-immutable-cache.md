# 06. 그림 주소 버전과 immutable 캐시

Status: resolved (2026-11-27 운영 확인: /seasonal 그림 주소에 ?v=, 응답 public, max-age=31536000, immutable)
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

## Comments

- 2026-11-27: 05(SVGO)를 wontfix로 닫았다. `food-versions.generated.ts`를 쓰는 일은 `optimize-food-svgs.mjs` 대신 해시만 만드는 작은 스크립트(또는 `foods:sync`의 마지막 단계)가 맡는다.
- 2026-11-27 진행 기록(커밋 전):
  - 한 일: 해시는 `packages/seasonal/src/data/food-versions.ts`(순수 함수 `foodVersion`: color·motion을 NUL로 이은 글의 SHA-256 앞 8자, Web Crypto라 Node API 없음 / `foodVersionsText`)가 만들고, `scripts/hash-food-svgs.mjs`(`pnpm foods:versions`)가 `public/foods`를 읽어 `food-versions.generated.ts`(297개)를 쓴다. SVG는 고치지 않는다. `foods:sync`는 `food-bounds` 다음에 같은 함수로 임시 폴더 그림의 해시를 만들어 함께 교체한다. 주소는 `packages/seasonal/src/data/food-art.ts`의 `foodArtSrc`(해시 없으면 `?v` 없음)이고 `FoodImage`가 쓴다. `next.config.ts` `headers()`에 `?v` 있는 `/foods/:path*`만 `public, max-age=31536000, immutable`. 테스트를 먼저 썼다(`food-versions.test.ts`, `food-art.test.ts`). 생성 파일 표(`packages/seasonal/AGENTS.md`)와 `docs/project-structure.md` §6·§8·§9에 명령을 적었다.
  - next/image: `FoodImage`는 이미 일반 `<img>`라 해당 없음.
  - `/foods/`를 직접 쓰는 다른 곳: 사이트맵 이미지(`shared/seo/pages.ts`)와 1i JSON-LD(`foodImageSrc`)는 오래 두는 주소라 버전 없이 둔다. 인쇄물(`features/print/parts/food-figure.tsx`)은 개발 서버에서만 PDF로 찍으니 그대로. 이유식(`features/baby-food/data.ts`)은 버전을 붙이면 인쇄 렌더러가 `food-versions.generated`를 읽게 되어 `print-inputs.test.ts`가 PRINT_DATA_MODULES에 넣으라고 실패하고, 넣으면 "그림 획은 보지 않는다"는 인쇄 데이터 해시 결정이 바뀌어 이유식 PDF가 모두 옛것으로 보인다. 그래서 이번에는 버전 없이 두었다(그림 수가 적다). 명절 전통 음식 `/dishes/`도 범위 밖이라 그대로. SVG를 바꾸지 않았으니 PDF·썸네일은 다시 만들 필요 없다.
  - 확인: `pnpm typecheck` 통과, `pnpm lint` 오류 0(ui 경고 4), `pnpm test` 통과(seasonal 413, web 356 등), `pnpm foods:sync --check` 통과. `next build`는 기본 설정에서 `/products/[product]` 프리렌더가 원격 DB "use cache" 시간 초과로 세 번 실패했다(이번 변경과 무관). `experimental.cpus: 2`를 잠깐 넣어 빌드한 뒤 설정을 되돌렸다. 그 빌드로 `next start`해 실측: `/foods/apple/color.svg?v=345307bd` → `Cache-Control: public, max-age=31536000, immutable`, `/foods/apple/color.svg` → `public, max-age=0`(로컬 기본값. 운영의 `max-age=14400, must-revalidate`는 호스팅 쪽 값), `/dishes/…?v=x` → `max-age=0`. `/seasonal` HTML의 `/foods/` img src는 모두 `?v=`가 붙었다.
  - 하지 않은 것: 2a 375·1280 브라우저 확인과 재방문 `(disk cache)` 확인, 배포 후 `jangbol.kr` 헤더와 Cloudflare `cf-cache-status` 확인. 기본 동시성 `next build` 실패(원격 DB 시간 초과)는 따로 볼 일이다.
