import { describe, expect, it } from "vitest"

import { bestMonth, familiarity } from "../data/food-familiarity"
import { findFood, foodsInMonth, isDrawn } from "../data/foods"
import { SEASONS } from "../data/seasons"
import { MONTHS } from "../data/months"
import { CHECKLIST_MAX, monthChecklist, monthFoods, seasonFoods, startSeason, stripFoods, yearFoods, yearFoodsByMonth } from "./foods"

describe("startSeason", () => {
  it("해를 넘는 제철은 시작하는 달의 계절이다", () => {
    expect(startSeason([1, 2, 11, 12])).toBe("autumn")
    expect(startSeason([12, 1, 2, 3, 4])).toBe("winter")
    expect(startSeason([6, 7, 8])).toBe("summer")
  })
})

describe("monthFoods", () => {
  it("그림이 있는 품종만, 상한만큼, 그 달 제철 품종을 고른다", () => {
    const foods = monthFoods(10, { max: 5, categories: [] })
    expect(foods.length).toBeLessThanOrEqual(5)
    expect(foods.every((food) => isDrawn(food.id) && (food.months as readonly number[]).includes(10))).toBe(true)
  })

  it("대표 달(peak) 품종 먼저, 그 안에서는 친숙한(등급이 낮은) 품종부터", () => {
    for (const month of MONTHS) {
      const foods = monthFoods(month, { max: Infinity, categories: [] })
      const keys = foods.map((food) => [Number(!(food.peak as readonly number[]).includes(month)), familiarity(food.id)] as const)
      const sorted = [...keys].sort((a, b) => a[0] - b[0] || a[1] - b[1])
      expect(keys, `${month}월`).toEqual(sorted)
    }
  })

  it("1월 그림 칸 여덟에 딸기·굴·시금치처럼 흔한 품종이 들어간다", () => {
    const names = monthFoods(1, { max: 8, categories: [] }).map((food) => food.name)
    expect(names).toEqual(expect.arrayContaining(["딸기", "굴", "시금치", "광어"]))
    expect(names).not.toContain("매생이")
  })

  it("카테고리를 고르면 그 카테고리만 넣는다", () => {
    const foods = monthFoods(10, { max: 30, categories: ["수산"] })
    expect(foods.length).toBeGreaterThan(0)
    expect(foods.every((food) => food.category === "수산")).toBe(true)
  })
})

describe("yearFoods", () => {
  it("열두 달에서 서로 다른 품종을 한 달에 하나씩 고른다", () => {
    const foods = yearFoods({ max: 1, categories: [] })
    const ids = foods.map((food) => food.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.length).toBe(MONTHS.length)
  })

  it("고른 품종은 모두 그 달의 제철 품종이다", () => {
    const foods = yearFoods({ max: 1, categories: [] })
    foods.forEach((food, index) => expect(food.months as readonly number[]).toContain(MONTHS[index]))
  })
})

describe("yearFoodsByMonth", () => {
  it("품종을 최적 달(bestMonth)에만 놓고, 그 달 안에서는 친숙한 품종부터 고른다", () => {
    yearFoodsByMonth({ max: 8, categories: [] }).forEach((foods, index) => {
      foods.forEach((food) => expect(bestMonth(food), food.name).toBe(MONTHS[index]))
      const grades = foods.map((food) => familiarity(food.id))
      expect(grades).toEqual([...grades].sort((a, b) => a - b))
    })
  })

  it("연간 Y-A(달마다 여덟) 1월에 딸기·굴·시금치, 12월에 귤이 있고 같은 품종은 두 번 나오지 않는다", () => {
    const byMonth = yearFoodsByMonth({ max: 8, categories: [] }).map((foods) => foods.map((food) => food.name))
    expect(byMonth[0]).toEqual(expect.arrayContaining(["딸기", "굴", "시금치"]))
    expect(byMonth[11]).toContain("귤")
    const all = byMonth.flat()
    expect(new Set(all).size).toBe(all.length)
  })

  it("연간 Y-A 달별 품종(등급을 고치면 이 표를 보고 갱신한다)", () => {
    const table = yearFoodsByMonth({ max: 8, categories: [] }).map((foods, index) => `${index + 1}월: ${foods.map((food) => food.name).join(" ")}`)
    expect(table).toMatchInlineSnapshot(`
      [
        "1월: 시금치 굴 딸기 우엉 레드향 방울양배추 매생이 아귀",
        "2월: 홍합 광어 한라봉 봄동 유채나물 천혜향 연근 동해한치",
        "3월: 바지락 냉이 달래 미나리 봄 도다리 쑥 주꾸미 취나물",
        "4월: 마늘 낙지 두릅 아스파라거스 멍게 머위 씀바귀 고사리",
        "5월: 참외 양배추 상추 완두콩 쪽파 마늘종 쑥갓 죽순",
        "6월: 블루베리 오이 감자 애호박 방울토마토 살구 농어 매실",
        "7월: 자두 수박 옥수수 토마토 전복 양파 민어 바다장어",
        "8월: 오징어 복숭아 포도 가지 부추 참나물 홍고추 치커리",
        "9월: 대하 표고버섯 밤 배 조기 무화과 전어 대추",
        "10월: 고구마 무 사과 꽃게 갈치 대파 꽁치 우럭",
        "11월: 배추 감 고등어 단호박 파프리카 유자 과메기 참돔",
        "12월: 귤 당근 키위 브로콜리 명태 방어 대게 대구",
      ]
    `)
  })

  it("yearFoods와 같은 품종을 달마다 묶는다(1월부터 열두 묶음)", () => {
    const byMonth = yearFoodsByMonth({ max: 2, categories: [] })
    expect(byMonth).toHaveLength(MONTHS.length)
    expect(byMonth.flat()).toEqual(yearFoods({ max: 2, categories: [] }))
    byMonth.forEach((foods, index) => foods.forEach((food) => expect(food.months as readonly number[]).toContain(MONTHS[index])))
  })

  it("표지 열두 달 미리보기(달마다 둘)에서 빈 달이 없다", () => {
    for (const [index, foods] of yearFoodsByMonth({ max: 2, categories: [] }).entries()) expect(foods.length, `${index + 1}월`).toBeGreaterThan(0)
  })
})

