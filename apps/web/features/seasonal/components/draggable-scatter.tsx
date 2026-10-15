"use client"

import Link from "next/link"
import { RotateCcw } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

import type { Food } from "@workspace/seasonal/data/foods"
import {
  mergeSavedLayout,
  type SavedSpot,
} from "@workspace/seasonal/layout/merge-saved"
import {
  labelHeight,
  SCATTER_FRAMES,
  type ScatterLayout,
} from "@workspace/seasonal/layout/scatter"
import {
  relaxCircles,
  type Circle,
} from "@workspace/ui/lib/geometry/relax-circles"
import { PatternBackground } from "@workspace/ui/components/pattern-background"
import { cn } from "@workspace/ui/lib/utils"

import { routes } from "@/shared/routes"

import {
  scatterKey,
  useHydrateScatter,
  useScatterStore,
} from "../stores/scatter-store"
import { EatenBadge } from "./eaten-badge"
import { FoodImage } from "./food-image"

/** 이만큼(px) 움직이기 전까지는 탭이다. */
const TAP_SLOP = 6
/** 손가락은 이만큼(ms) 누르고 있어야 끌기가 시작된다. 그 전에 움직이면 화면 스크롤이다. */
const LONG_PRESS_MS = 250
/** 그림 사이에 남길 틈(프레임 px). */
const GAP = 2

type Spot = { cx: number; cy: number }
type Gesture = {
  id: string
  pointerId: number
  pointerType: string
  startX: number
  startY: number
  /** 그림 중심과 누른 점의 차이(프레임 px). 끄는 동안 그림이 손가락 아래에서 튀지 않게 한다. */
  grabX: number
  grabY: number
  from: Map<string, Spot>
  dragging: boolean
  timer?: ReturnType<typeof setTimeout>
}

/**
 * 흩어진 그림을 끌어 옮기는 판. 끄는 동안 주변 그림이 밀려나고(겹침 해소), 놓으면 배치를 기기에 저장한다.
 * - 마우스: 6px 넘게 움직이면 끌기. 손가락: 250ms 누른 뒤 끌기(그 전에 움직이면 스크롤).
 * - 끌지 않고 누르면 품종 상세로 간다. 키보드·스크린리더에는 그대로 링크다.
 * - 옮긴 적이 있으면 오른쪽 아래 "원래대로"로 시드 배치로 되돌린다.
 */
