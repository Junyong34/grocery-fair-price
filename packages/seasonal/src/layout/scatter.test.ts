import { describe, expect, it } from "vitest"

import { SCATTER_FRAMES, scatterLayout } from "./scatter"

const ids = (n: number) => Array.from({ length: n }, (_, i) => `food-${i}`)

describe("scatterLayout", () => {
  it("같은 달, 같은 품종, 같은 영역이면 언제나 같은 배치를 낸다", () => {
    const first = scatterLayout({
      month: 10,
      ids: ids(17),
      frame: SCATTER_FRAMES.mobile,
    })
    const second = scatterLayout({
      month: 10,
      ids: ids(17),
      frame: SCATTER_FRAMES.mobile,
    })

    expect(second).toEqual(first)
    expect(first.items.map((item) => item.id)).toEqual(ids(17))
  })

  it.each([
    ["mobile", SCATTER_FRAMES.mobile],
    ["desktop", SCATTER_FRAMES.desktop],
    ["desktopMonth", SCATTER_FRAMES.desktopMonth],
    ["desktopHero", SCATTER_FRAMES.desktopHero],
  ])("그림과 라벨이 %s 프레임 밖으로 나가지 않는다", (_, frame) => {
    for (const n of [1, 10, 20, 35]) {
      const { aspect, label, items } = scatterLayout({
        month: 3,
        ids: ids(n),
        frame,
      })
      for (const { cx, cy, size } of items) {
        const height = size * aspect // 그림 한 변을 프레임 높이 비율로
        expect(cx - size / 2).toBeGreaterThanOrEqual(0)
        expect(cx + size / 2).toBeLessThanOrEqual(1)
        expect(cy - height / 2).toBeGreaterThanOrEqual(0)
        expect(cy + height / 2 + label).toBeLessThanOrEqual(1)
      }
    }
  })

  it("품종이 많은 달일수록 그림이 작다", () => {
    const average = (n: number) => {
      const { items } = scatterLayout({
        month: 5,
        ids: ids(n),
        frame: SCATTER_FRAMES.mobile,
      })
      return items.reduce((sum, item) => sum + item.size, 0) / n
    }
    expect(average(10)).toBeGreaterThan(average(20))
  })

  it("달이 다르면 같은 품종 수라도 배치가 다르다", () => {
    const october = scatterLayout({
      month: 10,
      ids: ids(12),
      frame: SCATTER_FRAMES.mobile,
    })
    const november = scatterLayout({
      month: 11,
      ids: ids(12),
      frame: SCATTER_FRAMES.mobile,
    })
    expect(november.items).not.toEqual(october.items)
  })
})

describe("scatterLayout reserveRight", () => {
  it("처음 배치는 오른쪽 예약 자리(달력)를 피한다", () => {
    const frame = SCATTER_FRAMES.desktopMonth
    const { items } = scatterLayout({ month: 3, ids: ids(17), frame })
    const limit = (frame.width - frame.reserveRight!) / frame.width
    for (const item of items) expect(item.cx + item.size / 2).toBeLessThanOrEqual(limit + 1e-9)
  })
})
