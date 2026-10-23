import { formatMonthLabel, MONTHS, type Month, type MonthLabelStyle } from "@workspace/seasonal/data/months"
import { monthFoods, yearFoods } from "@workspace/seasonal/print/foods"
import { chartLines } from "@workspace/seasonal/print/period-chart"
import { CALENDAR_TEXT_SCALE, type Paper, type YearSheetSpec } from "@workspace/seasonal/print/spec"

import { FoodArea } from "./parts/food-area"
import { gridSize } from "./parts/grid"
import { PeriodChartColumns } from "./parts/period-chart"
import { PrintCalendar } from "./parts/print-calendar"
import { Sheet } from "./parts/sheet"
import { innerSize, monthSeason, surfaceColor, t, u } from "./parts/units"

// 연간 달력 한 장.
// pairs(Y-A): 달마다 그림 칸과 작은 달력이 한 쌍이다. 2x6은 한 줄에 두 달이고 그림·달력을 좌우로, 줄마다 순서를 바꿔 체크무늬로 놓는다. 3x4·4x3은 그림 위, 달력 아래.
// hero-top(Y-B): 위에 1년치 품종을 한 판으로 흩뿌리고, 아래에 작은 달력 열두 개를 3x4로 놓는다(세로 용지만). 달마다 그림 칸이 없어 달력이 커진다.
// chart(Y-C): 위에 작은 달력 열둘(세로 4x3, 가로 6x2), 아래에 제철 막대표(세로 2단, 가로 3단). 날짜는 달력이, 제철은 막대표가 맡는다.

const HEADER = 18
const GAP = 3
/** Y-B 위 그림 판의 높이와 달마다 넣을 품종 수. 둘이면 24개가 작게 흩어져 큰 그림으로 보이지 않았다. */
const HERO = { height: 84, perMonth: 1 } as const
const HERO_GRID = { columns: 3, rows: 4 } as const
const LABEL = 5
/**
 * Y-C. 달력 칸 폭 약 44mm·높이 35~36mm면 A4 날짜가 약 7.2~7.5pt다(7pt 하한은 폭 41mm·높이 34mm).
 * 막대표 품종은 달마다 대표 넷(yearFoods, 48개)이다. 다른 막대표처럼 달마다 여섯(72개)이면 세로 2단 줄이 약 3.7mm(이름 약 6pt)라 줄였고,
 * 넷이면 이름이 세로 약 7.6pt, 가로 약 7.4pt다.
 */
const CHART = {
  perMonth: 4,
  grid: { portrait: { columns: 4, rows: 3, height: 36 }, landscape: { columns: 6, rows: 2, height: 35 } },
  columns: { portrait: 2, landscape: 3 },
  gap: 5,
  columnGap: 8,
} as const

export function YearSheet({ spec, paper }: { spec: YearSheetSpec; paper: Paper }) {
  const inner = innerSize(spec)
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
      {spec.layout === "hero-top" ? (
        <HeroTop spec={spec} />
      ) : spec.layout === "chart" ? (
        <CalendarsAndChart spec={spec} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, ${u(cell.width)})`, gap: u(GAP) }}>
          {MONTHS.map((month, i) => (
            <MonthCell key={month} spec={spec} month={month} width={cell.width} height={cell.height} flip={spec.grid === "2x6" && Math.floor(i / columns) % 2 === 1} />
          ))}
        </div>
      )}
    </Sheet>
  )
}

function HeroTop({ spec }: { spec: YearSheetSpec }) {
  const inner = innerSize(spec)
  const body = inner.height - HEADER - HERO.height - GAP
  const cell = {
    width: (inner.width - GAP * (HERO_GRID.columns - 1)) / HERO_GRID.columns,
    height: (body - GAP * (HERO_GRID.rows - 1)) / HERO_GRID.rows,
  }
  // 얹을 그림 칸이 없으니 big-number는 달력 위 숫자로 쓴다.
  const label = spec.monthLabel === "big-number" ? "number" : spec.monthLabel
  return (
    <>
      <FoodArea
        foods={yearFoods({ max: HERO.perMonth, categories: [] })}
        width={inner.width}
        height={HERO.height}
        layout="scatter"
        month={0}
        showName={spec.foods.names === "korean"}
        style={{ marginBottom: u(GAP) }}
      />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${HERO_GRID.columns}, ${u(cell.width)})`, gap: u(GAP) }}>
        {MONTHS.map((month) => (
          <div key={month} style={{ borderRadius: u(2), background: spec.surface === "season" ? surfaceColor("season", monthSeason(month)) : undefined }}>
            <CalendarBlock spec={spec} month={month} width={cell.width} height={cell.height} label={label} />
          </div>
        ))}
      </div>
    </>
  )
}

