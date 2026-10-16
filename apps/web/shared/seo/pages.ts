// 색인 정책의 단일 출처. 모든 페이지는 아래 셋 가운데 한 곳에 등록한다.
// 빠뜨리면 pages.test.ts(가드 테스트)가 실패한다. 절차와 근거: apps/web/docs/seo.md, .scratch/seo/spec.md

import { FESTIVALS } from "@workspace/seasonal/data/festivals"
import { FOODS, isDrawn } from "@workspace/seasonal/data/foods"
import { MONTHS } from "@workspace/seasonal/data/months"
import { SEASONS } from "@workspace/seasonal/data/seasons"

import { routes } from "@/shared/routes"

/** sitemap의 한 줄. 경로는 routes로 만든 상대 경로이고, sitemap.ts가 절대 주소로 바꾼다. */
export type SitemapEntry = {
  path: string
  /** 페이지의 대표 그림(상대 경로). 이미지 sitemap이 된다. */
  images?: readonly string[]
  /** 본문·구조화 데이터·링크가 실제로 바뀐 날짜(YYYY-MM-DD). 모르면 비운다. 빌드 시각을 넣지 않는다. */
  lastModified?: string
}

/**
 * 색인 대상. 키는 Next 라우트 패턴(app/ 폴더 구조에서 라우트 그룹을 뺀 것), 값은 그 패턴이 만드는 sitemap 줄이다.
 * 동적 세그먼트는 generateStaticParams와 같은 목록을 펼친다. 키의 오타는 가드 테스트가 잡는다.
 */
export const SEO_PAGES: Readonly<Record<string, () => readonly SitemapEntry[]>> = {
  "/seasonal": () => [{ path: routes.seasonal.root }],
  "/seasonal/months": () => [{ path: routes.seasonal.months }],
  "/seasonal/months/[month]": () => MONTHS.map((month) => ({ path: routes.seasonal.month(month) })),
  "/seasonal/seasons": () => [{ path: routes.seasonal.seasons }],
  "/seasonal/downloads": () => [{ path: routes.seasonal.downloads }],
  "/seasonal/seasons/[season]": () => SEASONS.map((season) => ({ path: routes.seasonal.season(season) })),
  "/seasonal/festivals/[festival]": () => FESTIVALS.map(({ slug }) => ({ path: routes.seasonal.festival(slug) })),
  // 그림이 있는 품종은 일러스트를 이미지 sitemap으로 알린다(FoodImage가 그리는 그 파일).
  "/seasonal/foods/[food]": () =>
    FOODS.map((food) => ({
      path: routes.seasonal.food(food.id),
      ...(isDrawn(food.id) && { images: [`/foods/${food.id}/color.svg`] }),
    })),
}

/**
 * 색인하지 않는 라우트(접두 경로). 페이지는 createMetadata({ noIndex: true })나 layout의 robots로 noindex를 낸다.
 * robots.txt의 Disallow로 막지 않는다. 막으면 크롤러가 noindex를 읽지 못해 주소만 색인에 남을 수 있다.
 */
export const NOINDEX_ROUTES: readonly string[] = [
  // 1h 나의 식탁: 기기에 저장된 기록으로 채워져 크롤러에게는 빈 화면이다.
  "/seasonal/my-table",
  // PDF 인쇄 페이지. 개발 서버에서만 열리고 운영에서는 404다(.scratch/calendar-print/spec.md).
  "/print",
  // 인쇄물 어드민. 개발 서버에서만 열린다.
  "/admin",
]

/** 다른 페이지로 보내기만 하는 라우트. sitemap에 넣지 않는다. */
export const REDIRECT_ROUTES: readonly string[] = [
  // 서비스 메인 자리. 지금은 routes.home으로 307. 가격 비교 메인이 생기면 SEO_PAGES로 옮긴다.
  "/",
]

export type SeoPolicy = "index" | "noindex" | "redirect"

/** 라우트 패턴의 색인 정책. 어디에도 없으면 undefined(가드 테스트가 실패한다). */
export function seoPolicyOf(pattern: string): SeoPolicy | undefined {
  if (pattern in SEO_PAGES) return "index"
  if (NOINDEX_ROUTES.some((prefix) => pattern === prefix || pattern.startsWith(`${prefix}/`))) return "noindex"
  if (REDIRECT_ROUTES.includes(pattern)) return "redirect"
  return undefined
}
