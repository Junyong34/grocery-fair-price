// 검색 결과에 나오는 <title>과 description. 화면의 h1과 OG 이미지 글자는 페이지가 따로 정한다.
// 제목은 사람들이 실제로 치는 검색어 모양으로 쓴다("대게 제철 시기", "3월 제철 음식"). 꼬리 " | 장볼날"은 루트 레이아웃 template이 붙인다.
// 설명은 페이지마다 달라야 하므로 그 페이지에만 있는 품종·음식 이름을 넣는다. 근거: .scratch/seo/spec.md "검색어에 맞춘 제목"

import { VERDICT_WORD, verdictDiff } from "@workspace/price/copy"
import { monthDay, won } from "@workspace/price/format"
import type { VarietySummary } from "@workspace/price/types"
import { SEASON_COPY } from "@workspace/seasonal/data/copy"
import { dishNames } from "@workspace/seasonal/data/dishes"
import { type Festival, festivalOf, festivalsWithFood } from "@workspace/seasonal/data/festivals"
import { type Food, foodsInSeasonWith, monthHighlights, seasonHighlights } from "@workspace/seasonal/data/foods"
import { sashimiInMonth } from "@workspace/seasonal/data/sashimi"
import { formatSeasonMonths } from "@workspace/seasonal/data/months"
import type { Season } from "@workspace/seasonal/data/seasons"

export type PageSeo = { title: string; description: string }

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

/** 서비스 메인(P1 시세 메인) */
export function homeSeo(): PageSeo {
  return {
    title: "오늘 식재료 시세 · 지금 사도 될까",
    description: "배추·삼겹살·계란, 오늘 조사한 시세를 이맘때 평소 가격과 견줘 싸요·보통·비싸요로 알려 드려요. KAMIS 전국 조사 시장 기준.",
  }
}

/** 품종 허브(/prices). 카테고리 이름은 목록에서 받아 넣는다. */
export function varietiesIndexSeo(categories: readonly string[], count: number): PageSeo {
  return {
    title: "식재료 시세 전체 품종 · 오늘 가격",
    description: `${categories.join("·")} ${count}개 품종의 오늘 시세를 평소 가격과 견줘 카테고리별로 모았어요. KAMIS 전국 조사 시장 기준.`,
  }
}

/** P3 품종 상세. 설명에 그날 시세와 판정을 넣어 검색 결과에서 바로 답이 보이게 한다(판정은 하루 1~2번 바뀐다). */
export function varietySeo(variety: Pick<VarietySummary, "name" | "baseUnit" | "price" | "verdict" | "surveyedOn" | "basis">): PageSeo {
  const { verdict } = variety
  const judged = verdict.kind === "none" || verdict.pct == null ? "평소가는 아직 쌓이는 중" : `${verdictDiff(verdict.pct).replace(/요$/, "")} ${VERDICT_WORD[verdict.kind]}`
  return {
    title: `${variety.name} 시세 · 평소 가격`,
    description: `${variety.name}(${variety.baseUnit}) 시세 ${won(variety.price)}원, ${judged}(${monthDay(variety.surveyedOn)} ${variety.basis.source} 조사). 대형마트·전통시장은 얼마에 파는지도 견줘 보세요.`,
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
    title: `${food.name} 제철 시기`,
    description: parts.filter(Boolean).join(" "),
  }
}
