import { describe, expect, it } from "vitest"

import { monthHighlights } from "../data/foods"
import { labelHeight, labelWidth, SCATTER_FRAMES, SCATTER_MAX_FOODS, scatterLayout, type ScatterFrame } from "./scatter"

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
    ["mobileMonth", SCATTER_FRAMES.mobileMonth],
    ["mobileMonthTall", SCATTER_FRAMES.mobileMonthTall],
  ])("그림과 라벨이 %s 프레임 밖으로 나가지 않는다", (_, frame) => {
    for (const n of [1, 10, 20, 35]) {
      const { aspect, label, items } = scatterLayout({
        month: 3,
        ids: ids(n),
        frame,
      })
      for (const { cx, cy, size } of items) {
        const height = size * aspect // 그림 한 변을 프레임 높이 비율로
        const EPS = 1e-9 // 부동소수 오차
        expect(cx - size / 2).toBeGreaterThanOrEqual(-EPS)
        expect(cx + size / 2).toBeLessThanOrEqual(1 + EPS)
        expect(cy - height / 2).toBeGreaterThanOrEqual(-EPS)
        expect(cy + height / 2 + label).toBeLessThanOrEqual(1 + EPS)
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

describe("scatterLayout foodScale", () => {
  it("품종별 배율이 있으면 그 품종 그림만 더 크다", () => {
    const frame = SCATTER_FRAMES.desktopMonth
    const { items } = scatterLayout({ month: 3, ids: ["pollock", "apple"], frame })
    const size = (id: string) => items.find((item) => item.id === id)!.size
    expect(size("pollock")).toBeGreaterThan(size("apple"))
  })
})

describe("scatterLayout reserveBottom", () => {
  it("처음 배치는 아래 예약 자리(달력)를 피한다", () => {
    const frame = SCATTER_FRAMES.mobileMonth
    const { items } = scatterLayout({ month: 3, ids: ids(17), frame })
    const limit = (frame.height - frame.reserveBottom!) / frame.height
    for (const item of items) expect(item.cy + (item.size * frame.width) / frame.height / 2).toBeLessThanOrEqual(limit + 1e-9)
  })
})

describe("scatterLayout 겹침", () => {
  it.each(Object.entries(SCATTER_FRAMES))("%s 프레임에서 시드 배치의 그림이 서로 겹치지 않는다", (_, frame) => {
    for (const month of [1, 5, 10]) {
      for (const n of [14, 17, 25]) {
        const { items } = scatterLayout({ month, ids: ids(n), frame })
        for (let i = 0; i < items.length; i++) {
          for (let j = i + 1; j < items.length; j++) {
            const a = items[i]!
            const b = items[j]!
            const distance = Math.hypot((a.cx - b.cx) * frame.width, (a.cy - b.cy) * frame.height)
            const radii = ((a.size + b.size) * frame.width) / 2
            expect(distance, `${month}월 ${n}개 ${i}-${j}`).toBeGreaterThanOrEqual(radii - 0.5)
          }
        }
      }
    }
  })
})

describe("scatterLayout Lloyd 완화", () => {
  /** 판(달력 자리 제외)에서 가장 가까운 그림 가장자리까지 가장 먼 점의 거리(가장 큰 빈 곳). */
  function largestEmpty(month: number, n: number, lloydIterations: number): number {
    const frame = SCATTER_FRAMES.desktopMonth
    const { items } = scatterLayout({ month, ids: ids(n), frame, lloydIterations })
    const width = frame.width - frame.reserveRight!
    let worst = 0
    for (let y = 0; y <= frame.height; y += 8) {
      for (let x = 0; x <= width; x += 8) {
        const nearest = Math.min(
          ...items.map((item) => Math.hypot(item.cx * frame.width - x, item.cy * frame.height - y) - (item.size * frame.width) / 2)
        )
        worst = Math.max(worst, nearest)
      }
    }
    return worst
  }

  it("Lloyd를 쓰면 가장 큰 빈 곳이 평균적으로 줄어든다", () => {
    const cases = [1, 3, 5, 7, 9, 11].flatMap((month) => [14, 17, 25].map((n) => [month, n] as const))
    const mean = (iterations: number) => cases.reduce((sum, [month, n]) => sum + largestEmpty(month, n, iterations), 0) / cases.length
    expect(mean(6)).toBeLessThan(mean(0))
  })
})

describe("scatterLayout 이름표", () => {
  it("실제 품종으로 그림과 이름표가 서로 겹치지 않는다(원 ↔ 이름표 포함)", () => {
    for (const frame of [SCATTER_FRAMES.desktopMonth, SCATTER_FRAMES.desktopHero, SCATTER_FRAMES.mobileMonth]) {
      for (const month of [1, 4, 8, 10, 11]) {
        const foods = monthHighlights(month, SCATTER_MAX_FOODS)
        const { items } = scatterLayout({ month, ids: foods.map((food) => food.id), frame })
        const parts = items.map((item) => {
          const r = (item.size * frame.width) / 2
          const x = item.cx * frame.width
          const y = item.cy * frame.height
          const w = labelWidth(foods.find((food) => food.id === item.id)!.name, frame)
          const h = labelHeight(frame)
          return { x, y, r, rect: { x0: x - w / 2, x1: x + w / 2, y0: y + r, y1: y + r + h } }
        })
        const circleHitsRect = (c: (typeof parts)[number], other: (typeof parts)[number]) => {
          const nx = Math.min(Math.max(c.x, other.rect.x0), other.rect.x1)
          const ny = Math.min(Math.max(c.y, other.rect.y0), other.rect.y1)
          return Math.hypot(nx - c.x, ny - c.y) < c.r - 0.5
        }
        for (let i = 0; i < parts.length; i++) {
          for (let j = i + 1; j < parts.length; j++) {
            const a = parts[i]!
            const b = parts[j]!
            const label = `${month}월 ${foods[i]!.name}-${foods[j]!.name}`
            expect(Math.hypot(a.x - b.x, a.y - b.y) >= a.r + b.r - 0.5, `${label} 원-원`).toBe(true)
            expect(circleHitsRect(a, b), `${label} 원-이름표`).toBe(false)
            expect(circleHitsRect(b, a), `${label} 이름표-원`).toBe(false)
            const overlapX = Math.min(a.rect.x1, b.rect.x1) - Math.max(a.rect.x0, b.rect.x0)
            const overlapY = Math.min(a.rect.y1, b.rect.y1) - Math.max(a.rect.y0, b.rect.y0)
            expect(overlapX > 0.5 && overlapY > 0.5, `${label} 이름표-이름표`).toBe(false)
          }
        }
      }
    }
  })
})

describe("scatterLayout avoid", () => {
  // 인쇄 월간 M-E 세로: 판 전체에 그림, 오른쪽 아래 모서리에 달력 블록.
  const block = { x: 744 * 0.46, y: 988 * 0.64, width: 744 * 0.54, height: 988 * 0.36 }
  const frame: ScatterFrame = { width: 744, height: 988, big: true, avoid: [block] }

  it("피할 영역과 겹치는 그림·이름표가 없다", () => {
    for (const month of [1, 4, 8, 11]) {
      for (const n of [8, 14, 20]) {
        const foods = monthHighlights(month, n)
        const { items } = scatterLayout({ month, ids: foods.map((food) => food.id), frame })
        for (const item of items) {
          const r = (item.size * frame.width) / 2
          const x = item.cx * frame.width
          const y = item.cy * frame.height
          const half = Math.max(r, labelWidth(foods.find((food) => food.id === item.id)!.name, frame) / 2)
          const clear =
            x + half <= block.x + 0.5 ||
            x - half >= block.x + block.width - 0.5 ||
            y + r + labelHeight(frame) <= block.y + 0.5 ||
            y - r >= block.y + block.height - 0.5
          expect(clear, `${month}월 ${n}개 ${item.id}`).toBe(true)
        }
      }
    }
  })

  it("피할 영역 밖에서도 그림끼리 겹치지 않는다", () => {
    for (const month of [1, 5, 10]) {
      const { items } = scatterLayout({ month, ids: ids(18), frame })
      for (let i = 0; i < items.length; i++)
        for (let j = i + 1; j < items.length; j++) {
          const a = items[i]!
          const b = items[j]!
          const distance = Math.hypot((a.cx - b.cx) * frame.width, (a.cy - b.cy) * frame.height)
          expect(distance, `${month}월 ${i}-${j}`).toBeGreaterThanOrEqual(((a.size + b.size) * frame.width) / 2 - 0.5)
        }
    }
  })
})
