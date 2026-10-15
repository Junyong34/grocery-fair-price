"use client"

import Link from "next/link"
import { RotateCcw } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

import { FOOD_BOTTOM } from "@workspace/seasonal/data/food-bounds.generated"
import type { Food } from "@workspace/seasonal/data/foods"
import {
  mergeSavedLayout,
  type SavedSpot,
} from "@workspace/seasonal/layout/merge-saved"
import {
  labelHeight,
  SCATTER_FRAMES,
  type ScatterFrame,
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
  type CalendarSpot,
} from "../stores/scatter-store"
import { useIsEaten } from "@/shared/eaten-store"
import { FoodImage } from "./food-image"

/** 이만큼(px) 움직이기 전까지는 탭이다. */
const TAP_SLOP = 6
/** 손가락은 이만큼(ms) 누르고 있어야 끌기가 시작된다. 그 전에 움직이면 화면 스크롤이다. */
const LONG_PRESS_MS = 250
/** 그림 사이에 남길 틈(프레임 px). */
const GAP = 2
/** 이름표 글자 크기(프레임 기준 px). 모든 품종이 같다. */
const LABEL_PX_MOBILE = 9.5
const LABEL_PX_DESKTOP = 14
/** 이름표와 그림 아래 끝 사이 간격(그림 크기 대비). */
const LABEL_GAP = 0.06
/** 그림 아래 끝을 모르는 품종(그림 없음)의 기본값. 이름 카드(원)는 상자를 끝까지 채운다. */
const DEFAULT_BOTTOM = 1
/** 판 위 달력의 폭(판 폭 대비)과 처음 자리(왼쪽 위, 판 크기 대비). */
const CALENDAR_WIDTH = 0.45
const CALENDAR_HOME: CalendarSpot = { x: 0.53, y: 0.04 }

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
  /** 이 제스처가 window에 건 리스너를 뗀다. 리스너는 렌더마다 새 함수라 건 쪽이 직접 들고 있는다. */
  detach?: () => void
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
  children,
  seed,
  foods,
  year,
  className,
}: {
  month: number
  frame: keyof typeof SCATTER_FRAMES
  /** 판 위(그림 아래)에 깔 내용. 오른쪽 45%에 놓인다(desktopMonth의 달력). */
  children?: React.ReactNode
  seed: ScatterLayout
  foods: readonly Food[]
  year: number
  className?: string
}) {
  useHydrateScatter()
  const frame: ScatterFrame = SCATTER_FRAMES[frameName]
  const key = scatterKey(month, frameName)
  const saved = useScatterStore((state) => state.layouts[key])
  const save = useScatterStore((state) => state.save)
  const reset = useScatterStore((state) => state.reset)
  const savedCalendar = useScatterStore((state) => state.calendars?.[key])
  const saveCalendar = useScatterStore((state) => state.saveCalendar)

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
  // window가 아니라 이 판에만 건다. 막는 리스너가 있는 곳의 스크롤은 메인 스레드를 기다리므로 범위를 좁힌다.
  useEffect(() => {
    const el = field.current
    if (!el) return
    const onTouchMove = (event: TouchEvent) => {
      if (gesture.current?.dragging) event.preventDefault()
    }
    el.addEventListener("touchmove", onTouchMove, { passive: false })
    return () => el.removeEventListener("touchmove", onTouchMove)
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
    g.detach?.()
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
    g.detach = () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
      window.removeEventListener("pointercancel", onPointerCancel)
    }
  }

  // 판 위 달력 끌기. 그림과 달리 겹침을 풀지 않고 판 안에만 가둔다. 그림은 항상 달력 위에 놓인다.
  const calendarRef = useRef<HTMLDivElement>(null)
  const [calendarLive, setCalendarLive] = useState<CalendarSpot | null>(null)
  const calendarSpot = calendarLive ?? savedCalendar ?? CALENDAR_HOME

  const clampCalendar = (x: number, y: number): CalendarSpot => {
    const box = field.current!.getBoundingClientRect()
    const height = calendarRef.current!.offsetHeight / box.height
    return {
      x: Math.min(Math.max(x, 0), 1 - CALENDAR_WIDTH),
      y: Math.min(Math.max(y, 0), Math.max(0, 1 - height)),
    }
  }

  const onCalendarPointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0 || gesture.current) return
    const box = field.current!.getBoundingClientRect()
    const from = calendarSpot
    const startX = event.clientX
    const startY = event.clientY
    let latest = from
    const move = (e: PointerEvent) => {
      latest = clampCalendar(
        from.x + (e.clientX - startX) / box.width,
        from.y + (e.clientY - startY) / box.height
      )
      setCalendarLive(latest)
    }
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", up)
      saveCalendar(key, latest)
      setCalendarLive(null)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", up)
  }

  useEffect(() => () => end(false), []) // eslint-disable-line react-hooks/exhaustive-deps -- 언마운트 정리

  return (
    <div
      ref={field}
      // isolate: 그림·"원래대로"의 z-index를 이 안에서만 쓴다(위에 붙는 헤더를 넘지 않게).
      className={cn(
        "@container relative isolate w-full touch-pan-y select-none",
        // 끌어 놓을 수 있는 범위를 점선 판으로 보여 준다. outline이라 판 크기(= 끌기 범위 좌표)는 그대로다.
        "rounded-xl bg-surface/20 outline outline-1 -outline-offset-1 outline-silver/60 outline-dashed",
        className
      )}
      style={{ aspectRatio: seed.aspect }}
    >
      <PatternBackground
        variant="dots"
        spacing={32}
        opacity={0.2}
        className="absolute inset-0 -z-10 rounded-xl"
      />
      {children && frame.reserveBottom && (
        // 모바일 달 판: 달력은 아래 칸에 고정이고 끌 수 없다. 그림만 그 위에 놓을 수 있다.
        <div
          className="absolute inset-x-0 z-0 px-2"
          style={{ top: `${((frame.height - frame.reserveBottom) / frame.height) * 100}%` }}
        >
          {children}
        </div>
      )}
      {children && !frame.reserveBottom && (
        // 달력은 판 위에 얹히고, 그림은 그 위에 스티커처럼 놓인다. 달력도 끌어 옮길 수 있다.
        <div
          ref={calendarRef}
          onPointerDown={onCalendarPointerDown}
          className={cn(
            "absolute z-0 touch-none",
            calendarLive ? "cursor-grabbing" : "cursor-grab"
          )}
          style={{
            left: `${calendarSpot.x * 100}%`,
            top: `${calendarSpot.y * 100}%`,
            width: `${CALENDAR_WIDTH * 100}%`,
          }}
        >
          {children}
        </div>
      )}
      {seed.items.map((item) => {
        const food = byId.get(item.id)!
        const spot = spots.get(item.id)!
        const dragging = live?.dragging === item.id
        const px = item.size * frame.width
        // 라벨 크기는 그림 크기와 상관없이 같다. 기준 px를 프레임 폭 비율(cqi)로 바꿔 함께 확대·축소한다.
        const labelPx = frameName === "mobile" ? LABEL_PX_MOBILE : LABEL_PX_DESKTOP
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
            <FoodTile
              food={food}
              year={year}
              px={px}
              fontSize={`${(labelPx / frame.width) * 100}cqi`}
              frameWidth={frame.width}
            />
          </Link>
        )
      })}
      {(saved || (savedCalendar && !frame.reserveBottom)) && !live && (
        <button
          type="button"
          onClick={() => reset(key)}
          className={cn(
            "absolute z-20 flex items-center gap-1 rounded-full border border-hairline bg-canvas/90 px-2.5 py-1 text-xs text-stone backdrop-blur hover:text-ink",
            // 달 판은 오른쪽 아래가 달력 자리라 왼쪽 아래에 둔다.
            frameName === "desktopMonth" ? "bottom-2 left-2" : frameName === "mobileMonth" ? "top-2 right-2" : "right-0 bottom-0"
          )}
        >
          <RotateCcw aria-hidden size={12} strokeWidth={1.8} />
          원래대로
        </button>
      )}
    </div>
  )
}

