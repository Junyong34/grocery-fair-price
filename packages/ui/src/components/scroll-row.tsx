"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

/** 앞뒤 끝에서 이만큼(px) 안이면 끝에 닿은 것으로 본다(scroll-snap이 안쪽 여백만큼 밀어 놓는 경우). */
const EDGE_TOLERANCE = 8
/** 가장자리 흐림 폭(px). */
const FADE = 28
/** 마우스로 잡아 끌 때 이만큼(px) 움직여야 끌기로 본다. 그 전에는 클릭이다. */
const DRAG_SLOP = 5

export type ScrollRowProps = React.ComponentProps<"div"> & {
  /** 바깥 틀(버튼 위치 기준)의 className. 스크롤 영역에는 className이 붙는다. */
  frameClassName?: string
  previousLabel?: string
  nextLabel?: string
}

/**
 * 가로로 넘기는 줄. 스크롤바는 숨기고, 더 볼 내용이 있는 쪽 가장자리를 흐리게 하고 좌우 버튼을 띄운다.
 * 마우스로 잡아 끌어도 넘어간다(끈 뒤의 클릭은 막는다). 손가락은 원래대로 밀어 넘긴다.
 * ref는 스크롤 영역(div)을 가리킨다.
 */
export function ScrollRow({
  className,
  frameClassName,
  previousLabel = "이전 항목 보기",
  nextLabel = "다음 항목 보기",
  ref,
  children,
  style,
  ...props
}: ScrollRowProps) {
  const viewport = React.useRef<HTMLDivElement | null>(null)
  const [edges, setEdges] = React.useState({ start: false, end: false })

  const setRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      viewport.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [ref]
  )

  // 앞뒤로 더 볼 내용이 있는지. 스크롤·크기 변화·내용 변화 때 다시 잰다.
  React.useEffect(() => {
    const node = viewport.current
    if (!node) return
    const measure = () => {
      const max = node.scrollWidth - node.clientWidth
      setEdges({
        start: node.scrollLeft > EDGE_TOLERANCE,
        end: node.scrollLeft < max - EDGE_TOLERANCE,
      })
    }
    measure()
    node.addEventListener("scroll", measure, { passive: true })
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    for (const child of node.children) observer.observe(child)
    return () => {
      node.removeEventListener("scroll", measure)
      observer.disconnect()
    }
  }, [])

  const page = (direction: 1 | -1) => {
    const node = viewport.current
    if (!node) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    node.scrollBy({
      left: direction * node.clientWidth * 0.75,
      behavior: reduce ? "instant" : "smooth",
    })
  }

  // 마우스로 잡아 끌어 넘기기.
  const drag = React.useRef<{ x: number; left: number; moved: boolean } | null>(
    null
  )
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    props.onPointerDown?.(event)
    if (event.pointerType !== "mouse" || event.button !== 0) return
    drag.current = {
      x: event.clientX,
      left: event.currentTarget.scrollLeft,
      moved: false,
    }
  }
  React.useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const state = drag.current
      const node = viewport.current
      if (!state || !node) return
      const dx = event.clientX - state.x
      if (!state.moved && Math.abs(dx) < DRAG_SLOP) return
      state.moved = true
      node.scrollLeft = state.left - dx
      node.dataset.dragging = ""
    }
    const onUp = () => {
      const node = viewport.current
      if (node) delete node.dataset.dragging
      // 끌었으면 이어지는 click을 한 번 막는다.
      if (drag.current?.moved) setTimeout(() => (drag.current = null))
      else drag.current = null
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
  }, [])

  const fade = `linear-gradient(to right, transparent, black ${edges.start ? FADE : 0}px, black calc(100% - ${edges.end ? FADE : 0}px), transparent)`

  return (
    <div className={cn("relative", frameClassName)}>
      <div
        {...props}
        ref={setRef}
        onPointerDown={onPointerDown}
        onClickCapture={(event) => {
          props.onClickCapture?.(event)
          if (drag.current?.moved) {
            event.preventDefault()
            event.stopPropagation()
          }
        }}
        onDragStart={(event) => event.preventDefault()}
        className={cn(
          "flex [scrollbar-width:none] overflow-x-auto overscroll-x-contain [&::-webkit-scrollbar]:hidden",
          "data-dragging:cursor-grabbing data-dragging:select-none",
          className
        )}
        style={{ maskImage: fade, WebkitMaskImage: fade, ...style }}
      >
        {children}
      </div>
      <EdgeButton
        side="start"
        visible={edges.start}
        label={previousLabel}
        onClick={() => page(-1)}
      />
      <EdgeButton
        side="end"
        visible={edges.end}
        label={nextLabel}
        onClick={() => page(1)}
      />
    </div>
  )
}

function EdgeButton({
  side,
  visible,
  label,
  onClick,
}: {
  side: "start" | "end"
  visible: boolean
  label: string
  onClick: () => void
}) {
  const Icon = side === "start" ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      aria-label={label}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      onClick={onClick}
      className={cn(
        "absolute top-1/2 z-10 grid size-7 -translate-y-1/2 place-items-center rounded-full border border-hairline bg-canvas/95 text-stone shadow-sm transition-opacity duration-200 hover:text-ink",
        side === "start" ? "left-1" : "right-1",
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <Icon aria-hidden size={16} strokeWidth={2} />
    </button>
  )
}
