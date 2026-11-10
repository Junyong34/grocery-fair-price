// 검색 결과에 나오는 <title>과 description. 화면의 h1과 OG 이미지 글자는 페이지가 따로 정한다.
// 제목은 사람들이 실제로 치는 검색어 모양으로 쓴다("대게 제철 시기", "3월 제철 음식"). 꼬리 " | 장볼날"은 루트 레이아웃 template이 붙인다.
// 설명은 페이지마다 달라야 하므로 그 페이지에만 있는 품종·음식 이름을 넣는다. 근거: .scratch/seo/spec.md "검색어에 맞춘 제목"

import { monthDay, won } from "@workspace/price/format"
import type { ProductDetail } from "@workspace/price/types"
import { explainVerdict, type VerdictSubject } from "@workspace/price/verdict-copy"
import { SEASON_COPY } from "@workspace/seasonal/data/copy"
import { dishNames } from "@workspace/seasonal/data/dishes"
import { type Festival, festivalOf, festivalsWithFood } from "@workspace/seasonal/data/festivals"
import { type Food, foodsInMonth, foodsInSeasonWith, monthHighlights, seasonHighlights } from "@workspace/seasonal/data/foods"
import { type PairingRow, pairingDisplayName } from "@workspace/seasonal/data/infant-pairings"
import { sashimiInMonth } from "@workspace/seasonal/data/sashimi"
import { formatSeasonMonths } from "@workspace/seasonal/data/months"
import type { Season } from "@workspace/seasonal/data/seasons"

export type PageSeo = { title: string; description: string }

/**
 * 이유식 궁합표. 구글은 "이유식 궁합(표)", 네이버는 "이유식 조합"·"이유식 상극 음식"으로 많이 찾는다.
 * 설명 앞머리는 "[재료] 이유식 궁합" 검색이 가장 많은 소고기·닭고기로 연다. 재료 수는 PAIRINGS 길이를 페이지가 넘긴다.
 */
export function babyFoodPairingsSeo(count: number): PageSeo {
  return {
    title: "이유식 재료 궁합표 · 잘 맞는 조합과 상극 재료",
    description: `소고기·닭고기·고구마·당근 등 이유식 재료 ${count}개의 궁합표. 재료마다 함께 넣기 좋은 조합과 주의할 상극 재료를 O·X로 정리했어요. 집에 있는 재료를 골라 바로 확인해 보세요.`,
  }
}

/** 앞에서 셋까지 ·로 잇고, 더 있으면 "등"을 붙인다. */
function firstThree(names: readonly string[]): string {
  return names.length > 3 ? `${names.slice(0, 3).join("·")} 등` : names.join("·")
}

/**
 * 재료별 이유식 궁합(baby-food-ingredient-pages). 구글은 "[재료] 이유식 궁합", 네이버는 "[재료] 이유식 조합"으로 찾는다.
 * 제목의 "상극"은 검색어다. 본문은 X를 원본의 주의 목록으로만 보인다.
 */
export function babyFoodIngredientSeo(row: PairingRow): PageSeo {
  const name = pairingDisplayName(row)
  const bad = row.bad.length > 0 ? `, 주의할 재료는 ${firstThree(row.bad)}예요` : "예요"
  return {
    title: row.bad.length > 0 ? `${name} 이유식 궁합 · 잘 맞는 재료와 상극 재료` : `${name} 이유식 궁합 · 잘 맞는 재료 ${row.good.length}가지`,
    description: `${name} 이유식에 잘 맞는 재료는 ${firstThree(row.good)} ${row.good.length}가지${bad}. 이유식 조합을 고를 때 참고하세요.`,
  }
}

/** 무료 PDF를 찾는 검색의 입구. 연도는 개별 인쇄물에서 안내한다. */
export function downloadsSeo(): PageSeo {
  return {
    title: "제철 음식 달력 무료 다운로드 · A4 PDF",
    description: "제철달력 무료 다운로드. 월별 제철 음식을 담은 월간·연간 달력을 회원가입 없이 A4 PDF로 받아 보세요. 미리보기로 고르고 집에서 인쇄할 수 있어요.",
  }
}

/** 인쇄물 상세 제목. "제철"만 쓰면 철강(製鐵)으로 읽히는 검색엔진이 있어, 이름에 없으면 "제철 음식"을 앞에 붙인다. */
export function editionSeoTitle(name: string): string {
  return `${name.includes("제철") ? "" : "제철 음식 "}${name} PDF 무료 다운로드`
}

/** 설명에 넣을 품종 이름 목록. "냉이·달래·주꾸미" */
function names(foods: readonly Food[]): string {
  return foods.map((food) => food.name).join("·")
}

/**
 * 서비스 메인(P1 시세 메인).
 * 설명에 드는 품종은 홈의 "자주 사는 식재료"(FEATURED_IDS)에 있는 것만 쓴다.
 * 조사일은 품종마다 달라 "오늘"이라 하지 않고, 출처는 홈 목록에 나오는 둘을 모두 적는다.
 */