function CalendarsAndChart({ spec }: { spec: YearSheetSpec }) {
  const inner = innerSize(spec)
  const grid = CHART.grid[spec.orientation]
  const cellWidth = (inner.width - GAP * (grid.columns - 1)) / grid.columns
  const calendars = grid.height * grid.rows + GAP * (grid.rows - 1)
  // 얹을 그림 칸이 없으니 big-number는 달력 위 숫자로 쓴다.
  const label = spec.monthLabel === "big-number" ? "number" : spec.monthLabel
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${grid.columns}, ${u(cellWidth)})`, gap: u(GAP), marginBottom: u(CHART.gap) }}>
        {MONTHS.map((month) => (
          <div key={month} style={{ borderRadius: u(2), background: spec.surface === "season" ? surfaceColor("season", monthSeason(month)) : undefined }}>
            <CalendarBlock spec={spec} month={month} width={cellWidth} height={grid.height} label={label} />
          </div>
        ))}
      </div>
      <PeriodChartColumns
        lines={chartLines(yearFoods({ max: CHART.perMonth, categories: [] }))}
        columns={CHART.columns[spec.orientation]}
        width={inner.width}
        height={inner.height - HEADER - calendars - CHART.gap}
        gap={CHART.columnGap}
        monthLabel={label}
      />
    </>
  )
}

function MonthCell({ spec, month, width, height, flip }: { spec: YearSheetSpec; month: Month; width: number; height: number; flip: boolean }) {
  const sideBySide = spec.grid === "2x6"
  const food = sideBySide ? { width: width / 2, height } : { width, height: height * 0.46 }
  const calendar = sideBySide ? { width: width / 2, height } : { width, height: height - food.height }
  const monthLabel = spec.monthLabel === "big-number" ? undefined : spec.monthLabel
  const bigNumber = !monthLabel
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
  const calendarCell = <CalendarBlock spec={spec} month={month} width={calendar.width} height={calendar.height} label={monthLabel} />
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

/** 달 이름(없으면 생략)과 작은 달력. 날짜 크기는 칸에 맞춘다. */
function CalendarBlock({ spec, month, width, height, label }: { spec: YearSheetSpec; month: Month; width: number; height: number; label: MonthLabelStyle | undefined }) {
  const labelHeight = label ? LABEL : 0
  // 칸에 맞춘 크기에 달력 글자 배율을 곱한다. 키워도 두 자리 날짜가 옆 날짜와 붙지 않게, 인쇄 크기(t()가 type.scale을 곱한 값)가 칸 폭의 절반을 넘지 않는다.
  const fit = Math.min((width / 7) * 0.42, ((height - labelHeight) / 7.3) * 0.62)
  const dayFont = Math.min(fit * CALENDAR_TEXT_SCALE[spec.calendar.size], ((width / 7) * 0.5) / spec.type.scale)
  return (
    <div style={{ width: u(width), height: u(height), padding: `0 ${u(1)}`, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      {label && (
        <span className="print-heading" style={{ height: u(labelHeight), fontSize: t(3.6), fontWeight: 700, color: `var(--color-season-${monthSeason(month)})` }}>
          {formatMonthLabel(month, label, "long")}
        </span>
      )}
      <PrintCalendar
        year={spec.year}
        month={month}
        weekStart={spec.calendar.weekStart}
        weekday={spec.calendar.weekday}
        holidays={spec.calendar.holidays}
        dayFont={dayFont}
        height={height - labelHeight - 2}
      />
    </div>
  )
}
