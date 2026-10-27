// 검색 결과에 나오는 <title>과 description. 화면의 h1과 OG 이미지 글자는 페이지가 따로 정한다.
// 제목은 사람들이 실제로 치는 검색어 모양으로 쓴다("대게 제철 시기", "3월 제철 음식"). 꼬리 " | 장볼날"은 루트 레이아웃 template이 붙인다.
// 설명은 페이지마다 달라야 하므로 그 페이지에만 있는 품종·음식 이름을 넣는다. 근거: .scratch/seo/spec.md "검색어에 맞춘 제목"

import { SEASON_COPY } from "@workspace/seasonal/data/copy"
import { type Festival, festivalOf, festivalsWithFood } from "@workspace/seasonal/data/festivals"
import { type Food, foodsInSeasonWith, monthHighlights, seasonHighlights } from "@workspace/seasonal/data/foods"
import { formatSeasonMonths } from "@workspace/seasonal/data/months"
import type { Season } from "@workspace/seasonal/data/seasons"

export type PageSeo = { title: string; description: string }

/** 설명에 넣을 품종 이름 목록. "냉이·달래·주꾸미" */
function names(foods: readonly Food[]): string {
  return foods.map((food) => food.name).join("·")
}

/** 서비스 메인(P1 시세 메인) */
export function homeSeo(): PageSeo {
  return {
    title: "오늘 식재료 시세 · 지금 사도 될까",
    description: "배추·삼겹살·계란, 오늘 조사한 시세를 이맘때 평소 가격과 견줘 싸요·보통·비싸요로 알려 드려요. KAMIS 전국 조사 시장 기준.",
  }
}

/** P3 품종 상세 */
export function varietySeo(variety: { name: string; baseUnit: string }): PageSeo {
  return {
    title: `${variety.name} 시세 · 평소 가격`,
    description: `${variety.name}(${variety.baseUnit}) 오늘 시세가 평소보다 싼지 비싼지, 대형마트·전통시장은 얼마에 파는지 견줘 보세요.`,
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
    title: `${month}월 제철 음식`,
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
    description: `${name}(${period})에 먹는 전통 음식 ${traditionalDishes.join("·")}, 그리고 ${name} 무렵 제철 식재료를 소개해요.`,
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
    title: `${food.name} 제철 시기`,
    description: parts.filter(Boolean).join(" "),
  }
}
