import { describe, expect, it } from "vitest"

import { bestMonth, familiarity } from "../data/food-familiarity"
import { findFood, foodsInMonth, isDrawn, isPeak } from "../data/foods"
import { MONTHS } from "../data/months"
import { SEASONS, startSeason } from "../data/seasons"
import { chartFoods, monthChecklist, monthPictures, seasonPictures, stripFoods, yearPictures } from "./foods"
import { DEFAULT_SPECS } from "./spec"

const monthly = DEFAULT_SPECS.monthly
const poster = DEFAULT_SPECS["month-poster"]
const yearSheet = DEFAULT_SPECS["year-sheet"]
const seasonPoster = DEFAULT_SPECS["season-poster"]
const withMax = <S extends { foods: { names: "korean" | "hidden"; max: number } }>(spec: S, max: number): S => ({ ...spec, foods: { ...spec.foods, max } })

describe("startSeason", () => {
  it("해를 넘는 제철은 시작하는 달의 계절이다", () => {
    expect(startSeason([1, 2, 11, 12])).toBe("autumn")
    expect(startSeason([12, 1, 2, 3, 4])).toBe("winter")
    expect(startSeason([6, 7, 8])).toBe("summer")
  })
})

describe("monthPictures", () => {
  it("그림이 있는 그 달 제철 품종을 사양의 max개까지 고른다", () => {
    const foods = monthPictures(withMax(monthly, 5), 10)
    expect(foods).toHaveLength(5)
    expect(foods.every((food) => isDrawn(food.id) && (food.months as readonly number[]).includes(10))).toBe(true)
  })

  it("대표 달(peak) 품종 먼저, 그 안에서는 친숙한(등급이 낮은) 품종부터", () => {
    for (const month of MONTHS) {
      const foods = monthPictures(withMax(monthly, 40), month)
      const keys = foods.map((food) => [Number(!isPeak(food, month)), familiarity(food.id)] as const)
      expect(keys, `${month}월`).toEqual([...keys].sort((a, b) => a[0] - b[0] || a[1] - b[1]))
    }
  })

  it("1월 그림 칸 여덟에 딸기·굴·시금치처럼 흔한 품종이 들어간다", () => {
    const names = monthPictures(withMax(monthly, 8), 1).map((food) => food.name)
    expect(names).toEqual(expect.arrayContaining(["딸기", "굴", "시금치", "광어"]))
    expect(names).not.toContain("매생이")
  })

  it("월간 그림 없음(M-A none)은 빈 목록이다", () => {
    expect(monthPictures({ ...monthly, layout: "none" }, 1)).toEqual([])
  })

  it("월별 포스터 원판(P-C)은 조각마다 넷, P-D 줄은 여섯을 넘지 않는다", () => {
    for (const month of MONTHS) {
      expect(monthPictures({ ...withMax(poster, 40), layout: "wheel" }, month).length).toBeLessThanOrEqual(4)
      expect(monthPictures({ ...withMax(poster, 40), layout: "rows-check" }, month).length).toBeLessThanOrEqual(6)
    }
    expect(monthPictures({ ...withMax(poster, 2), layout: "wheel" }, 10)).toHaveLength(2)
  })

  it("월별 포스터는 고른 카테고리만 넣는다", () => {
    const foods = monthPictures({ ...withMax(poster, 30), categories: ["수산"] }, 10)
    expect(foods.length).toBeGreaterThan(0)
    expect(foods.every((food) => food.category === "수산")).toBe(true)
  })
})

describe("monthChecklist", () => {
  it("그 달 품종을 그림과 상관없이 20개까지 담는다(M-B, 메모 eaten-check, P-D)", () => {
    for (const month of MONTHS) {
      const list = monthChecklist(monthly, month)
      expect(list).toHaveLength(Math.min(20, foodsInMonth(month).length))
      expect(list.every((food) => foodsInMonth(month).includes(food))).toBe(true)
    }
  })

  it("그림 칸과 같은 차례로 놓는다(그림 있는 품종만 보면 그림 칸 순서와 같다)", () => {
    const pictures = monthPictures(withMax(monthly, 5), 4)
    expect(monthChecklist(monthly, 4).filter((food) => isDrawn(food.id)).slice(0, pictures.length)).toEqual(pictures)
  })

  it("월별 포스터는 고른 카테고리만", () => {
    const [category] = new Set(foodsInMonth(10).map((food) => food.category))
    expect(monthChecklist({ ...poster, categories: [category!] }, 10).every((food) => food.category === category)).toBe(true)
  })
})

