# 01. 공통 기반: 레지스트리·sitemap·robots·색인 스위치·소유 확인·가드 테스트

Status: resolved
Blocked by: —

## 목적

SEO 설정을 `apps/web/shared/seo/` 한 곳에 모은다. 지금 있는 페이지는 모두 레지스트리에 등록하거나 noindex로 분류한다. 결정과 근거는 `../spec.md`에 있다.

## 먼저 읽을 것

- Next 16.4 내장 문서(`apps/web/node_modules/next/dist/docs/01-app/`)
  - `03-api-reference/03-file-conventions/01-metadata/sitemap.md`
  - `robots.md`
  - `02-guides/json-ld.md`
  - `03-api-reference/04-functions/generate-metadata.md`(`verification`, `robots`)
- Turborepo 내장 문서의 환경 변수 항목. 엄격 모드에서 `turbo.json`에 선언하지 않은 환경 변수가 빌드 작업에 전달되는지, 캐시 키에 들어가는지 확인한다.

## 할 일

### 레지스트리와 메타데이터

- [x] `apps/web/shared/seo/indexing.ts`: `isIndexable()`를 만든다. `process.env.SITE_INDEXABLE === "true"`일 때만 참이다.
- [x] `apps/web/shared/meta.ts`의 `createMetadata()`를 고친다. `isIndexable()`가 거짓이면 `noIndex` 옵션과 상관없이 `robots: { index: false, follow: false }`를 낸다.
- [x] `apps/web/shared/seo/pages.ts`에 레지스트리를 만든다.
  - **`SEO_PAGES`**: 키는 Next 라우트 패턴이다. 값은 `() => { path, images?, lastModified? }[]`이다. 경로는 `routes`로 만든다.
    - `/seasonal`
    - `/seasonal/months`, `/seasonal/months/[month]` (1~12)
    - `/seasonal/seasons`, `/seasonal/seasons/[season]`
    - `/seasonal/festivals/[festival]` (`FESTIVALS`)
    - `/seasonal/foods/[food]` (`FOODS`). 이 단계에서는 `images` 없이 등록한다(06에서 붙인다).
  - **`NOINDEX_ROUTES`**: `/seasonal/my-table`과 `/examples/*`. 패턴은 접두 경로로 맞춘다.
  - **`REDIRECT_ROUTES`**: `/`
- [x] `apps/web/app/sitemap.ts`: `SEO_PAGES`를 펼치고 `siteUrl()`로 절대 주소를 만든다.
  - `priority`와 `changefreq`는 넣지 않는다.
  - `lastModified`는 값이 있을 때만 넣는다.
  - `new Date()`를 쓰지 않는다.
- [x] `apps/web/app/robots.ts`
  - 색인을 켰을 때: `allow: "/"`, `sitemap: <siteUrl>/sitemap.xml`
  - 색인을 껐을 때: `disallow: "/"`, sitemap 줄 없음

### JSON-LD

- [x] `apps/web`에 `schema-dts`를 dev 의존성으로 추가한다.
- [x] `apps/web/shared/seo/json-ld.tsx`에 아래를 만든다. 이 이슈에서는 만들기만 하고 붙이는 건 02~06에서 한다.
  - `<JsonLd data>`: `<`를 `<`로 이스케이프한다.
  - `website()`, `organization()`, `breadcrumb(items: { name, path }[])`. 절대 주소는 `siteUrl()`로 만든다.
  - `organization()`의 로고는 `/images/brand/logo-symbol-512.png`이다. 구글 로고 조건은 최소 112px, 래스터 권장이다.

### 소유 확인과 환경 변수

- [x] 루트 레이아웃 `metadata.verification`
  - `google`: `GOOGLE_SITE_VERIFICATION`
  - `other`: `{ "naver-site-verification": NAVER_SITE_VERIFICATION }`
  - 값이 없으면 키를 넣지 않는다.
- [x] `turbo.json`의 `build` 작업에 `SITE_INDEXABLE`, `GOOGLE_SITE_VERIFICATION`, `NAVER_SITE_VERIFICATION`, `NEXT_PUBLIC_SITE_URL`을 선언한다. 이 작업이 필요한지는 위 Turborepo 문서로 먼저 확인한다.

### `/examples` 임시 noindex

- [x] `apps/web/app/examples/layout.tsx`를 만든다. `metadata = { robots: { index: false, follow: false } }`. 사용자가 `/examples`를 지울 때 함께 지운다.

### 가드 테스트

