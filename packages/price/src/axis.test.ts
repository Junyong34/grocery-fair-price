import { describe, expect, it } from "vitest"

import { gapAxis, priceAxis } from "./axis"

describe("priceAxis", () => {
  it("가장 싼 값이 0, 가장 비싼 값이 1", () => {
    const axis = priceAxis([300, 100, 200])
    expect(axis.at(100)).toBe(0)
    expect(axis.at(200)).toBe(0.5)
    expect(axis.at(300)).toBe(1)
  })

  it("여백은 폭에 대한 비율로 양 끝에 둔다", () => {
    const axis = priceAxis([100, 200], { pad: 0.1 })
    expect(axis.min).toBeCloseTo(90)
    expect(axis.max).toBeCloseTo(210)
    expect(axis.at(150)).toBeCloseTo(0.5)
  })

  it("값이 하나뿐이면 가운데에 놓는다", () => {
    expect(priceAxis([4150]).at(4150)).toBe(0.5)
    expect(priceAxis([4150, 4150], { pad: 0.08 }).at(4150)).toBe(0.5)
    expect(priceAxis([0]).at(0)).toBe(0.5)
  })

  it("축 밖의 값은 끝에 붙인다", () => {
    const axis = priceAxis([100, 200])
    expect(axis.at(50)).toBe(0)
    expect(axis.at(250)).toBe(1)
  })

  it("눈금을 청하면 1 · 2 · 2.5 · 5 × 10^k 간격의 둥근 값으로 축을 넓힌다", () => {
    const axis = priceAxis([3870, 5120], { ticks: 4 })
    expect(axis.ticks).toEqual([3500, 4000, 4500, 5000, 5500])
    expect(axis.min).toBe(3500)
    expect(axis.max).toBe(5500)
    expect(priceAxis([1020, 1280], { ticks: 4 }).ticks).toEqual([1000, 1100, 1200, 1300])
    expect(priceAxis([100, 120], { ticks: 4 }).ticks).toEqual([100, 105, 110, 115, 120])
  })

  it("눈금을 청하지 않으면 눈금이 없다", () => {
    expect(priceAxis([100, 200]).ticks).toEqual([])
  })
})

describe("gapAxis", () => {
  it("기준과의 차이를 -1(가장 많이 낮음) ~ 1(가장 많이 높음)로 옮긴다", () => {
    const gap = gapAxis([8200, 8980, 9980, 11480], 9980)
    expect(gap.at(8200)).toBe(-1)
    expect(gap.at(9980)).toBe(0)
    expect(gap.at(11480)).toBeCloseTo(1500 / 1780)
  })
  it("차이 방향을 낮음 · 같음 · 높음으로 나눈다", () => {
    const gap = gapAxis([900, 1100], 1000)
    expect([gap.side(900), gap.side(1000), gap.side(1100)]).toEqual(["lower", "same", "higher"])
  })
  it("모든 값이 기준과 같으면 0에 둔다", () => {
    expect(gapAxis([1000, 1000], 1000).at(1000)).toBe(0)
  })
})
