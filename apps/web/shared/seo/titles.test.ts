import { describe, expect, it } from "vitest"

import { FESTIVALS } from "@workspace/seasonal/data/festivals"
import { findFood, FOODS } from "@workspace/seasonal/data/foods"
import { MONTHS } from "@workspace/seasonal/data/months"
import { SEASONS } from "@workspace/seasonal/data/seasons"

import {
  downloadsSeo,
  editionSeoTitle,
  festivalSeo,
  foodSeo,
  homeSeo,
  seasonalHomeSeo,
  monthSeo,
  monthsIndexSeo,
  sashimiSeo,
  seasonSeo,
  seasonsIndexSeo,
  varietiesIndexSeo,
  varietySeo,
} from "./titles"

const all = [
  homeSeo(),
  seasonalHomeSeo(),
  downloadsSeo(),
  monthsIndexSeo(),
  ...MONTHS.map(monthSeo),
  seasonsIndexSeo(),
  ...SEASONS.map(seasonSeo),
  ...FESTIVALS.map(({ slug }) => festivalSeo(slug)),
  ...FOODS.map(foodSeo),
  ...MONTHS.map(sashimiSeo),
]

describe("페이지 제목·설명", () => {
  it("검색어 모양의 제목을 만든다", () => {
    expect(homeSeo().title).toBe("오늘 식재료 시세 · 지금 사도 될까")
    expect(seasonalHomeSeo().title).toBe("제철 음식 달력")
    expect(downloadsSeo().title).toBe("제철 음식 달력 무료 다운로드 · A4 PDF")
    expect(monthsIndexSeo().title).toBe("월별 제철 음식")
    expect(monthSeo(3).title).toBe("3월 제철 음식")
    expect(seasonsIndexSeo().title).toBe("계절별 제철 음식")
    expect(seasonSeo("spring").title).toBe("봄 제철 음식")
    expect(festivalSeo("chuseok").title).toBe("추석 음식")
    expect(sashimiSeo(12).title).toBe("12월 제철 회")
    expect(foodSeo(findFood("snow-crab")!).title).toBe("대게 제철 시기")
  })

  it('인쇄물 제목에 "제철"이 없으면 "제철 음식"을 앞에 붙인다(철강 "제철"과 헷갈리지 않게)', () => {
    expect(editionSeoTitle("2026년도 월간 달력")).toBe(
      "제철 음식 2026년도 월간 달력 PDF 무료 다운로드"
    )
    expect(editionSeoTitle("열두 달 월별 제철 포스터")).toBe(
      "열두 달 월별 제철 포스터 PDF 무료 다운로드"
    )
  })

  it("품종 상세 설명에 그날 시세와 판정을 넣는다", () => {
    const base = { name: "녹두", baseUnit: "100g", price: 2700, surveyedOn: "2026-11-03", basis: { source: "KAMIS", scope: "전국 조사 시장" } }
    expect(varietySeo({ ...base, verdict: { kind: "pricey", pct: 9 } }).description).toBe(
      "녹두(100g) 시세 2,700원, 평소보다 9% 높아 비싸요(11/3 KAMIS 조사). 대형마트·전통시장은 얼마에 파는지도 견줘 보세요."
    )
    expect(varietySeo({ ...base, verdict: { kind: "none", pct: null } }).description).toContain("평소가는 아직 쌓이는 중(11/3 KAMIS 조사)")
  })

  it("품종 허브 설명에 카테고리 이름과 품종 수를 넣는다", () => {
    const seo = varietiesIndexSeo(["채소", "과일"], 127)
    expect(seo.title).toBe("식재료 시세 전체 품종 · 오늘 가격")
    expect(seo.description).toContain("채소·과일 127개 품종")
  })

  it("다운로드 설명에 무료 제공과 파일 형식을 안내한다", () => {
    expect(downloadsSeo().description).toContain("무료 다운로드")
    expect(downloadsSeo().description).toContain("A4 PDF")
  })

  it("제목과 설명은 페이지마다 다르다", () => {
    expect(new Set(all.map((seo) => seo.title)).size).toBe(all.length)
    expect(new Set(all.map((seo) => seo.description)).size).toBe(all.length)
  })

  it("설명은 검색 결과에서 잘리지 않을 길이다", () => {
    for (const { description } of all)
      expect(description.length).toBeLessThanOrEqual(120)
  })

  it("품종 설명에 제철 달과 다른 이름을 넣는다", () => {
    expect(foodSeo(findFood("snow-crab")!).description).toContain(
      "제철은 12~5월이에요"
    )
    expect(foodSeo(findFood("olive-flounder")!).description).toContain(
      "광어(넙치)"
    )
  })

  it("품종 설명은 관련 명절이 있을 때만 명절 이름을 넣는다", () => {
    // 설날이 대게를 그 무렵 제철 품종으로 꼽는다(festivals.ts).
    expect(foodSeo(findFood("snow-crab")!).description).toContain("설날 무렵")
    expect(foodSeo(findFood("olive-flounder")!).description).not.toContain(
      "무렵"
    )
  })

  it("달·계절 설명에 대표 품종 이름을 넣는다", () => {
    expect(monthSeo(3).description).toMatch(/냉이|달래/)
    expect(seasonSeo("autumn").description).toMatch(/사과|고등어/)
  })

  it("제철 회 설명에 그 달 횟감 이름을 넣는다", () => {
    expect(sashimiSeo(12).description).toContain("방어")
  })

  it("명절 설명에 전통 음식을 넣는다", () => {
    expect(festivalSeo("seollal").description).toContain("떡국")
  })
})
