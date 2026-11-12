import { describe, expect, it } from "vitest"

import { artIdOf, parseFoodRegistry, seasonalRows, type FoodEntry } from "./food-registry"
import registryJson from "./food-registry.json"
import { FOOD_ROWS } from "./foods.generated"
import { RENAMED_FOOD_IDS } from "./renamed-foods"

const entry = (over: Partial<FoodEntry> = {}): FoodEntry => ({
  name: "무",
  aliases: [],
  category: "채소",
  months: [10, 11],
  peak: [10],
  season: "verified",
  basis: "survey",
  evidence: { sources: [] },
  ...over,
})

describe("parseFoodRegistry", () => {
  it("형식이 맞는 원본을 그대로 돌려준다", () => {
    const registry = { radish: entry() }

    expect(parseFoodRegistry(registry)).toEqual(registry)
  })

  it("품종 ID는 영문 소문자 kebab-case만 받는다", () => {
    expect(() => parseFoodRegistry({ Radish: entry() })).toThrow()
    expect(() => parseFoodRegistry({ "young radish": entry() })).toThrow()
  })

  it("달은 1~12의 겹치지 않는 오름차순만 받는다", () => {
    expect(() => parseFoodRegistry({ radish: entry({ months: [0, 10], peak: [10] }) })).toThrow()
    expect(() => parseFoodRegistry({ radish: entry({ months: [11, 10], peak: [10] }) })).toThrow()
    expect(() => parseFoodRegistry({ radish: entry({ months: [10, 10], peak: [10] }) })).toThrow()
  })

  it("대표 달은 제철 달 안에 있어야 한다", () => {
    expect(() => parseFoodRegistry({ radish: entry({ months: [10, 11], peak: [9] }) })).toThrow(/radish/)
  })

  it("제철 검증된 품종은 제철 달이 있어야 한다", () => {
    expect(() => parseFoodRegistry({ radish: entry({ months: [], peak: [] }) })).toThrow(/radish/)
    expect(() => parseFoodRegistry({ radish: entry({ months: [], peak: [], season: "unverified" }) })).not.toThrow()
  })

  it("모르는 필드는 받지 않는다", () => {
    expect(() => parseFoodRegistry({ radish: { ...entry(), tier: "verified" } })).toThrow()
  })

  it("표시명이 겹치면 받지 않는다", () => {
    expect(() => parseFoodRegistry({ radish: entry(), daikon: entry() })).toThrow(/무/)
  })
})

describe("seasonalRows", () => {
  it("제철 검증된 품종만, 이름 가나다순으로 낸다", () => {
    const rows = seasonalRows({
      radish: entry(),
      eggplant: entry({ name: "가지" }),
      lemon: entry({ name: "레몬", season: "unverified", basis: "foodnuri" }),
    })

    expect(rows.map((row) => row.id)).toEqual(["eggplant", "radish"])
  })

  it("조사로 검증한 품종만 core다", () => {
    const rows = seasonalRows({
      radish: entry(),
      mustard: entry({ name: "갓", basis: "foodnuri" }),
    })

    expect(rows).toEqual([
      { id: "mustard", name: "갓", aliases: [], category: "채소", months: [10, 11], peak: [10], core: false },
      { id: "radish", name: "무", aliases: [], category: "채소", months: [10, 11], peak: [10], core: true },
    ])
  })
})

describe("artIdOf", () => {
  it("그림 ID를 따로 적지 않으면 품종 ID와 같다", () => {
    expect(artIdOf("radish", entry())).toBe("radish")
    expect(artIdOf("prawn-kinds", entry({ art: "shrimp" }))).toBe("shrimp")
  })
})

// 저장소의 품종 원본. 손으로 고치는 한 곳이다.
describe("food-registry.json", () => {
  const registry = parseFoodRegistry(registryJson)

  it("생성 목록 foods.generated.ts가 원본과 같다", () => {
    expect(seasonalRows(registry)).toEqual(FOOD_ROWS)
  })

  it("옛 품종 ID를 다시 쓰지 않는다", () => {
    for (const old of Object.keys(RENAMED_FOOD_IDS)) expect(registry).not.toHaveProperty(old)
  })

  it("제철 보정으로 고친 품종은 사유, 출처, 확인일을 지닌다", () => {
    for (const id of ["radish", "young-radish", "black-scraper", "goby", "sardinella", "banded-grouper", "red-rockfish"]) {
      const { evidence } = registry[id]!

      expect(evidence.reason, id).toBeTruthy()
      expect(evidence.sources.length, id).toBeGreaterThan(0)
      expect(evidence.checkedAt, id).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})
