import { describe, expect, it } from "vitest"

import { FESTIVALS } from "@workspace/seasonal/data/festivals"
import { findFood, FOODS } from "@workspace/seasonal/data/foods"
import { MONTHS } from "@workspace/seasonal/data/months"
import { SEASONS } from "@workspace/seasonal/data/seasons"

import { festivalSeo, foodSeo, homeSeo, monthSeo, monthsIndexSeo, seasonSeo, seasonsIndexSeo } from "./titles"

const all = [
  homeSeo(),
  monthsIndexSeo(),
  ...MONTHS.map(monthSeo),
  seasonsIndexSeo(),
  ...SEASONS.map(seasonSeo),
  ...FESTIVALS.map(({ slug }) => festivalSeo(slug)),
  ...FOODS.map(foodSeo),
]

describe("페이지 제목·설명", () => {
  it("검색어 모양의 제목을 만든다", () => {
    expect(homeSeo().title).toBe("제철 음식 달력")
    expect(monthsIndexSeo().title).toBe("월별 제철 음식")
    expect(monthSeo(3).title).toBe("3월 제철 음식")
    expect(seasonsIndexSeo().title).toBe("계절별 제철 음식")
    expect(seasonSeo("spring").title).toBe("봄 제철 음식")
    expect(festivalSeo("chuseok").title).toBe("추석 음식")
    expect(foodSeo(findFood("snow-crab")!).title).toBe("대게 제철 시기")
  })

  it("제목과 설명은 페이지마다 다르다", () => {
    expect(new Set(all.map((seo) => seo.title)).size).toBe(all.length)
    expect(new Set(all.map((seo) => seo.description)).size).toBe(all.length)
  })

  it("설명은 검색 결과에서 잘리지 않을 길이다", () => {
    for (const { description } of all) expect(description.length).toBeLessThanOrEqual(120)
  })

  it("품종 설명에 제철 달과 다른 이름을 넣는다", () => {
    expect(foodSeo(findFood("snow-crab")!).description).toContain("제철은 12~5월이에요")
    expect(foodSeo(findFood("olive-flounder")!).description).toContain("광어(넙치)")
  })

  it("품종 설명은 관련 명절이 있을 때만 명절 이름을 넣는다", () => {
    // 설날이 대게를 그 무렵 제철 품종으로 꼽는다(festivals.ts).
    expect(foodSeo(findFood("snow-crab")!).description).toContain("설날 무렵")
    expect(foodSeo(findFood("olive-flounder")!).description).not.toContain("무렵")
  })

  it("달·계절 설명에 대표 품종 이름을 넣는다", () => {
    expect(monthSeo(3).description).toMatch(/냉이|달래/)
    expect(seasonSeo("autumn").description).toMatch(/사과|고등어/)
  })

  it("명절 설명에 전통 음식을 넣는다", () => {
    expect(festivalSeo("seollal").description).toContain("떡국")
  })
})
