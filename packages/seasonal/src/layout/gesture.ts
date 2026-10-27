// 흩어진 판의 끌기 제스처(그림 · 달력)를 판단하는 순수 함수. 포인터 이벤트를 넣으면 다음 상태와 할 일(효과)이 나온다.
// 리스너를 붙이고 떼는 일과 효과를 실제로 실행하는 일은 화면(useDragGesture)이 한다.

/** 이만큼(px) 움직이기 전까지는 탭이다. */
export const TAP_SLOP = 6
/** 손가락은 이만큼(ms) 누르고 있어야 끌기가 시작된다. 그 전에 움직이면 화면 스크롤이다. */
export const LONG_PRESS_MS = 250

export type DragGesture = {
  pointerId: number
  /** 누른 점(화면 px) */
  start: { x: number; y: number }
  /** 길게 눌러야 끌기가 시작된다(손가락으로 스크롤할 수 있는 곳). 그 전에 움직이면 제스처가 끝난다. */
  waitForLongPress: boolean
  dragging: boolean
}

export type DragInput =
  | { type: "move"; pointerId: number; x: number; y: number }
  | { type: "longPress" }
  | { type: "up" | "cancel"; pointerId: number }

/** start: 끌기 시작 · move: 이번 이벤트 점으로 옮김 · drop: 놓아서 저장 · cancel: 끌던 것을 되돌림 */
export type DragEffect = "start" | "move" | "drop" | "cancel"

export function pressDrag(pointer: { pointerId: number; x: number; y: number }, { waitForLongPress }: { waitForLongPress: boolean }): DragGesture {
  return { pointerId: pointer.pointerId, start: { x: pointer.x, y: pointer.y }, waitForLongPress, dragging: false }
}

/** 입력 하나를 넣는다. gesture가 null이면 제스처가 끝났다. 탭(끌지 않고 놓음)은 효과가 없다. */
export function stepDrag(gesture: DragGesture, input: DragInput): { gesture: DragGesture | null; effects: readonly DragEffect[] } {
  if (input.type !== "longPress" && input.pointerId !== gesture.pointerId) return { gesture, effects: [] }
  switch (input.type) {
    case "longPress":
      return gesture.dragging ? { gesture, effects: [] } : { gesture: { ...gesture, dragging: true }, effects: ["start"] }
    case "move": {
      if (gesture.dragging) return { gesture, effects: ["move"] }
      if (Math.hypot(input.x - gesture.start.x, input.y - gesture.start.y) < TAP_SLOP) return { gesture, effects: [] }
      if (gesture.waitForLongPress) return { gesture: null, effects: [] }
      return { gesture: { ...gesture, dragging: true }, effects: ["start", "move"] }
    }
    case "up":
      return { gesture: null, effects: gesture.dragging ? ["drop"] : [] }
    case "cancel":
      return { gesture: null, effects: gesture.dragging ? ["cancel"] : [] }
  }
}
