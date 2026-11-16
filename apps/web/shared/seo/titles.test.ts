import { describe, expect, it } from "vitest"

import { explainVerdict } from "@workspace/price/verdict-copy"
import { FESTIVALS } from "@workspace/seasonal/data/festivals"
import { FOOD_CONTENT } from "@workspace/seasonal/data/food-content.generated"
import { findFood, FOODS } from "@workspace/seasonal/data/foods"
import { findPairing, PAIRINGS } from "@workspace/seasonal/data/infant-pairings"
import { MONTHS } from "@workspace/seasonal/data/months"
import { SEASONS } from "@workspace/seasonal/data/seasons"

import {
  babyFoodIngredientSeo,
  babyFoodPairingsSeo,
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
  productCategorySeo,
  productSeo,
  productsSeo,
  varietySeo,
} from "./titles"

const all = [
  homeSeo(),
  productsSeo(),
  productCategorySeo({ name: "김치·반찬·통조림", count: 120, items: ["즉석밥·죽", "냉동만두", "참치 통조림", "단무지·절임", "김치"] }),
  productCategorySeo({ name: "라면·면", count: 31, items: ["라면", "국수"] }),
  seasonalHomeSeo(),
  downloadsSeo(),
  babyFoodPairingsSeo(31),
  ...PAIRINGS.map(babyFoodIngredientSeo),
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
    expect(downloadsSeo().title).toBe("제철 달력·포스터·이유식 자료 무료 다운로드 · A4 PDF")
    expect(babyFoodPairingsSeo(31).title).toBe("이유식 재료 궁합표 · 잘 맞는 조합과 상극 재료")
    expect(monthsIndexSeo().title).toBe("월별 제철 음식")
    expect(monthSeo(3).title).toMatch(/^3월 제철 음식 \d+가지$/)
    expect(seasonsIndexSeo().title).toBe("계절별 제철 음식")
    expect(seasonSeo("spring").title).toBe("봄 제철 음식")
    expect(festivalSeo("chuseok").title).toBe("추석 음식")
    expect(sashimiSeo(12).title).toBe("12월 제철 회")
    expect(foodSeo(findFood("snow-crab")!).title).toBe("대게 제철 시기 · 12~5월")
  })

  it('달력·포스터 이름에 "제철"이 없을 때만 검색 제목 앞에 "제철 음식"을 붙인다', () => {
    expect(editionSeoTitle("2026년도 월간 달력", "monthly")).toBe(
      "제철 음식 2026년도 월간 달력 PDF 무료 다운로드"
    )
    expect(editionSeoTitle("열두 달 월별 제철 포스터", "month-poster")).toBe(
      "열두 달 월별 제철 포스터 PDF 무료 다운로드"
    )
    expect(editionSeoTitle("월령별 과일 시기 도감", "baby-food-fruits")).toBe(
      "월령별 과일 시기 도감 PDF 무료 다운로드"
    )
  })

  it("품종 상세 설명은 판정 풀이의 검색 설명이다(문장은 verdict-copy.test.ts에서 확인)", () => {
    const variety = { name: "녹두", baseUnit: "100g", price: 2700, usual: 2480, verdict: { kind: "pricey", pct: 9 }, surveyedOn: "2026-11-03", sampleSize: 40, stale: false, meetsMinN: true, basis: { source: "KAMIS", scope: "전국 조사 시장" } } as const
    expect(varietySeo(variety).description).toBe(explainVerdict(variety, null).seoDescription)
  })

  it("상품 상세는 판정 없이 판매가와 판매처 수를 넣는다", () => {
    const seo = productSeo({ name: "비비고 사골곰탕(500g)", price: 1980, surveyedOn: "2026-10-23", sellers: [{}, {}, {}] })
    expect(seo.title).toBe("비비고 사골곰탕(500g) 가격 비교")
    expect(seo.description).toBe(
      "비비고 사골곰탕(500g) 전국 판매가 1,980원(10/23 참가격 조사). 이마트·편의점 등 판매처 3곳 가격을 견줘 보세요."
    )
  })

  it("재료별 이유식 궁합은 O·X 수와 앞의 재료 이름을 넣는다", () => {
    const beef = babyFoodIngredientSeo(findPairing("beef")!)
    expect(beef.title).toBe("소고기 이유식 궁합 · 잘 맞는 재료와 상극 재료")
    expect(beef.description).toBe("소고기 이유식에 잘 맞는 재료는 브로콜리·시금치·비타민 등 16가지, 주의할 재료는 부추·밤·고구마예요. 이유식 조합을 고를 때 참고하세요.")
    const onion = babyFoodIngredientSeo(findPairing("onion")!)
    expect(onion.title).toBe("양파 이유식 궁합 · 잘 맞는 재료 8가지")
    expect(onion.description).not.toContain("주의할 재료")
    expect(babyFoodIngredientSeo(findPairing("broccoli")!).title).toContain("브로콜리·콜리플라워 이유식 궁합")
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

  it("품종 설명은 조사 원고의 한 줄 소개를 쓰고, 다른 이름을 첫 품종명 뒤에 붙인다", () => {
    expect(foodSeo(findFood("persimmon")!).description).toBe(FOOD_CONTENT.persimmon!.summary)
    // 소개문에 다른 이름이 없으면 붙이고, 이미 있으면(광어 소개의 "표준명 넙치") 그대로 둔다.
    const ashitaba = foodSeo(findFood("ashitaba")!).description
    expect(ashitaba).toMatch(/^신선초\(명일엽\)는 /)
    expect(ashitaba.replace("신선초(명일엽)", "신선초")).toBe(FOOD_CONTENT.ashitaba!.summary)
    expect(foodSeo(findFood("olive-flounder")!).description).toBe(FOOD_CONTENT["olive-flounder"]!.summary)
  })

  it("원고가 없는 품종은 제철 달과 같은 때 제철 품종으로 설명을 만든다", () => {
    const goedorachi = findFood("goedorachi")!
    expect(FOOD_CONTENT[goedorachi.id]).toBeUndefined()
    expect(foodSeo(goedorachi).description).toMatch(/^괴도라치 제철은 \d+월이에요\./)
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
