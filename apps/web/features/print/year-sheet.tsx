import { formatMonthLabel, MONTHS, type Month } from "@workspace/seasonal/data/months"
import { monthFoods } from "@workspace/seasonal/print/foods"
import type { Paper, YearSheetSpec } from "@workspace/seasonal/print/spec"

import { FoodArea } from "./parts/food-area"
import { gridSize } from "./parts/grid"
import { PrintCalendar } from "./parts/print-calendar"
import { Sheet } from "./parts/sheet"
import { monthSeason, surfaceColor, t, u } from "./parts/units"

// 연간 달력 한 장: 달마다 그림 칸과 작은 달력이 한 쌍이다.
// 2x6은 한 줄에 두 달이고 그림·달력을 좌우로, 줄마다 순서를 바꿔 체크무늬로 놓는다. 3x4·4x3은 그림 위, 달력 아래.

const INNER = {
  portrait: { width: 186, height: 273 },
  landscape: { width: 273, height: 186 },
} as const
const HEADER = 18
const GAP = 3

export function YearSheet({ spec, paper }: { spec: YearSheetSpec; paper: Paper }) {
  const inner = INNER[spec.orientation]
  const { columns, rows } = gridSize(spec.grid)
  const cell = {
    width: (inner.width - GAP * (columns - 1)) / columns,
    height: (inner.height - HEADER - GAP * (rows - 1)) / rows,
  }
  return (
    <Sheet spec={spec} paper={paper} background={surfaceColor(spec.surface === "season" ? "white" : spec.surface)}>
      <header style={{ height: u(HEADER), display: "flex", alignItems: "baseline", gap: u(4) }}>
        <span className="print-number" style={{ fontSize: t(11), lineHeight: 1, color: "var(--color-forest)" }}>
          {spec.year}
        </span>
        <span className="print-heading" style={{ fontSize: t(4.5), color: "var(--color-forest)" }}>
          제철 달력
        </span>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, ${u(cell.width)})`, gap: u(GAP) }}>
        {MONTHS.map((month, i) => (
          <MonthCell key={month} spec={spec} month={month} width={cell.width} height={cell.height} flip={spec.grid === "2x6" && Math.floor(i / columns) % 2 === 1} />
        ))}
      </div>
    </Sheet>
  )
}

function MonthCell({ spec, month, width, height, flip }: { spec: YearSheetSpec; month: Month; width: number; height: number; flip: boolean }) {
  const sideBySide = spec.grid === "2x6"
  const food = sideBySide ? { width: width / 2, height } : { width, height: height * 0.46 }
  const calendar = sideBySide ? { width: width / 2, height } : { width, height: height - food.height }
  const monthLabel = spec.monthLabel === "big-number" ? undefined : spec.monthLabel
  const bigNumber = !monthLabel
  const label = bigNumber ? 0 : 5
  const dayFont = Math.min((calendar.width / 7) * 0.42, ((calendar.height - label) / 7.3) * 0.62)
  const season = monthSeason(month)

  const foodCell = (
    <div style={{ position: "relative", width: u(food.width), height: u(food.height), flex: "none" }}>
      {bigNumber && (
        <span
          className="print-number"
          style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: t(food.height * 0.62), lineHeight: 1, color: `color-mix(in oklab, var(--color-season-${season}) 32%, transparent)` }}
        >
          {month}
        </span>
      )}
      <FoodArea
        foods={monthFoods(month, { max: spec.foods.max, categories: [] })}
        width={food.width}
        height={food.height}
        layout="scatter"
        month={month}
        showName={spec.foods.names === "korean"}
        style={{ position: "absolute", inset: 0 }}
      />
    </div>
  )
  const calendarCell = (
    <div style={{ width: u(calendar.width), height: u(calendar.height), padding: `0 ${u(1)}`, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      {monthLabel && (
        <span className="print-heading" style={{ height: u(label), fontSize: t(3.6), fontWeight: 700, color: `var(--color-season-${season})` }}>
          {formatMonthLabel(month, monthLabel, "long")}
        </span>
      )}
      <PrintCalendar
        year={spec.year}
        month={month}
        weekStart={spec.calendar.weekStart}
        weekday={spec.calendar.weekday}
        holidays={spec.calendar.holidays}
        dayFont={dayFont}
        height={calendar.height - label - 2}
      />
    </div>
  )
  return (
    <div
      style={{
        display: "flex",
        flexDirection: sideBySide ? (flip ? "row-reverse" : "row") : "column",
        width: u(width),
        height: u(height),
        borderRadius: u(2),
        background: spec.surface === "season" ? surfaceColor("season", season) : undefined,
      }}
    >
      {foodCell}
      {calendarCell}
    </div>
  )
}