export function homeSeo(): PageSeo {
  return {
    title: "오늘 식재료 시세 · 지금 사도 될까",
    description: "삼겹살·계란·대파, 최근 조사한 시세를 이맘때 평소 가격과 견줘 싸요·보통·비싸요로 알려 드려요. KAMIS·축평원 조사 기준.",
  }
}

/** P3 품종 상세. 설명은 판정 풀이의 검색 설명(그날 시세와 판정)이다. */
export function varietySeo(variety: VerdictSubject): PageSeo {
  return {
    title: `${variety.name} 시세 · 평소 가격`,
    description: explainVerdict(variety, null).seoDescription,
  }
}

/** 상품 상세(catalog-scale/10). 판정이 없어 판매가와 판매처 비교로 쓴다. 사람들은 "상품명 가격", "상품명 최저가"로 찾는다. */
export function productSeo(product: Pick<ProductDetail, "name" | "price" | "surveyedOn"> & { sellers: readonly unknown[] }): PageSeo {
  return {
    title: `${product.name} 가격 비교`,
    description: `${product.name} 전국 판매가 ${won(product.price)}원(${monthDay(product.surveyedOn)} 참가격 조사). 이마트·편의점 등 판매처 ${product.sellers.length}곳 가격을 견줘 보세요.`,
  }
}

/** 제철 메인(2a 이달) */
export function seasonalHomeSeo(): PageSeo {
  return {
    title: "제철 음식 달력",
    description: "언제 뭐가 맛있을까? 이달의 제철 식재료부터 열두 달·사계절·명절 제철 음식까지 달력으로 확인해 보세요.",
  }
}

export function monthsIndexSeo(): PageSeo {
  return {
    title: "월별 제철 음식",
    description: "1월부터 12월까지 달마다 가장 맛있는 제철 식재료를 한눈에 보는 열두 달 제철 음식 타임라인.",
  }
}

export function monthSeo(month: number): PageSeo {
  return {
    // 품종 수는 2b 화면 머리의 "N가지"와 같은 값이다.
    title: `${month}월 제철 음식 ${foodsInMonth(month).length}가지`,
    description: `${month}월 제철 음식은 ${names(monthHighlights(month, 3))} 등. ${month}월에 가장 맛있는 우리 땅 제철 식재료를 모아 보세요.`,
  }
}

export function seasonsIndexSeo(): PageSeo {
  return {
    title: "계절별 제철 음식",
    description: "봄·여름·가을·겨울, 계절마다 가장 맛있는 제철 식재료와 음식 이야기.",
  }
}

export function seasonSeo(season: Season): PageSeo {
  const { name, description } = SEASON_COPY[season]
  return {
    title: `${name} 제철 음식`,
    description: `${name} 제철 음식은 ${names(seasonHighlights(season, 4))} 등. ${description}이에요.`,
  }
}

export function festivalSeo(slug: Festival): PageSeo {
  const { name, period, traditionalDishes } = festivalOf(slug)
  return {
    title: `${name} 음식`,
    description: `${name}(${period})에 먹는 전통 음식 ${dishNames(traditionalDishes).join("·")}, 그리고 ${name} 무렵 제철 식재료를 소개해요.`,
  }
}

/** 제철 회(.scratch/sashimi/spec.md) */
export function sashimiSeo(month: number): PageSeo {
  return {
    title: `${month}월 제철 회`,
    description: `${month}월에 회로 맛있는 생선과 해산물, ${names(sashimiInMonth(month).slice(0, 3))} 등. 맛과 식감을 한 줄씩 소개해요.`,
  }
}

export function foodSeo(food: Food): PageSeo {
  // 다른 이름으로도 검색되도록 붙인다. 광어 → "광어(넙치)"
  const label = food.aliases.length > 0 ? `${food.name}(${food.aliases.join("·")})` : food.name
  // formatSeasonMonths는 "제철 12·1·2·3월"처럼 앞에 "제철"을 붙인다.
  const months = formatSeasonMonths(food.months).replace(/^제철 /, "")
  const together = foodsInSeasonWith(food).slice(0, 2)
  const festivals = festivalsWithFood(food.id).map((festival) => festival.name)
  const parts = [
    `${label} 제철은 ${months}이에요.`,
    festivals.length > 0 && `${festivals.join("·")} 무렵 제철 식재료예요.`,
    together.length > 0 && `같은 때 제철인 ${names(together)}도 함께 확인해 보세요.`,
  ]
  return {
    // "언제부터 언제까지"를 찾는 검색이라 제철 달을 제목에 바로 보인다. 화면의 "제철 12~5월"과 같은 표기다.
    title: `${food.name} 제철 시기 · ${months}`,
    description: parts.filter(Boolean).join(" "),
  }
}
