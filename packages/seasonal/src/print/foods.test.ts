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

  it("친숙한(등급이 낮은) 품종 먼저, 같은 등급 안에서는 대표 달(peak) 품종부터", () => {
    for (const month of MONTHS) {
      const foods = monthPictures(withMax(monthly, 40), month)
      const keys = foods.map((food) => [familiarity(food.id), Number(!isPeak(food, month))] as const)
      expect(keys, `${month}월`).toEqual([...keys].sort((a, b) => a[0] - b[0] || a[1] - b[1]))
    }
  })

  it("1월 그림 칸 여덟에 딸기·시금치·광어처럼 흔한 품종이 들어간다", () => {
    const names = monthPictures(withMax(monthly, 8), 1).map((food) => food.name)
    expect(names).toEqual(expect.arrayContaining(["딸기", "시금치", "광어"]))
    expect(names).not.toContain("매생이")
  })

  it("월간 그림 없음(M-A none)은 빈 목록이다", () => {
    expect(monthPictures({ ...monthly, layout: "none" }, 1)).toEqual([])
  })

  it.each(["wheel", "rows-check"] as const)("월별 포스터 %s도 달마다 설정한 24개까지 담는다", (layout) => {
    for (const month of MONTHS) {
      const available = foodsInMonth(month).filter((food) => isDrawn(food.id))
      expect(monthPictures({ ...withMax(poster, 24), layout }, month)).toHaveLength(Math.min(24, available.length))
    }
    expect(monthPictures({ ...withMax(poster, 2), layout }, 10)).toHaveLength(2)
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

describe.each([
  ["seafood", "수산"],
  ["fruit", "과일"],
] as const)("yearPictures %s 구성", (layout, category) => {
  const spec = { ...yearSheet, layout } satisfies typeof yearSheet

  it("달마다 해당 카테고리의 제철 그림만 최대 여덟 싣고 여러 달이 제철인 품종은 반복한다", () => {
    const months = yearPictures(withMax(spec, 12))
    MONTHS.forEach((month, index) => {
      const foods = months[index]!
      const available = foodsInMonth(month).filter((food) => food.category === category && isDrawn(food.id))
      expect(foods).toHaveLength(Math.min(8, available.length))
      expect(foods.every((food) => available.includes(food))).toBe(true)
    })
    const ids = months.flat().map((food) => food.id)
    expect(new Set(ids).size).toBeLessThan(ids.length)
  })

  it("개수 설정과 월별 포스터의 해당 카테고리 선정 순서를 따른다", () => {
    const monthly = { ...withMax(poster, 2), categories: [category] } satisfies typeof poster
    const months = yearPictures(withMax(spec, 2))
    MONTHS.forEach((month, index) => {
      expect(months[index]).toEqual(monthPictures(monthly, month))
    })
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
        "1월: 시금치 딸기 명태 굴 우엉 레드향 매생이 아귀",
        "2월: 홍합 광어 한라봉 봄동 천혜향 연근 동해한치 학꽁치",
        "3월: 냉이 주꾸미 바지락 대게 달래 봄 도다리 쑥 취나물",
        "4월: 마늘 미나리 낙지 두릅 아스파라거스 멍게 멸치 고사리",
        "5월: 오이 양배추 상추 참외 완두콩 쪽파 마늘종 쑥갓",
        "6월: 감자 애호박 방울토마토 블루베리 살구 농어 매실 체리",
        "7월: 토마토 양파 자두 수박 전복 민어 바다장어 강낭콩",
        "8월: 오징어 부추 복숭아 옥수수 가지 홍고추 멜론 참나물",
        "9월: 표고버섯 대하 밤 배 포도 조기 무화과 전어",
        "10월: 고구마 사과 쌀 대파 꽃게 갈치 꽁치 우럭",
        "11월: 고등어 무 파프리카 감 단호박 유자 과메기 참돔",
        "12월: 배추 귤 당근 브로콜리 방어 키위 대구 돼지감자",
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

  it("품종이 max보다 많으면 친숙한 품종, 같은 등급이면 그 계절에 대표 달이 많은 품종을 남기고, 시작 달 순으로 놓는다", () => {
    const all = seasonPictures(withMax(seasonPoster, 40), "autumn")
    const few = seasonPictures(withMax(seasonPoster, 8), "autumn")
    expect(few).toHaveLength(8)
    const peaksIn = (food: (typeof all)[number]) => food.peak.filter((month) => [9, 10, 11].includes(month)).length
    // 친숙도 오름차순, 같으면 대표 달 수 내림차순으로 비교하는 키. 남긴 품종의 가장 나쁜 키보다 뺀 품종이 앞서면 안 된다.
    const key = (food: (typeof all)[number]) => familiarity(food.id) * 100 - peaksIn(food)
    const cut = Math.max(...few.map(key))
    expect(all.filter((food) => !few.includes(food)).every((food) => key(food) >= cut)).toBe(true)
    const starts = few.map((food) => Math.min(...food.peak.filter((month) => [9, 10, 11].includes(month))))
    expect(starts).toEqual([...starts].sort((a, b) => a - b))
  })
})