describe("stripFoods", () => {
  const spec = (year: number, weekStart: 0 | 1) => ({ ...monthly, layout: "strip" as const, year, calendar: { ...monthly.calendar, weekStart } })

  it("띠 14개를 먼저 채우고, 남은 품종을 1일 앞·말일 뒤 빈 칸 수만큼 넣는다", () => {
    // 2027년 11월 1일은 월요일이다. 일요일 시작이면 앞 1칸, 30일 뒤 4칸이 빈다.
    const { strip, blanks, dropped } = stripFoods(spec(2027, 0), 11)
    const all = monthPictures(withMax(monthly, 40), 11)
    expect(strip).toEqual(all.slice(0, 14))
    expect(blanks).toEqual(all.slice(14, 19))
    expect(dropped).toBe(foodsInMonth(11).filter((food) => isDrawn(food.id)).length - 19)
  })

  it("2027년 모든 달·주 시작에서 띠 14개는 늘 찬다(한 달 제철이 가장 적은 1·2월도 31개)", () => {
    for (const weekStart of [0, 1] as const) for (const month of MONTHS) expect(stripFoods(spec(2027, weekStart), month).strip, `${month}월 주 시작 ${weekStart}`).toHaveLength(14)
  })
})

describe("yearPictures", () => {
  it("품종을 최적 달(bestMonth)에만 놓고, 그 달 안에서는 친숙한 품종부터 고른다", () => {
    yearPictures(withMax(yearSheet, 8)).forEach((foods, index) => {
      foods.forEach((food) => expect(bestMonth(food), food.name).toBe(MONTHS[index]))
      const grades = foods.map((food) => familiarity(food.id))
      expect(grades).toEqual([...grades].sort((a, b) => a - b))
    })
  })

  it("연간 Y-A(달마다 여덟) 1월에 딸기·굴·시금치, 12월에 귤이 있고 같은 품종은 두 번 나오지 않는다", () => {
    const byMonth = yearPictures(withMax(yearSheet, 8)).map((foods) => foods.map((food) => food.name))
    expect(byMonth[0]).toEqual(expect.arrayContaining(["딸기", "굴", "시금치"]))
    expect(byMonth[11]).toContain("귤")
    const all = byMonth.flat()
    expect(new Set(all).size).toBe(all.length)
  })

  it("Y-B 큰 그림과 월간 표지 C-1은 달마다 하나, C-2는 둘이고 빈 달이 없다", () => {
    for (const picks of [yearPictures({ ...yearSheet, layout: "hero-top" }), yearPictures({ ...monthly, cover: "year" })]) expect(picks.map((foods) => foods.length)).toEqual(MONTHS.map(() => 1))
    for (const [index, foods] of yearPictures({ ...monthly, cover: "months" }).entries()) expect(foods.length, `${index + 1}월`).toBe(2)
  })

  it("연간 Y-A 달별 품종(등급을 고치면 이 표를 보고 갱신한다)", () => {
    const table = yearPictures(withMax(yearSheet, 8)).map((foods, index) => `${index + 1}월: ${foods.map((food) => food.name).join(" ")}`)
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
})

describe("chartFoods", () => {
  it("한 품종은 한 번, 달마다 막대표는 여섯·연간 Y-C는 넷까지", () => {
    for (const [spec, perMonth] of [
      [poster, 6],
      [{ ...monthly, cover: "chart" as const }, 6],
      [{ ...yearSheet, layout: "chart" as const }, 4],
    ] as const) {
      const foods = chartFoods(spec)
      expect(new Set(foods).size).toBe(foods.length)
      for (const month of MONTHS) expect(foods.filter((food) => bestMonth(food) === month).length).toBeLessThanOrEqual(perMonth)
    }
  })
})

describe("seasonPictures", () => {
  it("한 품종은 네 계절 가운데 한 곳에만 나온다", () => {
    const ids = SEASONS.flatMap((season) => seasonPictures(withMax(seasonPoster, 40), season).map((food) => food.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("시장 범위(8~10월)는 여름에 시작해도 대표 달(9·10월)이 가을인 배는 가을에 들어간다", () => {
    const pear = findFood("pear")!
    expect(startSeason(pear.months)).toBe("summer")
    expect(seasonPictures(withMax(seasonPoster, 40), "autumn")).toContain(pear)
    expect(seasonPictures(withMax(seasonPoster, 40), "summer")).not.toContain(pear)
  })

  it("품종이 max보다 많으면 그 계절에 대표 달이 많은 품종을 남기고, 시작 달 순으로 놓는다", () => {
    const all = seasonPictures(withMax(seasonPoster, 40), "autumn")
    const few = seasonPictures(withMax(seasonPoster, 8), "autumn")
    expect(few).toHaveLength(8)
    const peaksIn = (food: (typeof all)[number]) => food.peak.filter((month) => [9, 10, 11].includes(month)).length
    const cut = Math.min(...few.map(peaksIn))
    expect(all.filter((food) => !few.includes(food)).every((food) => peaksIn(food) <= cut)).toBe(true)
    const starts = few.map((food) => Math.min(...food.peak.filter((month) => [9, 10, 11].includes(month))))
    expect(starts).toEqual([...starts].sort((a, b) => a - b))
  })
})
