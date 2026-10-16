# 검색 색인(SEO) 기반

`apps/web`이 구글·네이버에 색인되고 검색어에 맞게 노출되도록 하는 작업이다. SEO 설정 코드는 `apps/web/shared/seo/` 한곳에서 관리한다. 이 폴더에 지금 있는 제철 화면을 연결하고, 나중에 가격 비교 같은 새 화면이 생기면 같은 기반에 붙인다.

결정은 2026-10-16 grilling 세션에서 사용자와 정했다. 근거로 삼은 자료는 아래와 같다(2026-10 확인).
- Next.js 16.4 내장 문서(`apps/web/node_modules/next/dist/docs/`)
- Google Search Central
- 네이버 서치어드바이저 관련 제3자 가이드. 네이버 공식 페이지는 열지 못했다.

로드맵 P9("SEO · 분석 설계")에서 메타, 구조화 데이터, 검색 등록 부분을 앞당겨 하는 작업이다. GA4는 넣지 않는다.

## 이슈 목록

| # | 제목 | 상태 | 선행 |
|---|---|---|---|
| 01 | 공통 기반: 레지스트리·sitemap·robots·색인 스위치·소유 확인·가드 테스트 | ready-for-agent | — |
| 02 | 홈(2a): `WebSite`·`Organization`, 제목 | ready-for-agent | 01 |
| 03 | 2b 월별: 제목·빵부스러기 | ready-for-agent | 01 |
| 04 | 3a 계절: 제목·빵부스러기 | ready-for-agent | 01 |
| 05 | 1g 명절: 제목·빵부스러기 | ready-for-agent | 01 |
| 06 | 1i 품종: 제목·설명·빵부스러기·sitemap 이미지 | ready-for-agent | 01 |
| 07 | 1h 나의 식탁: noindex·`h1` | ready-for-agent | 01 |
| 08 | 품종 페이지 본문 보강 | needs-triage | — |

02~07은 01만 끝나면 순서와 상관없다.

## 범위

넣는 것은 다음과 같다.
- sitemap, robots
- 색인 스위치(환경 변수)
- 검색엔진 소유 확인 칸(환경 변수)
- 페이지별 title·description 패턴
- 구조화 데이터(JSON-LD)
- noindex 정리, 시맨틱 HTML 보완
- 빠뜨린 페이지를 잡는 가드 테스트
- 새 페이지 연결 문서

빼는 것은 다음과 같다. 01에서 `seo.md`의 "나중에" 목록에 적는다.
- GA4 등 분석 도구
- IndexNow
- 다음 웹마스터도구
- `manifest`
- 2a 본문 스트리밍의 LCP 개선
- 품종 본문 보강. 08로 따로 둔다.

## 결정

### 대상 검색엔진

- **구글과 네이버**에 맞춘다. 네이버도 sitemap, robots, `og:*` 태그를 읽으므로 구글용으로 만든 것을 그대로 쓴다.
- Bing은 sitemap만 맞으면 따라오므로 따로 맞추지 않는다.
- 다음은 robots.txt에 `#DaumWebMasterTool:<PIN>` 주석을 넣어야 인증된다. `robots.ts`로는 이 줄을 넣을 수 없어 이번에는 하지 않는다.

### 배포처·도메인이 정해지지 않은 상태

배포처도 도메인도 아직 정하지 않았다. 그래서 특정 호스팅(Vercel 등)의 변수에 기대지 않고, 환경 변수만으로 켜고 끈다.

- **색인 스위치 `SITE_INDEXABLE`**
  - 값이 `"true"`일 때만 색인을 허용한다. 기본값은 닫힘이다.
  - 닫혀 있으면 robots.txt는 `Disallow: /`를 내보내고, sitemap 줄을 넣지 않는다. 모든 페이지에는 `noindex, nofollow` 메타가 붙는다.
  - `/sitemap.xml`은 스위치와 상관없이 열려 있다. 로컬에서 구조를 확인하는 데 쓴다.
  - 운영 환경에만 이 값을 넣는다. 프리뷰와 스테이징에는 넣지 않는다.
  - 빌드 때 읽는 값이라, 바꾸면 다시 빌드해야 한다.
