# 02 라우트 및 SEO 색인 등록

Type: task
Status: resolved
Blocked by: 01

## 무엇을

메인 허브 화면(`/baby-food/fruits`)과 6단계 정적 라우트(`/baby-food/fruits/[stage]`)를 생성하고, `shared/routes.ts` 및 `shared/seo/pages.ts`에 등록한다.

## 작업 상세

1. **라우트 등록**:
   - `apps/web/shared/routes.ts`에 `babyFood.fruits`, `babyFood.fruitsStage(stage)` 추가 완료.
2. **Next.js 페이지 생성**:
   - `apps/web/app/(price)/baby-food/fruits/page.tsx`: 전체 요약 타임라인 뷰 생성.
   - `apps/web/app/(price)/baby-food/fruits/[stage]/page.tsx`: `generateStaticParams`로 6개 slug 정의, `notFound()` 처리, `<Suspense>` 안에서 `params`와 `getSeoulToday()` 읽기.
3. **SEO 메타데이터**:
   - `apps/web/shared/seo/titles.ts`에 `babyFoodFruitsSeo()`, `babyFoodFruitsStageSeo()` 신설.
   - `apps/web/shared/seo/pages.ts`의 `SEO_PAGES`에 `"/baby-food/fruits"`, `"/baby-food/fruits/[stage]"` 등록.
   - `apps/web/shared/seo/pages.test.ts` 가드 테스트 통과.

## Answer

- `shared/routes.ts`에 `babyFood.fruits`, `babyFood.fruitsStage` 등록 완료.
- `app/(price)/baby-food/fruits/page.tsx` 및 `[stage]/page.tsx` 정적 라우트 생성 완료.
- `shared/seo/titles.ts` 및 `shared/seo/pages.ts` 등록 완료.
- `shared/seo/pages.test.ts` 7개 가드 테스트 100% 통과.