export function DraggableScatter({
  month,
  frame: frameName,
  seed,
  foods,
  year,
  className,
}: {
  month: number
  frame: keyof typeof SCATTER_FRAMES
  seed: ScatterLayout
  foods: readonly Food[]
  year: number
  className?: string
}) {
  useHydrateScatter()
  const frame = SCATTER_FRAMES[frameName]
  const key = scatterKey(month, frameName)
  const saved = useScatterStore((state) => state.layouts[key])
  const save = useScatterStore((state) => state.save)
  const reset = useScatterStore((state) => state.reset)

  const byId = useMemo(
    () => new Map<string, Food>(foods.map((food) => [food.id, food])),
    [foods]
  )
  const sizeOf = useMemo(
    () => new Map(seed.items.map((item) => [item.id, item.size])),
    [seed]
  )
  const bounds = {
    width: frame.width,
    height: frame.height - labelHeight(frame),
  }

  const toCircles = (spots: Map<string, Spot>): Circle[] =>
    [...spots].map(([id, spot]) => ({
      id,
      x: spot.cx * frame.width,
      y: spot.cy * frame.height,
      r: (sizeOf.get(id)! * frame.width) / 2,
    }))
  const toSpots = (circles: readonly Circle[]) =>
    new Map(
      circles.map((c) => [
        c.id,
        { cx: c.x / frame.width, cy: c.y / frame.height },
      ])
    )

  // 쉬는 자리: 저장된 배치(새 품종 넣기 + 크기 변화로 생긴 겹침 풀기) 또는 시드 배치.
  const rest = useMemo(() => {
    const merged = saved
      ? mergeSavedLayout({ month, seed, saved, frame })
      : seed
    const spots = new Map(
      merged.items.map((item) => [item.id, { cx: item.cx, cy: item.cy }])
    )
    return saved
      ? toSpots(relaxCircles(toCircles(spots), { bounds, gap: GAP }))
      : spots
    // eslint-disable-next-line react-hooks/exhaustive-deps -- frame·bounds는 frameName에서 정해진다.
  }, [saved, seed, month, frameName])

  const [live, setLive] = useState<{
    spots: Map<string, Spot>
    dragging: string
  } | null>(null)
  const spots = live?.spots ?? rest

  const field = useRef<HTMLDivElement>(null)
  const gesture = useRef<Gesture | null>(null)
  const suppressClick = useRef(false)
  const frameRequest = useRef(0)

  // 끄는 동안 손가락 스크롤을 막는다. touchmove는 passive가 아니어야 preventDefault가 듣는다.
  useEffect(() => {
    const onTouchMove = (event: TouchEvent) => {
      if (gesture.current?.dragging) event.preventDefault()
    }
    window.addEventListener("touchmove", onTouchMove, { passive: false })
    return () => window.removeEventListener("touchmove", onTouchMove)
  }, [])

  const toFrame = (clientX: number, clientY: number) => {
    const rect = field.current!.getBoundingClientRect()
    const scale = rect.width / frame.width
    return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale }
  }

  const startDrag = (g: Gesture) => {
    g.dragging = true
    suppressClick.current = true
    setLive({ spots: g.from, dragging: g.id })
    if (g.pointerType === "touch") navigator.vibrate?.(8)
  }

  const moveTo = (g: Gesture, clientX: number, clientY: number) => {
    const point = toFrame(clientX, clientY)
    const moved = new Map(g.from)
    moved.set(g.id, {
      cx: (point.x - g.grabX) / frame.width,
      cy: (point.y - g.grabY) / frame.height,
    })
    // 한 프레임에 한 번만 계산한다.
    cancelAnimationFrame(frameRequest.current)
    frameRequest.current = requestAnimationFrame(() => {
      const relaxed = relaxCircles(toCircles(moved), {
        bounds,
        pinned: g.id,
        gap: GAP,
      })
      setLive({ spots: toSpots(relaxed), dragging: g.id })
    })
  }

  const end = (commit: boolean) => {
    const g = gesture.current
    gesture.current = null
    if (!g) return
    clearTimeout(g.timer)
    cancelAnimationFrame(frameRequest.current)
    window.removeEventListener("pointermove", onPointerMove)
    window.removeEventListener("pointerup", onPointerUp)
    window.removeEventListener("pointercancel", onPointerCancel)
    if (!g.dragging) return
    setLive((current) => {
      if (commit && current) {
        // 끈 그림도 영역 안으로 들이고, 남은 겹침을 한 번 더 푼다.
        const settled = relaxCircles(toCircles(current.spots), {
          bounds,
          pinned: g.id,
          gap: GAP,
        })
        save(
          key,
          settled.map((c): SavedSpot => ({
            id: c.id,
            cx: c.x / frame.width,
            cy: c.y / frame.height,
          }))
        )
      }
      return null
    })
  }

  function onPointerMove(event: PointerEvent) {
    const g = gesture.current
    if (!g || event.pointerId !== g.pointerId) return
    const distance = Math.hypot(
      event.clientX - g.startX,
      event.clientY - g.startY
    )
    if (!g.dragging) {
      if (distance < TAP_SLOP) return
      // 손가락은 길게 누르기 전에 움직이면 스크롤로 넘긴다.
      if (g.pointerType === "touch") return end(false)
      startDrag(g)
    }
    moveTo(g, event.clientX, event.clientY)
  }
  function onPointerUp() {
    end(true)
  }
  function onPointerCancel() {
    end(false)
  }

  const onPointerDown = (event: React.PointerEvent, id: string) => {
    if (event.button !== 0 || gesture.current) return
    suppressClick.current = false
    const point = toFrame(event.clientX, event.clientY)
    const center = spots.get(id)!
    const g: Gesture = {
      id,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      grabX: point.x - center.cx * frame.width,
      grabY: point.y - center.cy * frame.height,
      from: new Map(spots),
      dragging: false,
    }
    if (event.pointerType === "touch")
      g.timer = setTimeout(
        () => gesture.current === g && startDrag(g),
        LONG_PRESS_MS
      )
    gesture.current = g
    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    window.addEventListener("pointercancel", onPointerCancel)
  }

  useEffect(() => () => end(false), []) // eslint-disable-line react-hooks/exhaustive-deps -- 언마운트 정리

  return (
    <div
      ref={field}
      // isolate: 그림·"원래대로"의 z-index를 이 안에서만 쓴다(위에 붙는 헤더를 넘지 않게).
      className={cn(
        "@container relative isolate w-full touch-pan-y select-none",
        // 데스크톱은 끌어 놓을 수 있는 범위를 점선 판으로 보여 준다. outline이라 판 크기(= 끌기 범위 좌표)는 그대로다.
        frameName === "desktop" &&
          "rounded-xl bg-surface/50 outline outline-1 -outline-offset-1 outline-silver outline-dashed",
        className
      )}
      style={{ aspectRatio: seed.aspect }}
    >
      {frameName === "desktop" && (
        <PatternBackground
          variant="dots"
          spacing={18}
          opacity={0.4}
          className="absolute inset-0 -z-10 rounded-xl"
        />
      )}
      {seed.items.map((item) => {
        const food = byId.get(item.id)!
        const spot = spots.get(item.id)!
        const dragging = live?.dragging === item.id
        const px = item.size * frame.width
        // 라벨 크기: 그림이 크면 크게(명세 3.1). 기준 px를 프레임 폭 비율(cqi)로 바꿔 함께 확대·축소한다.
        const labelPx = px > 90 ? 15 : px > 55 ? 12 : 10
        return (
          <Link
            key={item.id}
            href={routes.seasonal.food(item.id)}
            draggable={false}
            onPointerDown={(event) => onPointerDown(event, item.id)}
            onClick={(event) => {
              if (suppressClick.current) event.preventDefault()
            }}
            onContextMenu={(event) => {
              if (gesture.current) event.preventDefault()
            }}
            className={cn(
              "absolute block text-ink no-underline [-webkit-touch-callout:none] hover:text-ink",
              dragging
                ? "cursor-grabbing drop-shadow-lg"
                : "cursor-grab motion-safe:transition-[left,top] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(.34,1.4,.64,1)]"
            )}
            style={{
              left: `${(spot.cx - item.size / 2) * 100}%`,
              top: `${(spot.cy - (item.size * seed.aspect) / 2) * 100}%`,
              width: `${item.size * 100}%`,
              zIndex: dragging ? 10 : item.z,
              rotate: `${item.rotate}deg`,
              scale: dragging ? 1.08 : undefined,
            }}
          >
            <span className="relative block">
              <FoodImage
                food={food}
                sizes={`${Math.round(px * 1.5)}px`}
                showName={false}
              />
              <EatenBadge
                year={year}
                foodId={food.id}
                className="in-data-[eaten-mark=off]:hidden"
              />
            </span>
            <span
              className="block text-center leading-tight font-semibold whitespace-nowrap"
              style={{ fontSize: `${(labelPx / frame.width) * 100}cqi` }}
            >
              {food.name}
            </span>
          </Link>
        )
      })}
      {saved && !live && (
        <button
          type="button"
          onClick={() => reset(key)}
          className="absolute right-0 bottom-0 z-20 flex items-center gap-1 rounded-full border border-hairline bg-canvas/90 px-2.5 py-1 text-xs text-stone backdrop-blur hover:text-ink"
        >
          <RotateCcw aria-hidden size={12} strokeWidth={1.8} />
          원래대로
        </button>
      )}
    </div>
  )
}