- **공개 주소는 기존 `siteUrl()`을 그대로 쓴다.** `NEXT_PUBLIC_SITE_URL`을 먼저 보고, 없으면 Vercel 운영 도메인, 그것도 없으면 localhost를 쓴다. 운영에서 색인을 켤 때는 `NEXT_PUBLIC_SITE_URL`도 함께 넣는다.
- **소유 확인**
  - 루트 레이아웃의 `metadata.verification`이 `GOOGLE_SITE_VERIFICATION`, `NAVER_SITE_VERIFICATION`(`naver-site-verification` 메타)을 읽는다.
  - 값이 없으면 태그를 출력하지 않는다.
  - 모든 페이지 `<head>`에 들어가므로 `/`가 307로 넘어가도 문제없다.
  - 도메인이 정해지면 구글은 DNS(도메인 속성) 확인을 권한다.
- **도메인을 정하기 전에는 색인을 열지 않는다.** `*.vercel.app` 같은 임시 주소로 먼저 색인되면, 도메인을 옮길 때 신호가 둘로 갈린다.

### 페이지별 색인 정책

| 페이지 | 색인 | sitemap | 구조화 데이터 |
|---|---|---|---|
| 2a `/seasonal` (홈, `routes.home`) | O | O | `WebSite` + `Organization` |
| 2b `/seasonal/months` | O | O | — |
| 2b `/seasonal/months/[month]` 12개 | O | O | `BreadcrumbList` |
| 3a `/seasonal/seasons` | O | O | — |
| 3a `/seasonal/seasons/[season]` 4개 | O | O | `BreadcrumbList` |
| 1g `/seasonal/festivals/[festival]` | O | O | `BreadcrumbList` |
| 1i `/seasonal/foods/[food]` 79개 | O | O (그림 있는 품종은 `images`) | `BreadcrumbList` |
| 1h `/seasonal/my-table` | noindex | X | — |
| `/examples/*` | noindex (삭제 예정) | X | — |
| `/` (307 → `routes.home`), `/seasonal/festivals` (proxy 리디렉션), `/api/og` | 해당 없음 | X | — |

- **1h는 noindex로 둔다.** 기기에 저장된 기록으로 채워지는 화면이라 크롤러에게는 빈 상태만 보인다.
- **`/examples`는 robots `Disallow`로 막지 않고 noindex로만 막는다.** Disallow로 막으면 크롤러가 noindex를 읽지 못해 색인에 남을 수 있다. 사용자가 삭제할 예정이다. 그 전까지는 `app/examples/layout.tsx`의 noindex로 버틴다.
- **`/`는 307을 유지한다.** 가격 비교 메인이 올 자리라 301로 바꾸지 않는다.
- **`WebSite`·`Organization`은 `routes.home`이 가리키는 페이지가 출력한다.** 구글은 사이트 이름 마크업을 홈에서만 읽는다. 홈이 `/`로 바뀌면 마크업도 따라 옮겨 간다.

### 한곳에서 관리하는 구조 (`apps/web/shared/seo/`)

- **페이지 레지스트리**
  - 색인 대상 페이지 종류마다 항목 하나를 둔다. 항목의 키는 Next 라우트 패턴(예: `/seasonal/foods/[food]`)이다.
  - 각 항목에는 sitemap 경로 목록을 만드는 함수가 있다. 경로는 `routes`로 만든다. 선택 필드로 `images`와 `lastModified`가 있다.
  - noindex 페이지 목록도 같은 파일에 둔다.
- **`app/sitemap.ts`**: 레지스트리를 펼쳐 절대 주소로 바꾸기만 한다. `priority`와 `changefreq`는 넣지 않는다. 구글이 무시한다.
- **`lastModified`는 처음에 비워 둔다.** 구글은 정확한 값만 믿는다. 빌드 시각(`new Date()`)을 넣으면 신뢰가 떨어지고, Cache Components와도 부딪힌다. 데이터가 실제로 바뀐 날짜를 알 수 있을 때만 상수로 넣는다.
- **`app/robots.ts`**: 색인 스위치를 따른다.
- **title·description 패턴**: 한 파일에 함수로 둔다(아래 표). 페이지는 그 함수의 결과를 `createMetadata()`에 넘긴다.
  - 바뀌는 것은 `<title>`과 description뿐이다.
  - 화면의 `h1`과 OG 이미지 글자는 그대로 둔다.
  - `og:title`과 `twitter:title`은 `createMetadata()`가 `<title>`과 같은 값으로 만든다. 지금 동작이 그렇다.
- **JSON-LD**
  - `<JsonLd>` 컴포넌트 하나와 빌더 함수를 둔다: `website()`, `organization()`, `breadcrumb(items)`.
  - 타입은 `schema-dts`로 잡는다.
  - Next 문서 방식대로 page 안에 `<script type="application/ld+json">`을 넣고, `<`를 `<`로 이스케이프한다.
  - 빵부스러기는 화면에 표시하지 않고 JSON-LD로만 넣는다.
