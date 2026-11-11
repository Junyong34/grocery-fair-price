import { FOOD_BOTTOM } from "@workspace/seasonal/data/food-bounds.generated"
import type { Food } from "@workspace/seasonal/data/foods"
import {
  labelFontPx,
  SCATTER_FRAMES,
  type ScatterFrame,
  scatterLayout,
} from "@workspace/seasonal/layout/scatter"
import { PatternBackground } from "@workspace/ui/components/pattern-background"
import { cn } from "@workspace/ui/lib/utils"

import { routes } from "@/shared/routes"

import { CalendarFit } from "./calendar-fit"
import { EatenName } from "./eaten-name"
import { FoodImage } from "./food-image"
import { IntentLink } from "./intent-link"

/** 이름표와 그림 아래 끝 사이 간격(그림 크기 대비). */
const LABEL_GAP = 0.06
/** 그림 아래 끝을 모르는 품종(그림 없음)의 기본값. 이름 카드(원)는 상자를 끝까지 채운다. */
const DEFAULT_BOTTOM = 1
/** 판 위 달력 자리(오른쪽 아래): 오른쪽 끝에서 띄울 폭(판 폭 대비)과 아래 끝에서 띄울 높이(판 높이 대비). */
const CALENDAR_INSET = { right: 0.02, bottom: 0.03 }

/**
 * 흩어진 품종 그림(명세 3.1 ①). 시드 배치를 서버에서 계산해 그대로 그린다. 그림을 누르면 품종 상세로 간다.
 * 끌어 옮기기는 없앴다(.scratch/seasonal-render-perf/spec.md 2.2). 12개월 판을 하이드레이션하던 비용을 덜기 위해서다.
 */
export function ScatterField({
  month,
  foods,
  frame: frameName,
  children,
  year,
  className,
}: {
  month: number
  foods: readonly Food[]
  frame: keyof typeof SCATTER_FRAMES
  /** 판 위(그림 아래)에 깔 내용. 달 판의 달력이다. */
  children?: React.ReactNode
  year: number
  className?: string
}) {
  const frame: ScatterFrame = SCATTER_FRAMES[frameName]
  const seed = scatterLayout({
    month,
    ids: foods.map((food) => food.id),
    frame,
  })
  const byId = new Map<string, Food>(foods.map((food) => [food.id, food]))
  // 라벨 크기는 그림 크기와 상관없이 같다. 기준 px를 프레임 폭 비율(cqi)로 바꿔 판과 함께 확대·축소한다.
  const fontSize = `${(labelFontPx(frame) / frame.width) * 100}cqi`

  return (
    <div
      // isolate: 그림의 z-index를 이 안에서만 쓴다(위에 붙는 헤더를 넘지 않게).
      className={cn("@container relative isolate w-full rounded-xl bg-surface/20", className)}
      style={{ aspectRatio: seed.aspect }}
    >
      <PatternBackground variant="dots" spacing={32} opacity={0.2} className="absolute inset-0 -z-10 rounded-xl" />
      {children && frame.reserveBottom && (
        // 모바일 달 판: 달력은 판 바닥에 붙는다. 375 화면 크기로 그리고 판 폭에 맞춰 키운다.
        <CalendarFit>{children}</CalendarFit>
      )}
      {children && !frame.reserveBottom && (
        // 데스크톱 달 판: 달력은 시드가 비워 둔 오른쪽(reserveRight) 아래에 얹히고, 그림이 그 위에 놓인다.
        <div
          className="absolute z-0"
          style={{
            right: `${CALENDAR_INSET.right * 100}%`,
            bottom: `${CALENDAR_INSET.bottom * 100}%`,
            width: `${((frame.reserveRight ?? 0) / frame.width) * 100}%`,
          }}
        >
          {children}
        </div>
      )}
      {seed.items.map((item) => {
        const food = byId.get(item.id)!
        const px = item.size * frame.width
        // 그림은 정사각형 상자 안에서 아래가 비는 정도가 품종마다 달라(생선은 많이 빔) 이름표가 멀어 보인다.
        // 그림 아래 끝(food-bounds)에서 LABEL_GAP만 띄우도록 이름표를 끌어올린다.
        const bottom = FOOD_BOTTOM[food.id] ?? DEFAULT_BOTTOM
        const marginTop = `${(-(1 - bottom - LABEL_GAP) * px * 100) / frame.width}cqi`
        return (
          <IntentLink
            key={item.id}
            href={routes.seasonal.food(item.id)}
            className="absolute block text-ink no-underline hover:text-ink"
            style={{
              left: `${(item.cx - item.size / 2) * 100}%`,
              top: `${(item.cy - (item.size * seed.aspect) / 2) * 100}%`,
              width: `${item.size * 100}%`,
              zIndex: item.z,
              rotate: `${item.rotate}deg`,
            }}
          >
            <span className="block">
              <FoodImage food={food} showName={false} />
            </span>
            <span className="block text-center leading-tight font-semibold whitespace-nowrap" style={{ fontSize, marginTop }}>
              <EatenName year={year} foodId={food.id}>{food.name}</EatenName>
            </span>
          </IntentLink>
        )
      })}
    </div>
  )
}
