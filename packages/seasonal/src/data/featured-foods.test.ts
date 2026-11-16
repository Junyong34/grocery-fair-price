import { describe, expect, it } from "vitest"

import { MONTH_NOTES } from "./copy"
import { foodsInMonthByCategory, MONTH_NOTE_FOODS, monthHighlights, RANKINGS, seasonHighlights } from "./featured-foods"
import { findFood, foodsInMonth, foodsInSeason, isDrawn } from "./foods"
import { MONTHS } from "./months"

// 예상값은 품종 원본 food-registry.json의 제철 검증 품종에서 셌다.
describe("monthHighlights", () => {
  it("월별 문구에 등장하는 제철 품종을 가장 먼저 배치한다", () => {
    const mentioned: Record<number, string[]> = {
      1: ["굴"], 2: ["봄동"], 3: ["냉이", "달래"], 4: ["두릅"], 5: ["완두콩"],
      6: ["매실", "감자"], 7: ["열무", "수박"], 8: ["복숭아"],
      10: ["밤", "고구마"], 11: ["배추", "무"], 12: ["귤"],
    }
    for (const [month, names] of Object.entries(mentioned)) {
      expect(monthHighlights(Number(month), names.length).map((food) => food.name)).toEqual(expect.arrayContaining(names))
    }
  })

  it("그 달 품종 가운데 그림 있는 것, 그 달이 대표 달(peak)인 것, 처음부터 검증한 것(core), 제철이 짧은 것 순으로 고른다", () => {
    const all = monthHighlights(10, foodsInMonth(10).length)
    expect(all).toHaveLength(foodsInMonth(10).length)
    const keys = all.filter((food) => !["chestnut", "sweet-potato"].includes(food.id)).map((food) => [Number(!isDrawn(food.id)), Number(!(food.peak as readonly number[]).includes(10)), Number(!food.core), food.months.length])
    expect(keys).toEqual([...keys].sort((a, b) => a[0]! - b[0]! || a[1]! - b[1]! || a[2]! - b[2]! || a[3]! - b[3]!))
    // 10월 대표 20개 안에 사과·고등어·전어·감이 든다(정보누리에서 올린 품종보다 앞).
    expect(monthHighlights(10, 20).map((food) => food.name)).toEqual(expect.arrayContaining(["사과", "고등어", "전어", "감"]))
    // 사과는 10월이 시장 범위(7~11월)이자 대표 달(9~11월)이라, 대표 달이 아닌 감자(대표 6월)보다 앞이다.
    const names = all.map((food) => food.name)
    expect(names.indexOf("사과")).toBeLessThan(names.indexOf("감자"))
    expect(monthHighlights(10, 3)).toHaveLength(3)
  })
})

describe("seasonHighlights", () => {
  it("계절 대표 품종은 그림이 있는 것을 먼저, 그 계절에 대표 달(peak)이 많은 것, 오래 나는 것부터 고른다", () => {
    const autumn = seasonHighlights("autumn", 4)

    expect(autumn).toHaveLength(4)
    // 사과(대표 9~11월)와 고등어(대표 9~11월)는 가을 세 달 모두가 대표 달이고 그림도 있다.
    expect(autumn.map((food) => food.name)).toEqual(expect.arrayContaining(["사과", "고등어"]))
    expect(autumn.every((food) => foodsInSeason("autumn").includes(food))).toBe(true)
    // 그림 있는 품종이 그림 없는 품종보다 먼저다. 일러스트가 늘어도 깨지지 않게 품종 이름 대신 순서로 확인한다.
    const summer = seasonHighlights("summer", foodsInSeason("summer").length).map((food) => isDrawn(food.id))
    expect(summer).toEqual([...summer].sort((a, b) => Number(b) - Number(a)))
  })
})

describe("foodsInMonthByCategory", () => {
  it("그 달 품종을 빠짐없이 한 번씩, 정해진 카테고리 순서로 묶는다", () => {
    for (const month of [1, 6, 11]) {
      const groups = foodsInMonthByCategory(month)
      expect(groups.flatMap((group) => group.foods).map((food) => food.id).sort()).toEqual(foodsInMonth(month).map((food) => food.id).sort())
      const order = ["채소", "과일", "수산", "버섯", "곡물·견과"]
      const categories = groups.map((group) => group.category)
      expect(categories).toEqual(order.filter((category) => categories.includes(category as never)))
      for (const group of groups) {
        expect(group.foods.length).toBeGreaterThan(0)
        for (const food of group.foods) expect(food.category).toBe(group.category)
      }
    }
  })

  it("묶음 안은 그 달 대표 품종(monthHighlights) 순서다", () => {
    const highlights = monthHighlights(11, foodsInMonth(11).length).map((food) => food.id)
    for (const group of foodsInMonthByCategory(11)) {
      const ids = group.foods.map((food) => food.id)
      expect(ids).toEqual(highlights.filter((id) => ids.includes(id)))
    }
  })
})

describe("MONTH_NOTE_FOODS", () => {
  it("월별 문구에 적은 품종은 그 달 문구에 이름이 나오고 그 달 제철이다", () => {
    for (const month of MONTHS) {
      for (const id of MONTH_NOTE_FOODS[month] ?? []) {
        const food = findFood(id)
        expect(food, `${month}월 ${id}`).toBeDefined()
        expect(MONTH_NOTES[month], `${month}월 문구에 ${food!.name}`).toContain(food!.name)
        expect(food!.months, `${food!.name}는 ${month}월 제철`).toContain(month)
      }
    }
  })
})

describe("RANKINGS", () => {
  it("쓰는 곳마다 정렬 기준을 이름으로 나란히 적는다", () => {
    expect(Object.keys(RANKINGS).sort()).toEqual(["monthBoard", "printCategoryMonth", "printMonth", "printSeason", "seasonCard"])
    // 화면(이달 판·검색 설명)은 친숙도를 보지 않고, 인쇄물은 친숙도를 먼저 본다.
    expect(RANKINGS.monthBoard(10).map((key) => key.name)).not.toContain("familiarity")
    expect(RANKINGS.printMonth(10)[0]!.name).toBe("familiarity")
  })
})