describe("seasonFoods", () => {
  it("한 품종은 네 계절 가운데 한 곳에만 나온다", () => {
    const ids = SEASONS.flatMap((season) => seasonFoods(season, { max: 99, categories: [] }).map((food) => food.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("시장 범위(8~10월)는 여름에 시작해도 대표 달(9·10월)이 가을인 배는 가을에 들어간다", () => {
    const pear = findFood("pear")!
    expect(startSeason(pear.months)).toBe("summer")
    expect(startSeason(pear.peak)).toBe("autumn")
    expect(seasonFoods("autumn", { max: 99, categories: [] })).toContain(pear)
    expect(seasonFoods("summer", { max: 99, categories: [] })).not.toContain(pear)
  })

  it("품종이 max보다 많으면 그 계절에 대표 달이 많은 품종을 남기고, 시작 달 순으로 놓는다", () => {
    const all = seasonFoods("autumn", { max: 99, categories: [] })
    const few = seasonFoods("autumn", { max: 8, categories: [] })
    expect(few).toHaveLength(8)
    const peaksIn = (food: (typeof all)[number]) => food.peak.filter((month) => [9, 10, 11].includes(month)).length
    const cut = Math.min(...few.map(peaksIn))
    expect(all.filter((food) => !few.includes(food)).every((food) => peaksIn(food) <= cut)).toBe(true)
    const starts = few.map((food) => Math.min(...food.peak.filter((month) => [9, 10, 11].includes(month))))
    expect(starts).toEqual([...starts].sort((a, b) => a - b))
  })
})

describe("monthChecklist", () => {
  it("그 달 품종을 그림과 상관없이 CHECKLIST_MAX개까지 담는다(이름만 적는 체크 목록)", () => {
    for (const month of MONTHS) {
      const list = monthChecklist(month, [])
      expect(list).toHaveLength(Math.min(CHECKLIST_MAX, foodsInMonth(month).length))
      expect(list.every((food) => foodsInMonth(month).includes(food))).toBe(true)
    }
  })

  it("대표 달(peak)이 그 달인 품종을 먼저 적는다", () => {
    const peaks = monthChecklist(10, []).map((food) => (food.peak as readonly number[]).includes(10))
    expect(peaks).toEqual([...peaks].sort((a, b) => Number(b) - Number(a)))
  })

  it("그림 칸과 같은 차례로 놓는다(그림 있는 품종만 보면 그림 칸 순서와 같다)", () => {
    const pictures = monthFoods(4, { max: 5, categories: [] })
    const list = monthChecklist(4, [])
    expect(list.filter((food) => isDrawn(food.id)).slice(0, pictures.length)).toEqual(pictures)
  })

  it("카테고리를 고르면 그 카테고리만", () => {
    const [category] = new Set(foodsInMonth(10).map((food) => food.category))
    expect(monthChecklist(10, [category!]).every((food) => food.category === category)).toBe(true)
  })
})

describe("stripFoods", () => {
  it("띠에 먼저 채우고, 남은 품종을 1일 앞·말일 뒤 빈 칸 수만큼 넣는다", () => {
    // 2027년 11월 1일은 월요일이다. 일요일 시작이면 앞 1칸, 30일 뒤 4칸이 빈다.
    const { strip, blanks, dropped } = stripFoods({ year: 2027, month: 11, weekStart: 0, stripSize: 3 })
    expect(strip).toEqual(monthFoods(11, { max: 3, categories: [] }))
    expect(blanks).toEqual(monthFoods(11, { max: Infinity, categories: [] }).slice(3, 8))
    expect(dropped).toBe(monthFoods(11, { max: Infinity, categories: [] }).length - 8)
  })

  it("2027년 모든 달·주 시작에서 띠 14개는 늘 찬다(한 달 제철이 가장 적은 1·2월도 31개)", () => {
    for (const weekStart of [0, 1] as const)
      for (const month of MONTHS) expect(stripFoods({ year: 2027, month, weekStart, stripSize: 14 }).strip, `${month}월 주 시작 ${weekStart}`).toHaveLength(14)
  })

  it("품종이 띠보다 적으면 빈 칸에는 넣지 않는다", () => {
    const { strip, blanks } = stripFoods({ year: 2027, month: 2, weekStart: 0, stripSize: 40 })
    expect(strip).toHaveLength(monthFoods(2, { max: Infinity, categories: [] }).length)
    expect(blanks).toEqual([])
  })
})
