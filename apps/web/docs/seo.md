# 검색 색인(SEO)

`apps/web`을 구글과 네이버에 색인시키는 장치다. 결정과 근거는 `.scratch/seo/spec.md`에 있다. 이 문서는 새 페이지를 연결하는 방법과 운영 전환 절차를 적는다.

## 구성

| 파일 | 역할 |
|---|---|
| `shared/seo/pages.ts` | 색인 정책의 단일 출처. 모든 페이지를 `SEO_PAGES`(색인·sitemap), `NOINDEX_ROUTES`, `REDIRECT_ROUTES` 가운데 하나에 등록한다 |
| `shared/seo/pages.test.ts` | 가드 테스트. `app/**/page.tsx`가 위 셋 가운데 어디에도 없으면 `pnpm test`가 실패한다 |
| `shared/seo/route-pattern.ts` | page 파일 경로 → 라우트 패턴. 라우트 그룹 `(x)`는 지우고, `@slot`·가로채기 라우트는 뺀다 |
| `app/(price)/page.tsx` | 홈(`routes.home`, P1 시세 메인)의 `WebSite`·`Organization` JSON-LD. 홈이 바뀌면 새 홈 페이지로 옮긴다 |
| `shared/seo/indexing.ts` | 색인 스위치 `isIndexable()`, 소유 확인 메타 `searchVerification()` |
| `shared/seo/json-ld.tsx` | `<JsonLd>`, `website()`, `organization()`, `breadcrumb()` |
| `shared/seo/titles.ts` | 페이지 종류별 `<title>`·description 패턴(`homeSeo()`, `monthSeo()`, `foodSeo()` …). 페이지는 `createMetadata({ ...xxxSeo(), path, ogImage })`로 쓴다 |
| `shared/meta.ts` | `createMetadata()`: title·description·canonical·OG·robots. `absoluteUrl()` |
| `app/sitemap.ts` | `SEO_PAGES`를 절대 주소로 펼친다. `priority`·`changefreq`는 넣지 않는다 |
| `app/robots.ts` | 스위치가 꺼져 있으면 `Disallow: /`, 켜져 있으면 `Allow: /`와 sitemap 주소 |

## 새 페이지 연결 체크리스트

1. `shared/routes.ts`에 경로를 더한다.
2. `shared/seo/pages.ts`에 등록한다.
   - 검색에 나와야 하면 `SEO_PAGES`에 라우트 패턴을 키로 넣는다. 값은 sitemap 줄을 돌려주는 함수다. 동적 세그먼트는 `generateStaticParams`와 같은 목록을 펼친다.
   - 기기 저장 데이터처럼 크롤러에게 빈 화면이면 `NOINDEX_ROUTES`에 넣고, 페이지에서 `createMetadata({ noIndex: true })`를 쓴다. robots.txt의 `Disallow`로 막지 않는다. 막으면 크롤러가 noindex를 읽지 못한다.
   - 다른 곳으로 보내기만 하면 `REDIRECT_ROUTES`에 넣는다.
3. `shared/seo/titles.ts`에 그 페이지의 제목·설명 함수를 더하고(테스트 `titles.test.ts`의 목록에도 넣는다), 페이지에서 `createMetadata({ ...xxxSeo(), path, ogImage })`를 돌려준다.
   - `title`은 사람들이 실제로 검색하는 말로 쓴다("대게 제철 시기", "3월 제철 음식"). 화면의 `h1`과 달라도 된다.
   - `description`은 페이지마다 다르게 쓴다.
4. 상세 페이지면 `<JsonLd data={breadcrumb([...])} />`를 넣는다. 홈(`routes.home`)은 `breadcrumb()`이 앞에 붙이므로 그 아래 단계만 넘긴다. 이름은 `titles.ts`의 제목을 쓴다. 크롤러가 HTML 원문에서 읽도록 정적으로 그려지는 자리(프리렌더되는 Suspense 안 포함)에 둔다.
5. 페이지에 `h1`이 정확히 하나 있는지 확인한다.
6. `pnpm test`로 가드 테스트를 통과시킨다.

