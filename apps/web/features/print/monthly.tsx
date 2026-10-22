import { foodsInMonth } from "@workspace/seasonal/data/foods"
import { formatMonthLabel, MONTHS, type Month } from "@workspace/seasonal/data/months"
import { monthChecklist, monthFoods, yearFoods } from "@workspace/seasonal/print/foods"
import { CALENDAR_TEXT_SCALE, type MonthlySpec, type Paper } from "@workspace/seasonal/print/spec"

import { CheckList } from "./parts/check-list"
import { FoodArea } from "./parts/food-area"
import { PrintCalendar } from "./parts/print-calendar"
import { Sheet } from "./parts/sheet"
import { innerSize, monthSeason, surfaceColor, t, u } from "./parts/units"

// 월간 달력: 한 장에 한 달(위 그림, 아래 달력). 12개월 묶음은 표지 + 열두 장이다.
// side-check(M-B)는 달력 오른쪽에 그 달 품종 체크 목록을 세로로 둔다(세로 용지만). 치수는 A4 기준 용지 단위(innerSize).

const HEADER = 26
const MEMO = 34
/** M-B 체크 목록의 폭·제목 높이와 달력과의 간격 */
const SIDE = { width: 52, title: 8, gap: 6 } as const

export function MonthlySheets({ spec, paper }: { spec: MonthlySpec; paper: Paper }) {
  return (
    <>
      {spec.cover === "year" && <Cover spec={spec} paper={paper} />}
      {MONTHS.map((month) => (
        <MonthSheet key={month} spec={spec} paper={paper} month={month} />
      ))}
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
