import { describe, expect, it } from "vitest"

import { startsAwayFromEdge, stepIn, swipeDirection } from "./swipe-gesture"

const swipe = (dx: number, dy = 0, duration = 200) =>
  swipeDirection({ dx, dy, duration })

describe("swipeDirection", () => {
  it("손가락을 왼쪽으로 밀면 다음, 오른쪽으로 밀면 이전이다", () => {
    expect(swipe(-100)).toBe("next")
    expect(swipe(100)).toBe("previous")
  })

  it("임계값(60px)에 못 미치면 고르지 않는다", () => {
    expect(swipe(-59)).toBeNull()
    expect(swipe(59)).toBeNull()
    expect(swipe(-60)).toBe("next")
  })

  it("가로 이동이 세로의 1.5배에 못 미치면 고르지 않는다", () => {
    expect(swipe(-100, 67)).toBeNull()
    expect(swipe(100, -100)).toBeNull()
    expect(swipe(-100, 66)).toBe("next")
  })

  it("세로 스크롤은 고르지 않는다", () => {
    expect(swipe(0, 300)).toBeNull()
    expect(swipe(10, -300)).toBeNull()
  })

  it("너무 오래 끈 움직임(글자 선택 등)은 고르지 않는다", () => {
    expect(swipe(-100, 0, 700)).toBe("next")
    expect(swipe(-100, 0, 701)).toBeNull()
  })
})

describe("startsAwayFromEdge", () => {
  it("화면 양쪽 가장자리 24px 안에서 시작한 터치를 거른다", () => {
    expect(startsAwayFromEdge(0, 375)).toBe(false)
    expect(startsAwayFromEdge(23, 375)).toBe(false)
    expect(startsAwayFromEdge(24, 375)).toBe(true)
    expect(startsAwayFromEdge(351, 375)).toBe(true)
    expect(startsAwayFromEdge(352, 375)).toBe(false)
  })
})

describe("stepIn", () => {
  const order = [1, 2, 3] as const

  it("앞뒤로 한 칸 옮긴다", () => {
    expect(stepIn(order, 2, "next")).toBe(3)
    expect(stepIn(order, 2, "previous")).toBe(1)
  })

  it("기본은 끝에서 멈춘다", () => {
    expect(stepIn(order, 3, "next")).toBe(3)
    expect(stepIn(order, 1, "previous")).toBe(1)
  })

  it("loop면 끝에서 반대쪽 끝으로 돈다", () => {
    expect(stepIn(order, 3, "next", { loop: true })).toBe(1)
    expect(stepIn(order, 1, "previous", { loop: true })).toBe(3)
  })

  it("목록에 없는 값은 그대로 돌려준다", () => {
    expect(stepIn<number>(order, 9, "next", { loop: true })).toBe(9)
  })

  it("null도 목록의 한 칸으로 다룬다(나의 식탁의 전체)", () => {
    const scopes = [null, 1, 2] as const
    expect(stepIn(scopes, null, "next")).toBe(1)
    expect(stepIn(scopes, 1, "previous")).toBeNull()
    expect(stepIn(scopes, null, "previous")).toBeNull()
  })
})
