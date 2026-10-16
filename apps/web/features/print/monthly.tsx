import { foodsInMonth } from "@workspace/seasonal/data/foods"
import { formatMonthLabel, MONTHS, type Month } from "@workspace/seasonal/data/months"
import { monthFoods } from "@workspace/seasonal/print/foods"
import type { MonthlySpec, PageKey, Paper } from "@workspace/seasonal/print/spec"

import { FoodArea } from "./parts/food-area"
import { PrintCalendar } from "./parts/print-calendar"
import { Sheet } from "./parts/sheet"
import { monthSeason, surfaceColor, t, u } from "./parts/units"

// 월간 달력: 한 장에 한 달(위 그림, 아래 달력). 12개월 묶음은 표지 + 열두 장이다.
// 치수는 A4 기준 용지 단위. 안쪽(여백 12를 뺀) 크기는 세로 186×273, 가로 273×186이다.

const INNER = {
  portrait: { width: 186, height: 273 },
  landscape: { width: 273, height: 186 },
} as const
const HEADER = 26
const MEMO = 34

export function MonthlySheets({ spec, paper, page }: { spec: MonthlySpec; paper: Paper; page: PageKey }) {
  const months = page === "all" ? MONTHS : [page]
  return (
    <>
      {page === "all" && spec.cover && <Cover spec={spec} paper={paper} />}
      {months.map((month) => (
        <MonthSheet key={month} spec={spec} paper={paper} month={month} />
      ))}
    </>
  )
}

function MonthSheet({ spec, paper, month }: { spec: MonthlySpec; paper: Paper; month: Month }) {
  const inner = INNER[spec.orientation]
  const portrait = spec.orientation === "portrait"
  const foods = spec.foodLayout === "none" ? [] : monthFoods(month, { max: spec.foods.max, categories: [] })
  const showFoods = spec.foodLayout !== "none"

  const food = portrait
    ? { width: inner.width, height: showFoods ? 112 : 0 }
    : { width: showFoods ? 128 : 0, height: inner.height - HEADER }
  const gap = showFoods ? 8 : 0
  const side = portrait
    ? { width: inner.width, height: inner.height - HEADER - food.height - gap }
    : { width: inner.width - food.width - gap, height: inner.height - HEADER }
  const memo = spec.memo === "none" ? 0 : MEMO
  const dayFont = portrait ? 5.6 : 5

  return (
    <Sheet spec={spec} paper={paper} background={surfaceColor(spec.surface, monthSeason(month))}>
      <MonthHeader spec={spec} month={month} />
      <div style={{ display: "flex", flexDirection: portrait ? "column" : "row", gap: u(gap) }}>
        {showFoods && (
          <FoodArea
            foods={foods}
            width={food.width}
            height={food.height}
            layout={spec.foodLayout === "scatter" ? "scatter" : "flow"}
            month={month}
            showName={spec.foods.names === "korean"}
            nameSize={3.2}
          />
        )}
        <div style={{ width: u(side.width), display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
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
          {spec.memo !== "none" && <Memo kind={spec.memo} month={month} height={memo} />}
        </div>
      </div>
    </Sheet>
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
  const foods = foodsInMonth(month)
  return (
    <ul style={{ height: u(height), margin: 0, padding: `${u(4)} 0 0`, listStyle: "none", columns: 4, columnGap: u(4), fontSize: t(2.8) }}>
      {foods.map((food) => (
        <li key={food.id} style={{ display: "flex", alignItems: "center", gap: u(1.2), lineHeight: 1.6, breakInside: "avoid" }}>
          <span style={{ width: u(2.6), height: u(2.6), border: "var(--line) solid var(--color-stone)", borderRadius: u(0.5), flex: "none" }} />
          {food.name}
        </li>
      ))}
    </ul>
  )
}

function Cover({ spec, paper }: { spec: MonthlySpec; paper: Paper }) {
  const inner = INNER[spec.orientation]
  const picks = MONTHS.flatMap((month) => monthFoods(month, { max: 1, categories: [] }))
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
