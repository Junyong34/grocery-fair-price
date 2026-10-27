"use client"

import Link from "next/link"
import { RotateCcw } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

import { FOOD_BOTTOM } from "@workspace/seasonal/data/food-bounds.generated"
import type { Food } from "@workspace/seasonal/data/foods"
import {
  clampCalendar,
  moveSpot,
  restingSpots,
  settleSpots,
  type Spots,
} from "@workspace/seasonal/layout/arrangement"
import {
  labelFontPx,
  SCATTER_FRAMES,
  type ScatterFrame,
  type ScatterLayout,
} from "@workspace/seasonal/layout/scatter"
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
import { useDragGesture } from "./use-drag-gesture"

/** 이름표와 그림 아래 끝 사이 간격(그림 크기 대비). */
const LABEL_GAP = 0.06
/** 그림 아래 끝을 모르는 품종(그림 없음)의 기본값. 이름 카드(원)는 상자를 끝까지 채운다. */
const DEFAULT_BOTTOM = 1
/** 판 위 달력의 처음 자리(오른쪽 아래): 오른쪽 끝에서 띄울 폭(판 폭 대비)과 아래 끝에서 띄울 높이(판 높이 대비). */
const CALENDAR_INSET = { right: 0.02, bottom: 0.03 }

/** 끌고 있는 그림. 끌기 판단(탭 · 길게 누름 · 손가락 구분)은 useDragGesture가 한다. */
type FoodDrag = {
  id: string
  pointerType: string
  /** 그림 중심과 누른 점의 차이(프레임 px). 끄는 동안 그림이 손가락 아래에서 튀지 않게 한다. */
  grabX: number
  grabY: number
  from: Spots
  /** 끄는 동안 마지막으로 그린 자리. 놓을 때 이 자리를 저장한다. */
  spots: Spots
}

