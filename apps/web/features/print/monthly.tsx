import { foodsInMonth } from "@workspace/seasonal/data/foods"
import { formatMonthLabel, MONTHS, type Month } from "@workspace/seasonal/data/months"
import type { Food } from "@workspace/seasonal/data/foods"
import { monthChecklist, monthFoods, stripFoods, yearFoods, yearFoodsByMonth } from "@workspace/seasonal/print/foods"
import { chartFoods, chartLines } from "@workspace/seasonal/print/period-chart"
import { CALENDAR_TEXT_SCALE, type MonthlySpec, type Paper } from "@workspace/seasonal/print/spec"

import { CheckList } from "./parts/check-list"
import { DayColumn } from "./parts/day-column"
import { FoodArea, flowSize } from "./parts/food-area"
import { FoodFigure } from "./parts/food-figure"
import { PeriodChartColumns } from "./parts/period-chart"
import { PrintCalendar } from "./parts/print-calendar"
import { Sheet } from "./parts/sheet"
import { innerSize, monthSeason, surfaceColor, t, u } from "./parts/units"

// 월간 달력: 한 장에 한 달(위 그림, 아래 달력). 12개월 묶음은 표지 + 열두 장이다.
// side-check(M-B)는 달력 오른쪽에 그 달 품종 체크 목록을 세로로 둔다(세로 용지만).
// strip(M-D)은 일정을 적는 큰 칸 격자 달력에 그림 띠(세로는 위, 가로는 왼쪽)를 붙이고, 1일 앞·말일 뒤 빈 칸에도 그림을 넣는다.
// allover(M-E)는 그림을 판 전체에 흩뿌리고, 달력은 세로에서 오른쪽 아래 모서리 블록, 가로에서 오른쪽 날짜 한 열로 줄인다. 치수는 A4 기준 용지 단위(innerSize).

const HEADER = 26
const MEMO = 34
/** M-B 체크 목록의 폭·제목 높이와 달력과의 간격 */
const SIDE = { width: 52, title: 8, gap: 6 } as const
/** M-D 그림 띠: 품종 수, 세로 용지의 띠 높이, 가로 용지의 띠 폭, 달력과의 간격. 띠 14개와 빈 칸이면 2027년 모든 달의 그림 있는 품종이 들어간다(stripFoods 테스트). */
const STRIP = { size: 14, height: 44, width: 48, gap: 5 } as const
/** M-E: 세로의 모서리 달력 블록 크기·안쪽 여백, 가로의 날짜 열 폭, 그림과의 간격 */
/** C-2 표지: 머리(제목·연도) 높이, 달 칸 사이 간격·안쪽 여백·달 표기 높이, 칸마다 그림 수 */
const MONTHS_COVER = { header: 40, gap: 4, padding: 3, label: 7, perMonth: 2 } as const
/**
 * C-3 표지: 막대표 단 수와 단 사이 간격. 그림 있는 품종 67개를 모두 싣는다(월간에는 카테고리 옵션이 없고, 표지는 1년 전체를 보여 주는 쪽이다).
 * 머리가 C-2와 같은 40mm라 A4 줄 높이가 세로 2단 약 6.3mm, 가로 3단 약 5.8mm이고, 이름은 둘 다 상한인 약 9pt다.
 */
const CHART_COVER = { columns: { portrait: 2, landscape: 3 }, gap: 8 } as const
const ALLOVER = { block: { width: 100, height: 88, padding: 4 }, column: 34, gap: 6 } as const

export function MonthlySheets({ spec, paper }: { spec: MonthlySpec; paper: Paper }) {
  return (
    <>
      {spec.cover === "year" && <Cover spec={spec} paper={paper} />}
      {spec.cover === "months" && <MonthsCover spec={spec} paper={paper} />}
      {spec.cover === "chart" && <ChartCover spec={spec} paper={paper} />}
      {MONTHS.map((month) =>
        spec.layout === "strip" ? (
          <StripSheet key={month} spec={spec} paper={paper} month={month} />
        ) : spec.layout === "allover" ? (
          <AlloverSheet key={month} spec={spec} paper={paper} month={month} />
        ) : (
          <MonthSheet key={month} spec={spec} paper={paper} month={month} />
        ),
      )}
    </>
  )
}

