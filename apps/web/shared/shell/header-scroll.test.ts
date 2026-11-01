import { describe, expect, it } from "vitest"

import { headerScrollStep, INITIAL_HEADER_SCROLL } from "./header-scroll"

const page = { maxY: 2000 }

/** 위치들을 차례로 넣어 마지막 보임 여부를 돌려준다. */
function run(ys: number[], maxY = page.maxY) {
  return ys.reduce((state, y) => headerScrollStep(state, y, maxY), INITIAL_HEADER_SCROLL).visible
}

describe("headerScrollStep", () => {
  it("처음에는 보인다", () => {
    expect(INITIAL_HEADER_SCROLL.visible).toBe(true)
  })

  it("아래로 10px 넘게 내려가면 숨는다", () => {
    expect(run([0, 30, 60])).toBe(false)
  })

  it("보이는 상태에서 아래로 10px 이하로 조금 움직이면 그대로다", () => {
    expect(run([0, 300, 200, 205, 209])).toBe(true)
  })

  it("숨은 뒤 위로 10px 넘게 올리면 나온다", () => {
    expect(run([0, 300, 600, 590, 580])).toBe(true)
  })

  it("숨은 뒤 위로 조금(10px 이하)만 올리면 숨은 채다", () => {
    expect(run([0, 300, 600, 595])).toBe(false)
  })

  it("맨 위 8px 안에서는 늘 보인다", () => {
    expect(run([0, 300, 600, 6])).toBe(true)
  })

  it("페이지 끝에서 튕기는 스크롤(끝 넘어감)은 무시한다", () => {
    expect(run([0, 300, 2000, 2040, 2000])).toBe(false)
  })

  it("맨 위 위로 튕기는 음수 위치는 맨 위로 본다", () => {
    expect(run([0, 300, -20])).toBe(true)
  })

  it("방향이 바뀌면 그 지점부터 다시 센다", () => {
    expect(run([0, 300, 295, 290, 300, 305])).toBe(false)
  })
})
