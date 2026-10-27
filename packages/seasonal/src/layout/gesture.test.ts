import { describe, expect, it } from "vitest"

import { pressDrag, stepDrag, TAP_SLOP, type DragGesture, type DragInput } from "./gesture"

const mouse = () => pressDrag({ pointerId: 1, x: 100, y: 100 }, { waitForLongPress: false })
const finger = () => pressDrag({ pointerId: 1, x: 100, y: 100 }, { waitForLongPress: true })

/** 입력을 차례로 넣고 나온 효과를 모은다. */
function run(gesture: DragGesture, inputs: readonly DragInput[]) {
  let current: DragGesture | null = gesture
  const effects: string[] = []
  for (const input of inputs) {
    if (!current) break
    const step = stepDrag(current, input)
    current = step.gesture
    effects.push(...step.effects)
  }
  return { gesture: current, effects }
}

const move = (x: number, y = 100, pointerId = 1): DragInput => ({ type: "move", pointerId, x, y })
const up: DragInput = { type: "up", pointerId: 1 }

describe("끌기 제스처", () => {
  it("마우스는 TAP_SLOP 넘게 움직이면 끌기를 시작하고 놓으면 내려놓는다", () => {
    const { gesture, effects } = run(mouse(), [move(100 + TAP_SLOP - 1), move(100 + TAP_SLOP), move(130), up])
    expect(effects).toEqual(["start", "move", "move", "drop"])
    expect(gesture).toBeNull()
  })

  it("거의 움직이지 않고 놓으면 탭이라 효과가 없다", () => {
    expect(run(mouse(), [move(102, 103), up])).toEqual({ gesture: null, effects: [] })
  })

  it("손가락은 길게 누르기 전에 움직이면 스크롤로 넘기고 제스처가 끝난다", () => {
    expect(run(finger(), [move(130)])).toEqual({ gesture: null, effects: [] })
  })

  it("손가락은 길게 누르면 움직이지 않아도 끌기가 시작된다", () => {
    expect(run(finger(), [{ type: "longPress" }, move(101), up]).effects).toEqual(["start", "move", "drop"])
  })

  it("끌기 중에 길게 누르기가 늦게 와도 다시 시작하지 않는다", () => {
    expect(run(mouse(), [move(130), { type: "longPress" }]).effects).toEqual(["start", "move"])
  })

  it("취소되면 끌던 중이면 되돌리고, 누르기만 했으면 효과가 없다", () => {
    expect(run(mouse(), [move(130), { type: "cancel", pointerId: 1 }])).toEqual({ gesture: null, effects: ["start", "move", "cancel"] })
    expect(run(mouse(), [{ type: "cancel", pointerId: 1 }])).toEqual({ gesture: null, effects: [] })
  })

  it("다른 손가락(pointerId)의 입력은 무시한다", () => {
    const { gesture, effects } = run(mouse(), [move(200, 100, 2), { type: "up", pointerId: 2 }])
    expect(effects).toEqual([])
    expect(gesture).toEqual(mouse())
  })
})
