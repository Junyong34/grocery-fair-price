"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"

import { LONG_PRESS_MS, pressDrag, stepDrag, type DragGesture, type DragInput } from "@workspace/seasonal/layout/gesture"

type DragHandlers = {
  onStart: () => void
  /** 끄는 동안 포인터 위치(화면 px) */
  onMove: (clientX: number, clientY: number) => void
  onDrop: () => void
  onCancel: () => void
}

/**
 * 끌기 제스처 하나(그림 끌기 · 달력 끌기)의 리스너를 맡는다. 판단은 stepDrag가 하고 여기서는 효과만 실행한다.
 * 누를 때 window에 리스너를 걸고, 제스처가 끝나거나 컴포넌트가 사라지면 늘 뗀다. 돌려주는 객체는 렌더가 바뀌어도 같다.
 */
export function useDragGesture(handlers: DragHandlers) {
  const active = useRef<{ gesture: DragGesture; stop: () => void } | null>(null)
  // 리스너는 누를 때 한 번 걸리므로 핸들러는 늘 최신 것을 ref로 읽는다.
  const latest = useRef(handlers)
  useLayoutEffect(() => {
    latest.current = handlers
  })

  useEffect(
    () => () => {
      active.current?.stop()
      active.current = null
    },
    []
  )

  const [api] = useState(() => {
    const apply = (input: DragInput) => {
      const current = active.current
      if (!current) return
      const step = stepDrag(current.gesture, input)
      if (step.gesture) current.gesture = step.gesture
      else {
        current.stop()
        active.current = null
      }
      for (const effect of step.effects) {
        if (effect === "start") latest.current.onStart()
        else if (effect === "move" && input.type === "move") latest.current.onMove(input.x, input.y)
        else if (effect === "drop") latest.current.onDrop()
        else if (effect === "cancel") latest.current.onCancel()
      }
    }

    return {
      /** 누르기를 받는다. waitForLongPress면 손가락은 길게 눌러야 끌기가 시작된다. 이미 제스처 중이면 무시한다. */
      begin(event: React.PointerEvent, { waitForLongPress }: { waitForLongPress: boolean }) {
        if (active.current) return
        const onMove = (e: PointerEvent) => apply({ type: "move", pointerId: e.pointerId, x: e.clientX, y: e.clientY })
        const onUp = (e: PointerEvent) => apply({ type: "up", pointerId: e.pointerId })
        const onCancel = (e: PointerEvent) => apply({ type: "cancel", pointerId: e.pointerId })
        const waits = waitForLongPress && event.pointerType === "touch"
        const timer = waits ? setTimeout(() => apply({ type: "longPress" }), LONG_PRESS_MS) : undefined
        window.addEventListener("pointermove", onMove)
        window.addEventListener("pointerup", onUp)
        window.addEventListener("pointercancel", onCancel)
        active.current = {
          gesture: pressDrag({ pointerId: event.pointerId, x: event.clientX, y: event.clientY }, { waitForLongPress: waits }),
          stop: () => {
            clearTimeout(timer)
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerup", onUp)
            window.removeEventListener("pointercancel", onCancel)
          },
        }
      },
      isActive: () => active.current != null,
      isDragging: () => active.current?.gesture.dragging ?? false,
    }
  })

  return api
}