function MonthSheet({ spec, paper, month }: { spec: MonthlySpec; paper: Paper; month: Month }) {
  const inner = innerSize(spec)
  const portrait = spec.orientation === "portrait"
  const foods = spec.layout === "none" ? [] : monthFoods(month, { max: spec.foods.max, categories: [] })
  const showFoods = spec.layout !== "none"
  const sideCheck = spec.layout === "side-check"

  const food = portrait
    ? { width: inner.width, height: showFoods ? 112 : 0 }
    : { width: showFoods ? 128 : 0, height: inner.height - HEADER }
  const gap = showFoods ? 8 : 0
  const side = portrait
    ? { width: inner.width, height: inner.height - HEADER - food.height - gap }
    : { width: inner.width - food.width - gap, height: inner.height - HEADER }
  const memo = sideCheck || spec.memo === "none" ? 0 : MEMO
  const calendarWidth = sideCheck ? side.width - SIDE.width - SIDE.gap : side.width
  const dayFont = (portrait ? 5.6 : 5) * CALENDAR_TEXT_SCALE[spec.calendar.size]

  return (
    <Sheet spec={spec} paper={paper} background={surfaceColor(spec.surface, monthSeason(month))}>
      <MonthHeader spec={spec} month={month} />
      <div style={{ display: "flex", flexDirection: portrait ? "column" : "row", gap: u(gap) }}>
        {showFoods && (
          <FoodArea
            foods={foods}
            width={food.width}
            height={food.height}
            layout={spec.layout === "grid" ? "flow" : "scatter"}
            month={month}
            showName={spec.foods.names === "korean"}
            nameSize={3.2}
          />
        )}
        <div style={{ width: u(side.width), display: "flex", gap: u(SIDE.gap) }}>
          <div style={{ width: u(calendarWidth), display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <PrintCalendar
              year={spec.year}
              month={month}
              weekStart={spec.calendar.weekStart}
              weekday={spec.calendar.weekday}
              holidays={spec.calendar.holidays}
              variant={spec.calendar.variant}
              dayFont={dayFont}
              height={side.height - memo}
            />
            {memo > 0 && spec.memo !== "none" && <Memo kind={spec.memo} month={month} height={memo} />}
          </div>
          {sideCheck && <SideChecklist month={month} height={side.height} />}
        </div>
      </div>
    </Sheet>
  )
}

function StripSheet({ spec, paper, month }: { spec: MonthlySpec; paper: Paper; month: Month }) {
  const inner = innerSize(spec)
  const portrait = spec.orientation === "portrait"
  const { strip, blanks } = stripFoods({ year: spec.year, month, weekStart: spec.calendar.weekStart, stripSize: STRIP.size })
  const showName = spec.foods.names === "korean"
  const band = portrait ? { width: inner.width, height: STRIP.height } : { width: STRIP.width, height: inner.height - HEADER }
  const calendar = portrait
    ? { width: inner.width, height: inner.height - HEADER - STRIP.height - STRIP.gap }
    : { width: inner.width - STRIP.width - STRIP.gap, height: inner.height - HEADER }
  // 날짜는 칸 왼쪽 위에 작게 두고 나머지를 쓰는 자리로 남긴다.
  const dayFont = 4.6 * CALENDAR_TEXT_SCALE[spec.calendar.size]
  return (
    <Sheet spec={spec} paper={paper} background={surfaceColor(spec.surface, monthSeason(month))}>
      <MonthHeader spec={spec} month={month} />
      <div style={{ display: "flex", flexDirection: portrait ? "column" : "row", gap: u(STRIP.gap) }}>
        <FoodArea foods={strip} width={band.width} height={band.height} layout="flow" month={month} showName={showName} nameSize={2.8} />
        <div style={{ width: u(calendar.width) }}>
          <PrintCalendar
            year={spec.year}
            month={month}
            weekStart={spec.calendar.weekStart}
            weekday={spec.calendar.weekday}
            holidays={spec.calendar.holidays}
            variant="grid"
            dayFont={dayFont}
            height={calendar.height}
            renderBlank={(index, rowHeight) => blanks[index] && <BlankFood food={blanks[index]} width={calendar.width / 7} height={rowHeight} showName={showName} />}
          />
        </div>
      </div>
    </Sheet>
  )
}

function AlloverSheet({ spec, paper, month }: { spec: MonthlySpec; paper: Paper; month: Month }) {
  const inner = innerSize(spec)
  const foods = monthFoods(month, { max: spec.foods.max, categories: [] })
  const showName = spec.foods.names === "korean"
  const scale = CALENDAR_TEXT_SCALE[spec.calendar.size]
  const background = surfaceColor(spec.surface, monthSeason(month))

  if (spec.orientation === "landscape") {
    const art = { width: inner.width - ALLOVER.column - ALLOVER.gap, height: inner.height - HEADER }
    return (
      <Sheet spec={spec} paper={paper} background={background}>
        <div style={{ display: "flex", gap: u(ALLOVER.gap) }}>
          <div style={{ width: u(art.width) }}>
            <MonthHeader spec={spec} month={month} />
            <FoodArea foods={foods} width={art.width} height={art.height} layout="scatter" month={month} showName={showName} />
          </div>
          {/* 31일이면 줄 높이가 A4 6mm. 날짜 A4 약 10.8pt, 요일 7.5pt, 공휴일 이름 6.5pt(보통 크기). 크게(1.2배)·글자 크게(1.1배)여도 줄 안에 든다 */}
          <DayColumn
            year={spec.year}
            month={month}
            weekday={spec.calendar.weekday}
            holidays={spec.calendar.holidays}
            dayFont={3.8 * scale}
            width={ALLOVER.column}
            height={inner.height}
          />
        </div>
      </Sheet>
    )
  }

  const art = { width: inner.width, height: inner.height - HEADER }
  const { block, gap } = ALLOVER
  // 블록 왼쪽·위로 간격만큼 더 비워 그림이 블록에 붙지 않게 한다.
  const avoid = { x: art.width - block.width - gap, y: art.height - block.height - gap, width: block.width + gap, height: block.height + gap }
  return (
    <Sheet spec={spec} paper={paper} background={background}>
      <MonthHeader spec={spec} month={month} />
      <div style={{ position: "relative", width: u(art.width), height: u(art.height) }}>
        <FoodArea foods={foods} width={art.width} height={art.height} layout="scatter" month={month} showName={showName} avoid={[avoid]} />
        <div className="print-calendar-block" style={{ width: u(block.width), height: u(block.height), padding: u(block.padding) }}>
          <PrintCalendar
            year={spec.year}
            month={month}
            weekStart={spec.calendar.weekStart}
            weekday={spec.calendar.weekday}
            holidays={spec.calendar.holidays}
            variant={spec.calendar.variant}
            dayFont={blockDayFont(spec, block.height - block.padding * 2)}
            height={block.height - block.padding * 2}
          />
        </div>
      </div>
    </Sheet>
  )
}

/**
 * M-E 모서리 블록의 날짜 크기. 보통은 4.6(A4 약 13pt) × 달력 글자 배율이지만, 블록이 작아 6주짜리 달에 공휴일 이름까지 들어간 줄이
 * 칸을 넘지 않게 상한을 둔다. 줄 하나 = 날짜(editorial은 1.4배) + 공휴일 이름(0.48) + 위아래 여백(약 0.65), 요일 줄 = 1.3(PrintCalendar와 같은 비율).
 */
function blockDayFont(spec: MonthlySpec, height: number): number {
  const digit = spec.calendar.variant === "editorial" ? 1.4 : 1
  const row = spec.type.scale * (digit + 0.48) + 0.65
  // tiles는 칸 사이 간격(0.8)이 줄마다 더 든다.
  const spacing = spec.calendar.variant === "tiles" ? 0.8 * 7 : 0
  return Math.min(4.6 * CALENDAR_TEXT_SCALE[spec.calendar.size], (height - spacing) / (6 * row + 1.3))
}

/** 빈 날짜 칸 하나에 그림 하나. 칸 가운데에 놓는다. */
function BlankFood({ food, width, height, showName }: { food: Food; width: number; height: number; showName: boolean }) {
  const nameSize = 2.4
  const size = Math.min(width * 0.62, (height - (showName ? nameSize * 1.6 : 0)) * 0.7)
  return (
    <div style={{ height: u(height * 0.9), display: "flex", alignItems: "center", justifyContent: "center" }}>
      <FoodFigure food={food} size={size} nameSize={nameSize} showName={showName} style={{ position: "static" }} />
    </div>
  )
}

function MonthHeader({ spec, month }: { spec: MonthlySpec; month: Month }) {
  const big = spec.monthLabel === "number"
  return (
    <header style={{ height: u(HEADER), display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
      <h2
        className={big ? "print-number" : "print-heading"}
        style={{ margin: 0, fontSize: t(big ? 20 : 12), lineHeight: 1, fontWeight: big ? 500 : 700, color: `var(--color-season-${monthSeason(month)})` }}
      >
        {formatMonthLabel(month, spec.monthLabel, "long")}
      </h2>
      <span className="print-number" style={{ fontSize: t(4), color: "var(--color-caption)", letterSpacing: "0.08em" }}>
        {spec.year}
      </span>
    </header>
  )
}

/** 달력 아래 여백. lines는 메모 줄, eaten-check는 그 달 품종 이름 옆에 손으로 체크할 빈 칸이다. */
function Memo({ kind, month, height }: { kind: "lines" | "eaten-check"; month: Month; height: number }) {
  if (kind === "lines")
    return (
      <div style={{ height: u(height), display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: u(7) }}>
        {[0, 1, 2, 3].map((line) => (
          <div key={line} style={{ borderBottom: "var(--line) solid var(--color-hairline)" }} />
        ))}
      </div>
    )
  return <CheckList foods={foodsInMonth(month)} columns={4} fontSize={2.8} style={{ height: u(height), paddingTop: u(4) }} />
}

/** M-B: 그 달 품종 전체(그림 없는 품종 포함)를 한 줄에 하나씩. 품종이 많은 달은 글자를 줄여 높이에 맞춘다. */
function SideChecklist({ month, height }: { month: Month; height: number }) {
  const foods = monthChecklist(month, [])
  const fontSize = Math.min(3.2, (height - SIDE.title) / (Math.max(foods.length, 1) * 1.6 * 1.05))
  return (
    <aside style={{ width: u(SIDE.width), flex: "none", paddingLeft: u(SIDE.gap * 0.6), borderLeft: "var(--line) solid var(--color-hairline)", boxSizing: "border-box" }}>
      <h3 className="print-heading" style={{ height: u(SIDE.title), margin: 0, fontSize: t(3.6), fontWeight: 700, color: `var(--color-season-${monthSeason(month)})` }}>
        이달의 제철
      </h3>
      <CheckList foods={foods} columns={1} fontSize={fontSize} />
    </aside>
  )
}

function Cover({ spec, paper }: { spec: MonthlySpec; paper: Paper }) {
  const inner = innerSize(spec)
  const picks = yearFoods({ max: 1, categories: [] })
  return (
    <Sheet spec={spec} paper={paper} background={surfaceColor(spec.surface === "season" ? "cream" : spec.surface)}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: u(10) }}>
        <p className="print-heading" style={{ margin: 0, fontSize: t(6), letterSpacing: "0.2em", color: "var(--color-forest)" }}>
          제철 달력
        </p>
        <p className="print-number" style={{ margin: 0, fontSize: t(spec.orientation === "portrait" ? 56 : 44), lineHeight: 1, color: "var(--color-forest)" }}>
          {spec.year}
        </p>
        <FoodArea foods={picks} width={inner.width} height={inner.height * 0.32} layout="flow" month={0} showName={false} />
      </div>
    </Sheet>
  )
}

/** C-2: 큰 연도 아래 열두 달 칸(세로 3×4, 가로 4×3). 칸마다 그 달 대표 품종 둘(yearFoodsByMonth, 앞 달과 겹치지 않음)과 달 표기. */
function MonthsCover({ spec, paper }: { spec: MonthlySpec; paper: Paper }) {
  const inner = innerSize(spec)
  const portrait = spec.orientation === "portrait"
  const { header, gap, padding, label, perMonth } = MONTHS_COVER
  const [columns, rows] = portrait ? [3, 4] : [4, 3]
  const cell = { width: (inner.width - gap * (columns - 1)) / columns, height: (inner.height - header - gap * (rows - 1)) / rows }
  const art = { width: cell.width - padding * 2, height: cell.height - padding * 2 - label }
  const picks = yearFoodsByMonth({ max: perMonth, categories: [] })
  // 칸마다 그림 수가 같아도 한두 개로 다를 수 있어, 그림 크기를 가장 작은 칸에 맞춘다.
  const size = Math.min(...picks.map((foods) => flowSize(foods.length, art.width, art.height, 0)))
  return (
    <Sheet spec={spec} paper={paper} background={surfaceColor(spec.surface === "season" ? "cream" : spec.surface)}>
      <CoverHeader year={spec.year} height={header} gap={gap} />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, ${u(cell.width)})`, gap: u(gap) }}>
        {MONTHS.map((month, i) => (
          <section
            key={month}
            style={{ height: u(cell.height), padding: u(padding), boxSizing: "border-box", borderRadius: u(2), background: surfaceColor("season", monthSeason(month)) }}
          >
            <FoodArea foods={picks[i]!} width={art.width} height={art.height} layout="flow" month={month} showName={false} maxSize={size} />
            <p
              className={spec.monthLabel === "korean" ? "print-heading" : "print-number"}
              style={{ height: u(label), margin: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", fontSize: t(5), lineHeight: 1, color: `var(--color-season-${monthSeason(month)})` }}
            >
              {formatMonthLabel(month, spec.monthLabel, "long")}
            </p>
          </section>
        ))}
      </div>
    </Sheet>
  )
}

/** C-3: 큰 연도 아래 그림 있는 품종 전부의 제철 막대표(세로 2단, 가로 3단). 달을 넘기기 전에 1년 흐름을 본다. */
function ChartCover({ spec, paper }: { spec: MonthlySpec; paper: Paper }) {
  const inner = innerSize(spec)
  const { header, gap } = MONTHS_COVER
  return (
    <Sheet spec={spec} paper={paper} background={surfaceColor(spec.surface === "season" ? "cream" : spec.surface)}>
      <CoverHeader year={spec.year} height={header} gap={gap} />
      <PeriodChartColumns
        lines={chartLines(chartFoods([]))}
        columns={CHART_COVER.columns[spec.orientation]}
        width={inner.width}
        height={inner.height - header}
        gap={CHART_COVER.gap}
        monthLabel={spec.monthLabel}
      />
    </Sheet>
  )
}

/** C-2·C-3 표지 머리: 왼쪽 "제철 달력", 오른쪽 큰 연도. 아래 내용과 gap만큼 띄운다. */
function CoverHeader({ year, height, gap }: { year: number; height: number; gap: number }) {
  return (
    <header style={{ height: u(height), display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingBottom: u(gap), boxSizing: "border-box" }}>
      <p className="print-heading" style={{ margin: 0, fontSize: t(6), letterSpacing: "0.2em", color: "var(--color-forest)" }}>
        제철 달력
      </p>
      <p className="print-number" style={{ margin: 0, fontSize: t(28), lineHeight: 1, color: "var(--color-forest)" }}>
        {year}
      </p>
    </header>
  )
}