## 환경 변수

정적으로 만든 페이지·sitemap·robots는 빌드 때 값을 굳히고, 요청 시점에 그리는 응답(404 등)은 실행 때 값을 읽는다. 그래서 **빌드와 실행 환경에 같은 값**을 넣는다. 바꾸면 다시 빌드한다. `turbo.json`의 `build.env`에 선언되어 있다. `NEXT_PUBLIC_*`는 Turborepo가 Next 패키지에서 자동으로 넘긴다.

| 변수 | 넣는 곳 | 내용 |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | 운영 | 공개 주소(예: `https://example.com`). canonical, sitemap, JSON-LD 주소의 기준 |
| `SITE_INDEXABLE` | 운영만 | `true`일 때만 색인을 허용한다. 없으면 robots가 전체를 막고 모든 페이지에 `noindex`가 붙는다. 프리뷰·스테이징에는 넣지 않는다 |
| `GOOGLE_SITE_VERIFICATION` | 운영 | Search Console URL 접두어 속성의 HTML 태그 값. DNS로 확인하면 필요 없다 |
| `NAVER_SITE_VERIFICATION` | 운영 | 서치어드바이저 HTML 태그 값(`naver-site-verification`) |

`/sitemap.xml`은 스위치와 상관없이 열려 있다. 로컬에서 목록을 확인하는 데 쓴다.

## 운영 전환 절차 (도메인이 정해진 뒤)

1. 운영 환경에 `NEXT_PUBLIC_SITE_URL`과 `SITE_INDEXABLE=true`를 넣고 다시 빌드한다.
2. 구글 Search Console에 도메인 속성을 추가하고 DNS TXT 레코드로 확인한다. URL 접두어 속성을 쓰면 받은 값을 `GOOGLE_SITE_VERIFICATION`에 넣고 다시 빌드한다.
3. 네이버 서치어드바이저에 사이트를 등록하고, HTML 태그 값을 `NAVER_SITE_VERIFICATION`에 넣은 뒤 다시 빌드하고 확인을 누른다.
4. 두 곳에 `https://<도메인>/sitemap.xml`을 제출한다. 네이버는 robots.txt도 "수집 요청" 화면에서 검사한다.
5. Search Console URL 검사로 홈과 품종 페이지 하나씩 렌더 결과, canonical, noindex 여부를 확인한다. 구조화 데이터는 Rich Results Test로 확인한다.

## 나중에 할 것

- GA4 등 분석 도구. 동의 배너와 스크립트 성능을 함께 정한다.
- IndexNow(네이버·Bing 지원). 페이지 수가 늘어 sitemap만으로 반영이 늦을 때.
- 다음 웹마스터도구. robots.txt에 `#DaumWebMasterTool:<PIN>` 주석 줄이 필요해 `app/robots.ts`를 Route Handler(`app/robots.txt/route.ts`)로 바꿔야 한다.
- `manifest`.
- 2a(`/seasonal`) 본문이 `connection()` 뒤에서 스트리밍되는 문제. 색인에는 문제없지만 LCP에 불리하다.
- 품종 페이지 본문 보강(`.scratch/seo/issues/08`).
- 없는 상세 주소(`/seasonal/foods/nope`, `/seasonal/months/13` 등)가 404가 아니라 **200 + `noindex`**로 응답한다(soft 404). 제철 레이아웃의 정적 셸이 먼저 나가 상태 코드가 200으로 정해진 뒤 `notFound()`가 불리기 때문이다(Next `02-guides/streaming.md` "Status codes"). params 검사를 페이지의 Suspense 밖으로 옮겨도 그대로임을 2026-10-16에 확인했다. `noindex`가 붙어 색인되지는 않는다. Search Console에 soft 404가 많이 잡히면 `proxy.ts`에서 렌더 전에 목록 밖 값을 404로 막는다. 경로 자체가 없는 주소(`/seasonal/nope`)는 이미 404다.
