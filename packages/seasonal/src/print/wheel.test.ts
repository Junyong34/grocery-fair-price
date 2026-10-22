import { describe, expect, it } from "vitest"

import { wheelLayout, type WheelLayout } from "./wheel"

/** 그림(원)이 자기 부채꼴 고리 안에 있는지: 중심에서 거리, 양쪽 경계선까지 거리. */
function inside(layout: WheelLayout) {
  const c = layout.diameter / 2
  const EPS = 1e-6
  for (const sector of layout.sectors)
    for (const slot of sector.slots) {
      const dx = slot.x - c
      const dy = slot.y - c
      const r = Math.hypot(dx, dy)
      const half = layout.pictureSize / 2
      expect(r - half, "안쪽 고리").toBeGreaterThanOrEqual(layout.inner - EPS)
      expect(r + half, "바깥 고리").toBeLessThanOrEqual(layout.outer + EPS)
      // 12시 방향에서 시계 방향으로 잰 각도
      const angle = (Math.atan2(dx, -dy) + Math.PI * 2) % (Math.PI * 2)
      const spread = sector.end - sector.start
      const local = (angle - sector.start + Math.PI * 4) % (Math.PI * 2)
      expect(local, "부채꼴 각도 안").toBeLessThanOrEqual(spread + EPS)
      expect(r * Math.sin(Math.min(local, spread - local)), "경계선까지").toBeGreaterThanOrEqual(half - EPS)
    }
}

function apart(layout: WheelLayout) {
  const slots = layout.sectors.flatMap((sector) => sector.slots)
  for (let i = 0; i < slots.length; i++)
    for (let j = i + 1; j < slots.length; j++) expect(Math.hypot(slots[i]!.x - slots[j]!.x, slots[i]!.y - slots[j]!.y)).toBeGreaterThanOrEqual(layout.pictureSize - 1e-6)
}

describe("wheelLayout", () => {
  it.each([
    [12, [1, 2, 3, 4, 4, 4, 3, 2, 1, 4, 4, 4]],
    [12, Array(12).fill(4)],
    [4, [12, 19, 26, 10]],
    [4, [1, 1, 1, 1]],
  ])("부채꼴 %i개: 그림이 자기 부채꼴 밖으로 나가지 않고 서로 겹치지 않는다", (sectors, counts) => {
    const layout = wheelLayout({ diameter: 186, sectors, counts })
    expect(layout.sectors).toHaveLength(sectors)
    layout.sectors.forEach((sector, i) => expect(sector.slots).toHaveLength(counts[i]!))
    inside(layout)
    apart(layout)
  })

  it("부채꼴은 12시 방향부터 시계 방향으로 고르게 나뉜다", () => {
    const { sectors } = wheelLayout({ diameter: 100, sectors: 4, counts: [1, 1, 1, 1] })
    expect(sectors.map((sector) => sector.start)).toEqual([0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2])
  })

  it("표기 자리는 바깥 띠 안, 부채꼴 가운데 각도에 있다", () => {
    const layout = wheelLayout({ diameter: 100, sectors: 12, counts: Array(12).fill(2) })
    const c = 50
    for (const sector of layout.sectors) {
      const r = Math.hypot(sector.label.x - c, sector.label.y - c)
      expect(r).toBeGreaterThan(layout.outer)
      expect(r).toBeLessThan(50)
    }
  })

  it("그림이 적을수록 크다", () => {
    const few = wheelLayout({ diameter: 186, sectors: 12, counts: Array(12).fill(2) })
    const many = wheelLayout({ diameter: 186, sectors: 12, counts: Array(12).fill(4) })
    expect(few.pictureSize).toBeGreaterThan(many.pictureSize)
  })

  it("품종이 없는 부채꼴이 있어도 된다", () => {
    const layout = wheelLayout({ diameter: 186, sectors: 4, counts: [0, 3, 0, 2] })
    expect(layout.sectors[0]!.slots).toEqual([])
    inside(layout)
  })
})
