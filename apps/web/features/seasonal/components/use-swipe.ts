"use client"

import { useEffect, useLayoutEffect, useRef } from "react"

import {
  startsAwayFromEdge,
  swipeDirection,
  type SwipeDirection,
} from "./swipe-gesture"

/** 스와이프를 시작하지 않는 요소: 입력창·체크박스와 시트·대화상자. */
const IGNORED =
  'input, textarea, select, [contenteditable], [role="checkbox"], [role="slider"], [role="dialog"]'

/** 터치가 입력창·시트 위거나, 영역 안의 가로 스크롤 요소(칩 줄 등) 안에서 시작했는가. */
function isIgnoredTarget(target: EventTarget | null, area: HTMLElement) {
  if (!(target instanceof Element) || target.closest(IGNORED)) return true
  for (
    let node: Element | null = target;
    node && node !== area;
    node = node.parentElement
  ) {
    if (node.scrollWidth <= node.clientWidth) continue
    const { overflowX } = getComputedStyle(node)
    if (overflowX === "auto" || overflowX === "scroll") return true
  }
  return false
}

/**
 * 좌우 스와이프로 이전·다음을 고른다. 돌려주는 ref를 붙인 요소 안에서 시작한 터치만 본다.
 * 터치 이벤트만 듣고 preventDefault를 하지 않아 세로 스크롤과 확대는 그대로다(touch-action도 건드리지 않는다).
 * React 이벤트는 포털을 타고 올라오므로 DOM에 직접 걸어, 영역 밖에 뜬 시트의 터치가 들어오지 않게 한다.
 */
export function useSwipe<T extends HTMLElement>(
  onSwipe: (direction: SwipeDirection) => void
) {
  const area = useRef<T>(null)
  const latest = useRef(onSwipe)
  useLayoutEffect(() => {
    latest.current = onSwipe
  })

  useEffect(() => {
    const node = area.current
    if (!node) return
    let start: { x: number; y: number; time: number; scrollY: number } | null =
      null

    const onStart = (event: TouchEvent) => {
      start = null
      const touch = event.touches[0]
      // 두 손가락(확대)과 확대된 화면을 옮기는 터치는 스와이프가 아니다.
      if (!touch || event.touches.length > 1) return
      if ((window.visualViewport?.scale ?? 1) > 1.01) return
      if (!startsAwayFromEdge(touch.clientX, window.innerWidth)) return
      if (isIgnoredTarget(event.target, node)) return
      start = {
        x: touch.clientX,
        y: touch.clientY,
        time: event.timeStamp,
        scrollY: window.scrollY,
      }
    }
    const onEnd = (event: TouchEvent) => {
      const from = start
      start = null
      const touch = event.changedTouches[0]
      // 터치하는 동안 페이지가 움직였으면 브라우저가 세로 스크롤로 처리한 것이다.
      if (!from || !touch || window.scrollY !== from.scrollY) return
      const direction = swipeDirection({
        dx: touch.clientX - from.x,
        dy: touch.clientY - from.y,
        duration: event.timeStamp - from.time,
      })
      if (direction) latest.current(direction)
    }
    const onCancel = () => {
      start = null
    }

    node.addEventListener("touchstart", onStart, { passive: true })
    node.addEventListener("touchend", onEnd, { passive: true })
    node.addEventListener("touchcancel", onCancel, { passive: true })
    return () => {
      node.removeEventListener("touchstart", onStart)
      node.removeEventListener("touchend", onEnd)
      node.removeEventListener("touchcancel", onCancel)
    }
  }, [])

  return area
}