- **가드 테스트(vitest)**
  - `apps/web/app/**/page.tsx`를 훑어 라우트 패턴으로 바꾼다. 라우트 그룹 `(x)`는 지운다. `@slot` 아래(인터셉트 시트 등)는 대상에서 뺀다.
  - 각 패턴이 "레지스트리에 있다", "noindex 목록에 있다", "리디렉션 목록(`/`)에 있다" 중 하나에 해당하는지 검사한다.
  - 새 페이지를 등록하지 않으면 `pnpm test`가 실패한다.
- **새 페이지를 연결하는 절차**는 `apps/web/docs/seo.md`에 체크리스트로 둔다. 순서는 다음과 같다.
  1. `routes`에 경로를 추가한다.
  2. 레지스트리에 항목을 추가하거나 noindex로 등록한다.
  3. 제목 패턴 함수를 추가한다.
  4. `createMetadata()`를 부른다.
  5. 필요하면 `<JsonLd>`를 넣는다.

  `AGENTS.md`에는 이 문서를 가리키는 한 줄만 둔다.

### 검색어에 맞춘 제목

실제 검색어는 "대게 제철", "3월 제철 음식" 같은 형태로 들어온다. 루트 레이아웃 template이 제목 끝에 ` | 장볼날`을 붙인다.

| 페이지 | 지금 `<title>` 앞부분 | 바꿀 앞부분 |
|---|---|---|
| 홈 2a | 이달의 제철 | 제철 음식 달력 |
| 2b 목록 | 월별 보기 | 월별 제철 음식 |
| 2b 월 | 3월의 제철 | 3월 제철 음식 |
| 3a 목록 | 사계절 제철 | 계절별 제철 음식 |
| 3a 계절 | 봄의 제철 | 봄 제철 음식 |
| 1g 명절 | 추석 제철 음식 | 추석 음식 |
| 1i 품종 | 대게 | 대게 제철 시기 |

- description은 페이지마다 다르게 쓴다.
- 1i의 description에는 제철 달을 넣는다. 별칭(`aliases`)이 있으면 함께 넣는다(광어 → 넙치).

### 시맨틱 HTML

- 감사 결과, 셸에 `header`, `main`, `nav`가 있다.
- 내부 이동은 모두 `next/link`이고, 그림에는 `alt`나 `aria-label`이 있다.
- `h1`은 1h를 빼고 모든 페이지에 하나씩 있다.
- 이번 작업에서 고치는 것은 1h에 `h1`을 넣는 것 하나다(07).
- 2a는 본문 전체를 `connection()` 뒤에서 스트리밍한다. 크롤러가 읽는 데는 문제가 없지만 LCP에는 불리하다. 이번 범위에서는 뺀다.

### 구조화 데이터에서 뺀 것과 이유

- **FAQ**: 2026-05-07부터 리치 결과가 나오지 않는다.
- **HowTo**: 2023년에 종료됐다.
- **Recipe**: 조리법이 없는 페이지에 쓰면 가이드라인 위반이다.
- **Event**: 공개 예매가 되는 실제 장소 행사만 해당한다. 명절은 맞지 않는다.
- **ItemList**: 단독으로는 리치 결과가 없다.
- **이미지 라이선스(`ImageObject`)**: 가리킬 라이선스 페이지가 아직 없다.
- `BreadcrumbList`는 2025-01부터 구글이 데스크톱에서만 보여 준다. 그래도 비용이 작아 넣는다.

## 운영 전환 절차 (도메인이 정해진 뒤)

01이 `seo.md`에 자세히 적는다. 요약은 다음과 같다.

1. 운영 환경에 `NEXT_PUBLIC_SITE_URL`과 `SITE_INDEXABLE=true`를 넣고 다시 빌드한다.
2. 구글 Search Console에서 도메인 속성을 DNS로 확인한다. URL 접두어 속성으로 등록한다면 메타 값을 `GOOGLE_SITE_VERIFICATION`에 넣는다.
3. 네이버 서치어드바이저에 사이트를 등록하고, 받은 값을 `NAVER_SITE_VERIFICATION`에 넣은 뒤 다시 배포한다.
4. 두 곳에 `https://<도메인>/sitemap.xml`을 제출한다.
5. 몇 페이지를 골라 URL 검사로 렌더 결과와 noindex 여부를 확인한다.
