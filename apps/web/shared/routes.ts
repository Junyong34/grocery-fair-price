// 앱의 모든 경로를 여기서 만든다. 화면 코드는 경로 문자열을 직접 쓰지 않고 routes를 쓴다.
// 제철 영역의 접두어(/seasonal)나 메인 경로가 바뀌어도 이 파일과 폴더 이름만 고치면 된다.

import type { FoodCategory } from "@workspace/seasonal/data/foods"
import type { MONTHLY_INGREDIENT_CATEGORIES } from "@workspace/seasonal/data/ingredient-calendar"
import type { Festival } from "@workspace/seasonal/data/festivals"
import type { Season } from "@workspace/seasonal/data/seasons"
// 인쇄 URL 코덱만 가져온다. print/spec은 zod·품종 데이터를 싣고 있어 여기서 값을 import하면 모든 페이지 번들에 들어간다.
import { formatYearMonth } from "@workspace/seasonal/calendar/year-month"
import { encodeSpec } from "@workspace/seasonal/print/spec-codec"
import type { Paper, PrintSpec, PublishedPaper } from "@workspace/seasonal/print/spec"

export const routes = {
  /** 서비스 메인(P1 시세 메인). 로고와 하단 내비 "시세"가 여기로 간다. */
  home: "/",

  /** 가격 화면(시세 · 판정). .scratch/price-screens/spec.md */
  price: {
    /** P2 품종 검색. 검색어는 ?q= */
    search: "/search",
    searchFor: (query: string) => (query ? `/search?q=${encodeURIComponent(query)}` : "/search"),
    /** P3 품종 상세의 접두 경로. 이 주소 자체에는 페이지가 없고 next.config.ts가 시세 메인으로 보낸다. 링크에 쓰지 않는다. */
    varieties: "/prices",
    /** P3 품종 상세 */
    variety: (id: string) => `/prices/${id}`,
    /** P4 담은 품종 */
    basket: "/basket",
    /** 상품 목록: 상품이 있는 카테고리를 고른다 */
    products: "/products",
    /** 상품 카테고리 페이지. slug는 price.category.slug */
    productCategory: (slug: string) => `/products/categories/${slug}`,
    /** 참가격 상품 상세(catalog-scale/10). id는 참가격 상품 번호(goodId) */
    product: (id: string) => `/products/${id}`,
  },

  seasonal: {
    /** 2a 이달 · 12개월 스크롤 */
    root: "/seasonal",
    /** 2a의 그 달 섹션. 해시라 정적 셸이 유지되고, 2a가 해시를 읽어 즉시 이동한다. */
    rootAt: (month: number) => `/seasonal#month-${month}`,
    /** 2a를 (연, 월)마다 미리 그린 내부 경로. proxy.ts가 root를 여기로 rewrite한다. 화면 링크에는 root를 쓴다. */
    at: (year: number, month: number) => `/seasonal/at/${formatYearMonth(year, month)}`,
    /** 2b 월별 보기: 열두 달 카드 목록과 그 달 상세 */
    months: "/seasonal/months",
    month: (month: number) => `/seasonal/months/${month}`,
    /** 3a 계절 히어로 · 계절 상세 */
    seasons: "/seasonal/seasons",
    season: (season: Season) => `/seasonal/seasons/${season}`,
    /** 카테고리별 연간 제철과 과일·채소·수산 월별 상세. */
    ingredients: "/seasonal/ingredients",
    ingredientsFor: (category: FoodCategory) => `/seasonal/ingredients?${new URLSearchParams({ category })}`,
    ingredientMonth: (category: (typeof MONTHLY_INGREDIENT_CATEGORIES)[number]["slug"], month: number) =>
      `/seasonal/ingredients/${category}/${month}`,
    /** 제철 회. 접두 경로만 열면 proxy.ts가 서울 기준 이번 달로 보낸다(.scratch/sashimi/spec.md). */
    sashimi: "/seasonal/sashimi",
    sashimiMonth: (month: number) => `/seasonal/sashimi/${month}`,
    /** 1g 명절. 접두 경로만 열면 proxy.ts가 다가오는 명절로 보낸다. */
    festivals: "/seasonal/festivals",
    festival: (festival: Festival) => `/seasonal/festivals/${festival}`,
    /** 1h 나의 식탁 */
    myTable: "/seasonal/my-table",
    /** 1i 품종 상세. 제철 화면 안에서 누르면 하단 시트로, 주소로 직접 열면 전체 페이지로 뜬다. */
    food: (id: string) => `/seasonal/foods/${id}`,
    /** 달력·포스터 PDF 내려받기 */
    downloads: "/seasonal/downloads",
    /** 에디션 상세. 제철 화면 안에서 누르면 하단 시트로, 주소로 직접 열면 전체 페이지로 뜬다. */
    download: (id: string) => `/seasonal/downloads/${id}`,
    /** 에디션 PDF 내려받기 주소. 저장소의 짧은 서명 링크로 넘긴다(ADR 0003). */
    downloadFile: (id: string, paper: PublishedPaper) => `/seasonal/downloads/${id}/${paper.toLowerCase()}`,
  },

  babyFood: {
    root: "/baby-food",
    result: "/baby-food/result",
    pairings: "/baby-food/pairings",
    /** 기준 재료별 궁합 페이지. id는 PAIRINGS의 영문 id(제철 품종 id와 같다) */
    ingredient: (id: string) => `/baby-food/pairings/${id}`,
    /** 월령별 과일 시기 및 주의 식재료 메인 허브 */
    fruits: "/baby-food/fruits",
    /** 월령 단계별 과일 시기 페이지. stage는 BABY_FRUIT_STAGES의 id */
    fruitsStage: (stage: string) => `/baby-food/fruits/${stage}`,
    withSelection: (path: "/baby-food" | "/baby-food/result" | "/baby-food/pairings", names: readonly string[]) => {
      const params = new URLSearchParams()
      for (const name of names) params.append("food", name)
      const query = params.toString()
      return query ? `${path}?${query}` : path
    },
  },

  /** 설정. ⚙를 어디서 눌러도 여기로 온다(.scratch/shell-unify/spec.md 5장). */
  settings: {
    root: "/settings",
    /** 데이터 출처 */
    sources: "/settings/sources",
  },

  /** 개인정보 처리방침 */
  privacy: "/privacy",

  /** 인쇄물 어드민. 개발 서버에서만 열린다(.scratch/calendar-print/spec.md). */
  admin: {
    root: "/admin",
    edition: (id: string) => `/admin/edit?id=${encodeURIComponent(id)}`,
    /** 인쇄물 구조 안(와이어프레임) 모음 */
    wireframes: "/admin/wireframes",
    /** 고정 A4 세 장 미리보기와 다운로드. */
    babyFoodPrint: "/admin/baby-food/print",
    babyFoodPdf: "/admin/baby-food/pdf",
    /** 월령별 과일 시기 A4 미리보기와 다운로드 */
    babyFoodFruitsPrint: "/admin/baby-food/fruits-print",
    babyFoodFruitsPdf: "/admin/baby-food/fruits-pdf",
    /** 카탈로그 어드민: 카테고리 (ADR 0005, 소유자 접속) */
    catalogCategories: "/admin/catalog/categories",
    /** 카탈로그 어드민: 식재료 목록 (읽기 전용, ingest_writer) */
    catalogVarieties: "/admin/catalog/varieties",
    /** 카탈로그 어드민: 상품 목록 (catalog-scale/10, 읽기 전용, ingest_writer) */
    catalogProducts: "/admin/catalog/products",
    /** 카탈로그 어드민: 제안 검토 (catalog-scale/07, 소유자 접속) */
    catalogProposals: "/admin/catalog/proposals",
    /** 그림 어드민: 그림 목록과 그림 검수 (ADR 0006, prototypes/가 있는 기기에서) */
    foods: "/admin/foods",
    /** 그림 어드민: 기존 품종 편집 (표시명 · 별칭 · 제철 달 · 근거 · 연결된 그림) */
    foodVarieties: "/admin/foods/varieties",
    /** 그림 원본에서 그린 미리보기 SVG. 웹에 나가기 전의 그림도 보여 준다. */
    foodPreview: (art: string, variant: "color" | "motion") => `/admin/foods/preview?art=${encodeURIComponent(art)}&variant=${variant}`,
  },

  /** 인쇄 전용 페이지. 어드민 미리보기와 PDF 생성기가 연다. */
  print: (spec: PrintSpec, paper: Paper) => `/print?spec=${encodeSpec(spec)}&paper=${paper}`,
} as const
