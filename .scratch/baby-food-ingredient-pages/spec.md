# 이유식 재료별 궁합 페이지

Status: ready-for-agent

## 왜

사람들은 이유식 궁합을 재료 이름을 붙여 검색한다. 2026-11-09에 네이버·구글 자동완성을 조회한 결과는 다음과 같다(검색량 수치는 확인하지 못했다).

- 구글: `소고기·닭고기·돼지고기·고구마·새우·오이·비트·아보카도 이유식 궁합`
- 네이버: `닭고기·소고기·돼지고기·대구살·연어·밤·새우·가자미 이유식 조합`, `이유식 상극 음식`

지금은 31개 기준 재료가 `/baby-food/pairings` 한 주소에 모여 있다. 그래서 "닭고기 이유식 궁합"처럼 재료 이름이 들어간 검색어를 받을 페이지가 없다. 기준 재료마다 고정 주소를 하나씩 둔다.

## 확정한 결정

- 31개 기준 재료 모두 페이지를 만든다. 주소는 `/baby-food/pairings/[ingredient]`이고, 세그먼트는 영문 id다. `/seasonal/foods/[food]`와 같은 id를 쓴다(`소고기` → `beef`). `브로콜리/콜리플라워`는 `broccoli` 한 페이지로 만든다.
- 관계가 적은 재료는 페이지를 만들되 색인하지 않는다(noindex, sitemap 제외). 관계 수는 O 개수 + X 개수 + 역참조 수다. 기준은 **5 미만**이다. 2026-11-09 데이터에서는 배추(1)·우엉(1)·블루베리(2)·조개(3)·연어(3)·콩(4)이 여기에 해당한다. 사람이 쓴 본문(04)이 있으면 관계 수와 상관없이 색인한다. 기준은 함수 하나(`isPairingIndexable`)로 두고 테스트한다.
- 본문은 두 단계로 만든다.
  1. 데이터로 자동 생성: 그 재료의 O·X 목록과, 다른 기준 재료 표에서 이 재료가 O나 X로 나온 곳(역참조).
  2. 수요 상위 재료만 사람이 쓴 짧은 글: 시작 시기, 손질, 주의점. 출처를 단다(04).
- O·X는 계속 "원본의 분류"다. 의학적 사실로 격상하지 않는다. 검색 문구에는 "상극"을 쓰지만, 본문에는 기존 `INFANT_PAIRING_COPY.limit`(X만으로 섭취 금지를 뜻하지 않는다)을 함께 보인다.

## 페이지 구성 (`/baby-food/pairings/beef`)

- h1: `소고기 이유식 궁합`
- 잘 맞는 재료 (O): 기존 `PairingEvidence` 칩. 상대 재료가 기준 재료이면 그 재료 페이지로 가는 링크도 둔다.
- 주의할 재료 (X): 같은 방식. 우유의 고구마·시금치 충돌은 기존 처리(별도 조사 안내)를 그대로 따른다.
- 다른 재료 표에서: "고구마 표에서 소고기는 X" 같은 역참조 목록. 방향을 반드시 적는다(어느 표에서, O인지 X인지).
- 자료와 해석: `INFANT_PAIRING_COPY.source`·`limit`과 참고 링크. 전체표 페이지와 같은 문구를 쓴다.
- 이어보기: 전체 궁합표, `내 재료 골라보기`(`routes.babyFood.withSelection(root, [name])`), 그리고 제철 품종이면 `/seasonal/foods/[id]`.
- 별칭은 본문에 함께 적는다. `계란(달걀)`, `흰살생선(대구·가자미 등)`, `브로콜리·콜리플라워`.

## 검색 메타

`shared/seo/titles.ts`의 `babyFoodIngredientSeo(row, reverse)`에 둔다.

- title: `{이름} 이유식 궁합 · 잘 맞는 재료와 상극 재료`. X가 없으면 `{이름} 이유식 궁합 · 잘 맞는 재료 {N}가지`로 쓴다.
- description: `{이름} 이유식에 잘 맞는 재료는 A·B·C 등 {N}가지, 주의할 재료는 X·Y예요. 이유식 조합을 고를 때 참고하세요.` X가 없으면 뒷부분을 뺀다. 네이버 검색어 "조합"을 description에 넣는다.
- 탐색경로 JSON-LD: 제철달력 › 이유식 재료 궁합표 › {이름} 이유식 궁합
- OG 이미지: `{ title: "{이름} 이유식 궁합", badge: "이유식" }`

## 라우팅·레이어

- `app/(price)/baby-food/pairings/[ingredient]/page.tsx`. Cache Components 규칙에 따라 `generateStaticParams`로 31개 id를 펼친다. 목록 밖 id는 `notFound()`로 처리하고, `params`는 `<Suspense>` 안에서 읽는다.
- 결과 화면의 인터셉트 `@pairing/(..)pairings`는 `/baby-food/pairings`만 가로챈다. 하위 `[ingredient]`는 가로채지 않으므로 그 밑에 파일을 더하지 않는다. 구현 뒤 결과 화면에서 재료 페이지 링크가 전체 페이지로 열리는지 확인한다.
- 궁합 데이터(`PAIRINGS`, 카테고리, 시트 분할)는 순수 TS다. `packages/seasonal/src/data/infant-pairings.ts`로 옮긴다. 이유는 두 가지다.
  - 제철 품종 상세(`features/seasonal/food-detail`)가 궁합 페이지 링크를 걸려면 이 데이터가 필요한데, features끼리는 import할 수 없다.
  - `shared/seo/pages.ts`가 sitemap을 펼칠 때도 필요하다.
  `PAIRING_ART`(그림 경로)는 앱에 둔다.
- `PairingRow`에 `id`를 더한다. 역참조 `pairingMentions(name)`, 관계 수 `pairingRelationCount`, 색인 판단 `isPairingIndexable`은 같은 파일의 순수 함수다. 테스트를 먼저 쓴다.
- `shared/routes.ts`에 `babyFood.ingredient(id)`를 더한다.
- `shared/seo/pages.ts`의 `SEO_PAGES`에 `"/baby-food/pairings/[ingredient]"`를 넣는다. 펼치는 목록은 색인 대상만이다. 색인하지 않는 재료는 페이지에서 `createMetadata({ noIndex: true })`를 쓴다(인쇄물의 내려간 에디션과 같은 방식).

## 하지 않는 것

- 재료 조합(소고기+당근) 단위의 페이지. 조합 수가 많고, 원본은 기준 재료별 목록일 뿐이다.
- 기준 재료가 아닌 재료(비트·아보카도·밤·가자미 등)의 페이지. 검색 수요는 있지만 원본에 그 재료의 표가 없다. 역참조만으로 페이지를 만들면 원본에 없는 방향의 관계를 지어낸다.
- 월령별 판정. 검증된 월령 데이터가 없다(`.scratch/infant-food-pairing/spec.md`).

## 티켓

- `issues/01-pairing-data-to-domain.md`: 데이터 이동, id, 역참조·색인 함수(테스트 먼저)
- `issues/02-ingredient-route.md`: 재료별 페이지, 메타, sitemap
- `issues/03-internal-links.md`: 전체표·제철 상세에서 연결
- `issues/04-top-ingredient-copy.md`: 수요 상위 재료의 사람이 쓴 본문
