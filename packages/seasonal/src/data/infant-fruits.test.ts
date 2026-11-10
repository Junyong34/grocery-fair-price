import { describe, expect, it } from "vitest"

import {
  BABY_FRUIT_STAGES,
  BABY_FRUITS,
  findBabyFruit,
  getFruitsByStage,
  getProhibitedFoodsForStage,
  getSeasonalFruitsForStage,
  isBabyFruitSeasonal,
  isStageValid,
  PROHIBITED_FOODS,
  type BabyFruitStageId,
} from "./infant-fruits"

describe("infant-fruits domain", () => {
  it("5개의 월령 단계가 정의되어 있고 순서가 올바르다", () => {
    expect(BABY_FRUIT_STAGES).toHaveLength(5)
    const expectedIds: BabyFruitStageId[] = [
      "4-5-months",
      "6-months",
      "7-8-months",
      "9-11-months",
      "12-months",
    ]
    expect(BABY_FRUIT_STAGES.map((s) => s.id)).toEqual(expectedIds)
  })

  it("isStageValid는 올바른 slug만 판별한다", () => {
    expect(isStageValid("6-months")).toBe(true)
    expect(isStageValid("7-8-months")).toBe(true)
    expect(isStageValid("unknown")).toBe(false)
    expect(isStageValid("")).toBe(false)
  })

  it("모든 과일 데이터는 유효한 id, 이름, 첫 권장 단계, 손질법을 가지고 있다", () => {
    expect(BABY_FRUITS.length).toBeGreaterThanOrEqual(18)
    for (const fruit of BABY_FRUITS) {
      expect(fruit.id).toMatch(/^[a-z0-9-]+$/)
      expect(fruit.name.length).toBeGreaterThan(0)
      expect(fruit.prepMethod.length).toBeGreaterThan(5)
      expect(isStageValid(fruit.firstStage)).toBe(true)
      expect(["safe", "conventional", "caution"]).toContain(fruit.safetyStatus)
    }
  })

  it("사과, 배, 바나나는 6개월 단계에 속한다", () => {
    const stage6 = getFruitsByStage("6-months")
    const names = stage6.map((f) => f.name)
    expect(names).toContain("사과")
    expect(names).toContain("배")
    expect(names).toContain("바나나")
  })

  it("포도와 블루베리는 9~11개월 단계에 속하고 질식 위험(chokingRisk)이 true이다", () => {
    const grape = findBabyFruit("grape")
    const blueberry = findBabyFruit("blueberry")
    expect(grape).toBeDefined()
    expect(blueberry).toBeDefined()
    expect(grape?.chokingRisk).toBe(true)
    expect(blueberry?.chokingRisk).toBe(true)
    expect(grape?.stages).toContain("9-11-months")
    expect(grape?.cuttingGuide).toBeDefined()
  })

  it("키위, 복숭아, 파인애플은 12개월 이상에 속하고 safetyStatus가 caution이다", () => {
    const kiwi = findBabyFruit("kiwi")
    const peach = findBabyFruit("peach")
    const pineapple = findBabyFruit("pineapple")
    expect(kiwi?.stages).toContain("12-months")
    expect(peach?.stages).toContain("12-months")
    expect(pineapple?.stages).toContain("12-months")
    expect(kiwi?.safetyStatus).toBe("caution")
  })

  it("getFruitsByStage('all')은 전체 과일 목록을 반환한다", () => {
    expect(getFruitsByStage("all")).toEqual(BABY_FRUITS)
  })

  it("주의/금지 식재료에 꿀과 생우유가 돌 전 금지(before-12m)로 정의되어 있다", () => {
    const honey = PROHIBITED_FOODS.find((f) => f.id === "honey")
    const milk = PROHIBITED_FOODS.find((f) => f.id === "milk")
    expect(honey).toBeDefined()
    expect(honey?.targetStage).toBe("before-12m")
    expect(honey?.severity).toBe("forbidden")
    expect(honey?.reason).toContain("보툴리누스")

    expect(milk).toBeDefined()
    expect(milk?.targetStage).toBe("before-12m")
    expect(milk?.severity).toBe("forbidden")
  })

  it("getProhibitedFoodsForStage는 해당 월령에 위험한 식재료만 반환한다", () => {
    const forStage6 = getProhibitedFoodsForStage("6-months")
    const ids = forStage6.map((f) => f.id)
    expect(ids).toContain("honey")
    expect(ids).toContain("milk")
    expect(ids).toContain("juice")

    // 12개월 이상에는 돌 전 금지인 꿀·생우유가 아닌, 견과류·첨가당 등이 주의로 나옴
    const forStage12 = getProhibitedFoodsForStage("12-months")
    const ids12 = forStage12.map((f) => f.id)
    expect(ids12).not.toContain("honey")
    expect(ids12).toContain("whole-nuts")
    expect(ids12).toContain("added-sugar")
  })

  it("제철 과일 판정(isBabyFruitSeasonal)이 10월 사과/배에 대해 true를 반환한다", () => {
    const apple = findBabyFruit("apple")!
    const watermelon = findBabyFruit("watermelon")!
    expect(isBabyFruitSeasonal(apple, 10)).toBe(true)
    expect(isBabyFruitSeasonal(watermelon, 10)).toBe(false)
  })

  it("getSeasonalFruitsForStage는 해당 단계 과일 중 그 달에 제철인 것만 반환한다", () => {
    const seasonalInOct = getSeasonalFruitsForStage("6-months", 10)
    const names = seasonalInOct.map((f) => f.name)
    expect(names).toContain("사과")
    expect(names).toContain("배")
    expect(names).not.toContain("수박")
  })
})
