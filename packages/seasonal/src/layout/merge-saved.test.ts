import { describe, expect, it } from "vitest"

import { mergeSavedLayout } from "./merge-saved"
import { SCATTER_FRAMES, scatterLayout } from "./scatter"

const frame = SCATTER_FRAMES.mobile
const ids = (...names: string[]) => names

describe("mergeSavedLayout", () => {
  it("저장된 품종은 옮긴 자리를 지키고, 빠진 품종은 지운다", () => {
    const seed = scatterLayout({ month: 10, ids: ids("a", "b", "c"), frame })
    const saved = [
      { id: "a", cx: 0.2, cy: 0.3 },
      { id: "gone", cx: 0.5, cy: 0.5 },
    ]

    const merged = mergeSavedLayout({ month: 10, seed, saved, frame })

    expect(merged.items.map((item) => item.id)).toEqual(["a", "b", "c"])
    expect(merged.items[0]).toMatchObject({
      id: "a",
      cx: 0.2,
      cy: 0.3,
      size: seed.items[0]!.size,
    })
  })

  it("새로 생긴 품종은 저장된 그림들과 겹치지 않는 빈자리에 넣는다", () => {
    const seed = scatterLayout({ month: 3, ids: ids("a", "b", "new"), frame })
    // 저장된 a·b를 새 품종의 시드 자리 바로 위에 올려 둔다. 그대로 두면 겹친다.
    const newSeed = seed.items.find((item) => item.id === "new")!
    const saved = [
      { id: "a", cx: newSeed.cx, cy: newSeed.cy },
      { id: "b", cx: 0.9, cy: 0.2 },
    ]

    const merged = mergeSavedLayout({ month: 3, seed, saved, frame })
    const a = merged.items.find((item) => item.id === "a")!
    const added = merged.items.find((item) => item.id === "new")!

    // 두 그림 중심 사이 거리(프레임 px)가 반지름 합보다 크다.
    const distance = Math.hypot(
      (added.cx - a.cx) * frame.width,
      (added.cy - a.cy) * frame.height
    )
    expect(distance).toBeGreaterThan(((added.size + a.size) / 2) * frame.width)
    // 그림이 프레임 안에 있다.
    expect(added.cx - added.size / 2).toBeGreaterThanOrEqual(0)
    expect(added.cx + added.size / 2).toBeLessThanOrEqual(1)
  })

  it("저장한 배치가 없으면 시드 배치 그대로다", () => {
    const seed = scatterLayout({ month: 7, ids: ids("a", "b"), frame })
    expect(mergeSavedLayout({ month: 7, seed, saved: [], frame })).toEqual(seed)
  })
})
