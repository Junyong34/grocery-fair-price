# 02 재료별 궁합 페이지 `/baby-food/pairings/[ingredient]`

Status: resolved (2026-11-09)
Blocked by: 01

스펙: `../spec.md` "페이지 구성", "검색 메타", "라우팅·레이어"

## 할 일

- `shared/routes.ts`에 `babyFood.ingredient(id)`를 더한다.
- `app/(price)/baby-food/pairings/[ingredient]/page.tsx`를 만든다. `generateStaticParams`로 31개 id를 펼친다. 목록 밖 id는 `notFound()`로 처리하고, `params`는 `<Suspense>` 안에서 읽는다. 라우트는 얇게 두고, 화면은 `features/baby-food/ingredient-detail.tsx`에 둔다.
- `shared/seo/titles.ts`에 `babyFoodIngredientSeo`를 더하고, `titles.test.ts` 목록에 31개를 모두 넣는다(설명 중복 검사가 돌게).
- `generateMetadata`에서 `createMetadata({ ...seo, path, ogImage: { title, badge: "이유식" }, noIndex: !isPairingIndexable(...) })`를 돌려준다.
- 탐색경로 JSON-LD를 넣는다(제철달력 › 이유식 재료 궁합표 › {이름} 이유식 궁합).
- `shared/seo/pages.ts`의 `SEO_PAGES`에 색인 대상 id만 펼친다.
- O·X 칩은 기존 `PairingEvidence`를 쓴다. 상대 재료가 기준 재료이면 그 페이지로 가는 링크도 둔다. 우유 충돌 처리는 기존과 같게 한다.

## 완료 조건

- 서버 HTML에 h1 하나, O·X·역참조 목록, 자료와 해석 문구, canonical, 탐색경로 JSON-LD가 있다.
- `/baby-food/pairings/nope`은 404 또는 noindex로 나온다(제철 상세의 soft 404와 같은 동작이면 된다).
- noindex 재료(예: `napa-cabbage`)는 robots noindex이고, sitemap에 없다.
- 결과 화면(`/baby-food/result?food=소고기`)에서 재료 페이지 링크가 모달이 아닌 전체 페이지로 열린다.
- `next-dev-loop`로 375·1280 폭에서 확인하고, 콘솔 오류와 hydration 경고가 없다.
- `pnpm typecheck`, `pnpm lint`, `pnpm test`가 통과한다.

## 결과 (2026-11-09)

- 25개 재료를 색인해요. noindex는 배추·우엉·블루베리·조개·연어·콩이에요. 판단은 `isPairingPageIndexable`이 하고, 사람이 쓴 본문(`INFANT_PAIRING_COPY.ingredients`, 04)이 있으면 색인해요.
- `/baby-food/pairings/nope`은 200 + noindex로 나와요. 제철 상세와 같은 soft 404예요.
- 공용 칩·자료 문단은 `pairing-items.tsx`·`pairing-source.tsx`·`ingredient-art.tsx`로 나눴어요.
- `babyFoodIngredientSeo`는 `row`만 받아요. 역참조 인자는 쓸 곳이 없어서 뺐어요.
- 375·1280 폭에서 확인했어요(beef·milk·broccoli·egg). 콘솔 오류와 hydration 경고는 없었어요.
- 확인하지 못한 것:
  - dev 서버의 `/sitemap.xml`은 HMR이 옛 `routes.ts`를 붙잡고 있어서 500이었어요. 펼친 목록은 `pages.test.ts`로만 확인했어요.
  - 결과 화면에서 모달이 아닌 전체 페이지로 열리는지는, 링크가 생기는 03에서 확인해요.