/**
 * 판 위 그림 하나(그림 + 이름). 먹은 품종은 이름 앞에 ✓가 붙는다. ⚙에서 먹음 표시를 끄면 보이지 않는다(in-data-[eaten-mark=off]).
 */
function FoodTile({
  food,
  year,
  px,
  fontSize,
  frameWidth,
}: {
  food: Food
  year: number
  px: number
  fontSize: string
  frameWidth: number
}) {
  const eaten = useIsEaten(year, food.id)
  // 그림은 정사각형 상자 안에서 아래가 비는 정도가 품종마다 달라(생선은 많이 빔) 이름표가 멀어 보인다.
  // 그림 아래 끝(food-bounds)에서 LABEL_GAP만 띄우도록 이름표를 끌어올린다.
  const bottom = FOOD_BOTTOM[food.id] ?? DEFAULT_BOTTOM
  const marginTop = `${(-(1 - bottom - LABEL_GAP) * px * 100) / frameWidth}cqi`
  return (
    <>
      <span className="block">
        <FoodImage
          food={food}
          sizes={`${Math.round(px * 1.5)}px`}
          showName={false}
        />
      </span>
      <span
        className="block text-center leading-tight font-semibold whitespace-nowrap"
        style={{ fontSize, marginTop }}
      >
        {eaten && (
          <span
            aria-hidden
            className="mr-[0.2em] text-gold-deep in-data-[eaten-mark=off]:hidden motion-safe:animate-tick"
          >
            ✓
          </span>
        )}
        {food.name}
        {eaten && <span className="sr-only"> 먹음</span>}
      </span>
    </>
  )
}