- [x] `apps/web`에 vitest를 넣는다: `test` 스크립트 `vitest run`. 루트 `pnpm test`(turbo)가 실행하는지 확인한다.
- [x] `apps/web/shared/seo/route-pattern.ts`
  - 할 일: `app/` 기준 page 파일 경로를 라우트 패턴으로 바꾸는 순수 함수다.
  - 규칙: `(group)` 세그먼트는 지우고, `@slot` 아래 경로는 `null`을 돌려준다.
  - 순서: 테스트(`route-pattern.test.ts`)를 먼저 쓴다.
- [x] `apps/web/shared/seo/pages.test.ts`
  - `app/**/page.tsx`를 전부 모은다.
  - 각 패턴이 `SEO_PAGES`, `NOINDEX_ROUTES`, `REDIRECT_ROUTES` 중 하나에 들어 있어야 한다.
  - 레지스트리에 있지만 page 파일이 없는 패턴도 실패로 처리한다.
  - 실패 메시지에는 `apps/web/docs/seo.md`를 보라고 적는다.

### 문서

- [x] `apps/web/docs/seo.md`
  - 새 페이지 연결 체크리스트(spec "한곳에서 관리하는 구조" 마지막 항목)
  - 환경 변수 표
  - 운영 전환 절차(spec)
  - 나중에 할 것: GA4, IndexNow, 다음 웹마스터도구(robots 주석 줄 때문에 `robots.ts`를 Route Handler로 바꿔야 함), manifest, 2a LCP
- [x] `AGENTS.md`의 "Routes" 아래에 한 줄을 추가한다: 페이지를 새로 만들면 `apps/web/docs/seo.md`의 체크리스트를 따른다.
- [x] `docs/project-structure.md`를 갱신한다.
  - 4장 메타데이터 항목에 `shared/seo/`, `sitemap.ts`, `robots.ts`를 적는다.
  - 12장 문서 지도에 `seo.md`를 넣는다.

## 완료 조건

- `pnpm typecheck`, `pnpm lint`, `pnpm test`가 통과한다.
- 로컬(`SITE_INDEXABLE` 없음)에서 확인할 것:
  - `/robots.txt`가 `Disallow: /`이다.
  - `/sitemap.xml`에 색인 대상 경로가 모두 있다: 2a 1 + 2b 13 + 3a 5 + 1g 명절 수 + 1i 79.
  - `/seasonal` HTML `<head>`에 `noindex`가 있다.
- `SITE_INDEXABLE=true`로 빌드하면 확인할 것:
  - robots가 허용으로 바뀌고 sitemap 줄이 생긴다.
  - `/seasonal`에는 noindex가 없다.
  - `/seasonal/my-table`과 `/examples/*`에는 noindex가 있다.
- `GOOGLE_SITE_VERIFICATION=x`를 넣으면 `<meta name="google-site-verification" content="x">`가 나온다.
- 가드 테스트 확인: `app/seasonal/tmp/page.tsx` 같은 임시 파일을 만들면 `pnpm test`가 실패한다. 확인한 뒤 파일은 지운다.

## Answer

2026-10-16 구현.

- 레지스트리 키는 Next가 생성하는 `AppRoutes` 타입으로 제한하려 했다. 그런데 이 타입은 `.next/types`가 있을 때만 존재해서, 새 클론의 typecheck가 깨진다. 그래서 `Record<string, …>`으로 두고 키 오타는 가드 테스트가 잡게 했다.
- `NEXT_PUBLIC_SITE_URL`은 Turborepo의 Next 프레임워크 추론(`NEXT_PUBLIC_*`)이 자동으로 넘긴다. `turbo.json` `build.env`에는 나머지 세 변수만 선언했다.
- `apps/web`에 vitest를 처음 넣었다(`vitest.config.ts`). tsconfig가 `jsx: "preserve"`라 `.tsx` 모듈을 불러오려면 테스트에서만 JSX를 변환해야 한다.
- 확인한 것(`next build` + `next start`):
  - 스위치를 끈 상태: robots가 `Disallow: /`이고 sitemap에 `<loc>` 104개가 있다. `/seasonal`과 `/examples/*`에 `noindex, nofollow`가 붙는다.
  - `SITE_INDEXABLE=true`: robots가 `Allow: /`이고 `Sitemap: https://example.com/sitemap.xml` 줄이 생긴다. `/seasonal`에는 robots 메타가 없고, canonical은 절대 주소다. `/examples`에는 noindex가 남는다. 소유 확인 메타 두 개가 나온다.
  - `/seasonal/my-table`은 아직 noindex가 아니다. 07에서 붙인다.
- 가드 테스트 확인: `app/seasonal/tmp/page.tsx`를 만들면 `/seasonal/tmp`를 지목하며 실패한다.
