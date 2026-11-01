// hide-on-scroll 헤더의 보임 판정(.scratch/shell-unify/spec.md 4-2). 스크롤 위치를 차례로 받아 헤더를 보일지 정하는 순수 함수다.

/** 방향을 바꿨다고 보는 최소 이동(px). 손가락 떨림과 관성 끝의 작은 움직임에 헤더가 깜빡이지 않게 한다. */
export const DIRECTION_THRESHOLD = 10

/** 이 위치(px)보다 위에서는 헤더가 늘 보인다. */
export const ALWAYS_VISIBLE_TOP = 8

export type HeaderScrollState = {
  visible: boolean
  /** 지난 위치 */
  lastY: number
  /** 지금 방향으로 움직이기 시작한 위치 */
  anchorY: number
}

export const INITIAL_HEADER_SCROLL: HeaderScrollState = { visible: true, lastY: 0, anchorY: 0 }

/**
 * 새 스크롤 위치 y로 다음 상태를 낸다. maxY는 문서 끝 위치(문서 높이 − 화면 높이)다.
 * iOS가 맨 위 · 맨 끝을 넘어 튕기는 동안의 위치는 무시한다(끝에서 헤더가 다시 나오는 깜빡임을 막는다).
 */
export function headerScrollStep(state: HeaderScrollState, y: number, maxY: number): HeaderScrollState {
  if (y <= ALWAYS_VISIBLE_TOP) return { visible: true, lastY: Math.max(0, y), anchorY: Math.max(0, y) }
  if (y > maxY) return state
  const goingDown = y > state.lastY
  const wasGoingDown = state.lastY > state.anchorY
  // 방향이 바뀌면 바뀐 지점(lastY)부터 다시 잰다.
  const anchorY = goingDown === wasGoingDown || state.lastY === state.anchorY ? state.anchorY : state.lastY
  const moved = y - anchorY
  if (moved > DIRECTION_THRESHOLD) return { visible: false, lastY: y, anchorY }
  if (moved < -DIRECTION_THRESHOLD) return { visible: true, lastY: y, anchorY }
  return { visible: state.visible, lastY: y, anchorY }
}