/** 끌고 있는 달력: 누를 때의 자리 · 크기(판 비율)와 누른 점(화면 px). */
type CalendarDrag = { from: CalendarSpot; size: { width: number; height: number }; startX: number; startY: number; box: DOMRect; latest: CalendarSpot }

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
  /** 판 위(그림 아래)에 깔 내용. 오른쪽 reserveRight 자리에 놓인다(desktopMonth의 달력). */
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
  // 쉬는 자리: 저장된 배치(새 품종 넣기 + 겹침 풀기) 또는 시드 배치.
  const rest = useMemo(
    () => restingSpots({ month, seed, saved, frame }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- frame은 frameName에서 정해진다.
    [saved, seed, month, frameName]
  )

  const [live, setLive] = useState<{
    spots: Spots
    dragging: string
  } | null>(null)
  const spots = live?.spots ?? rest

  const field = useRef<HTMLDivElement>(null)
  const food = useRef<FoodDrag | null>(null)
  const suppressClick = useRef(false)
  const frameRequest = useRef(0)

  const toFrame = (clientX: number, clientY: number) => {
    const rect = field.current!.getBoundingClientRect()
    const scale = rect.width / frame.width
    return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale }
  }

  const foodGesture = useDragGesture({
    onStart() {
      const g = food.current!
      suppressClick.current = true
      setLive({ spots: g.from, dragging: g.id })
      if (g.pointerType === "touch") navigator.vibrate?.(8)
    },
    onMove(clientX, clientY) {
      const g = food.current!
      const point = toFrame(clientX, clientY)
      const to = { cx: (point.x - g.grabX) / frame.width, cy: (point.y - g.grabY) / frame.height }
      // 한 프레임에 한 번만 계산한다.
      cancelAnimationFrame(frameRequest.current)
      frameRequest.current = requestAnimationFrame(() => {
        g.spots = moveSpot({ seed, frame, spots: g.from, id: g.id, to })
        setLive({ spots: g.spots, dragging: g.id })
      })
    },
    onDrop() {
      cancelAnimationFrame(frameRequest.current)
      // 저장(스토어 갱신)은 setLive 갱신 함수 밖에서 한다. 갱신 함수 안에서 다른 상태를 바꾸면 렌더 중 갱신이 된다.
      save(key, settleSpots({ seed, frame, spots: food.current!.spots }))
      setLive(null)
    },
    onCancel() {
      cancelAnimationFrame(frameRequest.current)
      setLive(null)
    },
  })

  // 끄는 동안 손가락 스크롤을 막는다. touchmove는 passive가 아니어야 preventDefault가 듣는다.
  // window가 아니라 이 판에만 건다. 막는 리스너가 있는 곳의 스크롤은 메인 스레드를 기다리므로 범위를 좁힌다.
  useEffect(() => {
    const el = field.current
    if (!el) return
    const onTouchMove = (event: TouchEvent) => {
      if (foodGesture.isDragging()) event.preventDefault()
    }
    el.addEventListener("touchmove", onTouchMove, { passive: false })
    return () => el.removeEventListener("touchmove", onTouchMove)
  }, [foodGesture])
  useEffect(() => () => cancelAnimationFrame(frameRequest.current), [])

  // 판 위 달력 끌기. 그림과 달리 겹침을 풀지 않고 판 안에만 가둔다. 그림은 항상 달력 위에 놓인다.
  const calendarRef = useRef<HTMLDivElement>(null)
  const calendar = useRef<CalendarDrag | null>(null)
  const [calendarLive, setCalendarLive] = useState<CalendarSpot | null>(null)
  // 달력 폭은 시드가 비워 둔 오른쪽 자리(reserveRight)와 같다.
  const calendarWidth = (frame.reserveRight ?? 0) / frame.width
  // 옮긴 적이 없으면 null이고 달력은 판 오른쪽 아래에 붙는다(달마다 주 수가 달라 높이를 미리 모른다).
  // 달력이 더 좁던 때 저장한 자리는 넓어진 달력이 판 밖으로 나가지 않게 가로로 당긴다.
  const calendarSpot: CalendarSpot | null =
    calendarLive ??
    (savedCalendar ? { ...savedCalendar, x: Math.min(savedCalendar.x, 1 - calendarWidth) } : null)

  const calendarGesture = useDragGesture({
    onStart() {
      setCalendarLive(calendar.current!.from)
    },
    onMove(clientX, clientY) {
      const c = calendar.current!
      c.latest = clampCalendar({ x: c.from.x + (clientX - c.startX) / c.box.width, y: c.from.y + (clientY - c.startY) / c.box.height }, c.size)
      setCalendarLive(c.latest)
    },
    onDrop() {
      saveCalendar(key, calendar.current!.latest)
      setCalendarLive(null)
    },
    onCancel() {
      setCalendarLive(null)
    },
  })
  const busy = () => foodGesture.isActive() || calendarGesture.isActive()

  const onPointerDown = (event: React.PointerEvent, id: string) => {
    if (event.button !== 0 || busy()) return
    suppressClick.current = false
    const point = toFrame(event.clientX, event.clientY)
    const center = spots.get(id)!
    food.current = {
      id,
      pointerType: event.pointerType,
      grabX: point.x - center.cx * frame.width,
      grabY: point.y - center.cy * frame.height,
      from: spots,
      spots,
    }
    foodGesture.begin(event, { waitForLongPress: true })
  }

  const onCalendarPointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0 || busy()) return
    const box = field.current!.getBoundingClientRect()
    const rect = calendarRef.current!.getBoundingClientRect()
    // 처음 자리(오른쪽 아래)에서 끌면 지금 그려진 위치를 왼쪽 위 기준 비율로 바꿔 시작한다.
    const from = calendarSpot ?? { x: (rect.left - box.left) / box.width, y: (rect.top - box.top) / box.height }
    calendar.current = {
      from,
      latest: from,
      size: { width: calendarWidth, height: rect.height / box.height },
      startX: event.clientX,
      startY: event.clientY,
      box,
    }
    // 달력은 touch-none이라 손가락도 바로 끈다.
    calendarGesture.begin(event, { waitForLongPress: false })
  }

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
        // 모바일 달 판: 달력은 판 바닥에 붙어 고정이고 끌 수 없다. 그림만 그 위에 놓을 수 있다.
        <div className="absolute inset-x-0 bottom-0 z-0 px-2 pb-2">
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
            ...(calendarSpot
              ? { left: `${calendarSpot.x * 100}%`, top: `${calendarSpot.y * 100}%` }
              : { right: `${CALENDAR_INSET.right * 100}%`, bottom: `${CALENDAR_INSET.bottom * 100}%` }),
            width: `${calendarWidth * 100}%`,
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
        const labelPx = labelFontPx(frame)
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
              if (foodGesture.isActive()) event.preventDefault()
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
