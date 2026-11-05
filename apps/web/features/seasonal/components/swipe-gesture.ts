/** 좌우 스와이프 판정. 화면을 만지지 않는 순수 함수라 use-swipe와 나눠 둔다. */

export type SwipeDirection = "previous" | "next"

/** 가로로 이만큼(px) 움직여야 스와이프다. */
const MIN_DISTANCE = 60
/** 가로 이동이 세로의 이 배수 이상이어야 스와이프다. */
const AXIS_RATIO = 1.5
/** 이 시간(ms)보다 오래 끈 움직임은 스와이프가 아니다(길게 눌러 글자를 고르는 경우 등). */
const MAX_DURATION = 700
/** 화면 가장자리 이 폭(px) 안에서 시작한 터치는 OS 뒤로 가기 제스처에 맡긴다. */
const EDGE_GUARD = 24

/** 터치가 시작한 뒤 움직인 거리와 시간으로 방향을 고른다. 손가락을 왼쪽으로 밀면 다음이다. */
export function swipeDirection({
  dx,
  dy,
  duration,
}: {
  dx: number
  dy: number
  duration: number
}): SwipeDirection | null {
  if (duration > MAX_DURATION) return null
  if (Math.abs(dx) < MIN_DISTANCE) return null
  if (Math.abs(dx) < Math.abs(dy) * AXIS_RATIO) return null
  return dx < 0 ? "next" : "previous"
}

/** 화면 양쪽 가장자리를 벗어난 곳에서 시작한 터치인가. */
export function startsAwayFromEdge(x: number, viewportWidth: number): boolean {
  return x >= EDGE_GUARD && x <= viewportWidth - EDGE_GUARD
}

/** 순서 목록에서 한 칸 옮긴 값. 기본은 끝에서 멈추고, loop면 반대쪽 끝으로 돈다. */
export function stepIn<T>(
  order: readonly T[],
  current: T,
  direction: SwipeDirection,
  { loop = false }: { loop?: boolean } = {}
): T {
  const index = order.indexOf(current)
  if (index === -1) return current
  const next = index + (direction === "next" ? 1 : -1)
  if (loop) return order[(next + order.length) % order.length]!
  return next >= 0 && next < order.length ? order[next]! : current
}
