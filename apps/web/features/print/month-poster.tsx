import { formatMonthLabel, MONTHS } from "@workspace/seasonal/data/months"
import { monthFoods } from "@workspace/seasonal/print/foods"
import type { MonthPosterSpec, Paper } from "@workspace/seasonal/print/spec"

import { FoodArea, flowSize } from "./parts/food-area"
import { gridSize } from "./parts/grid"
import { Sheet } from "./parts/sheet"
import { innerSize, monthSeason, surfaceColor, t, u } from "./parts/units"

// 월별 제철 포스터: 열두 칸에 그 달 품종을 놓는다. 날짜가 없어 해가 바뀌어도 그대로 쓴다.

const HEADER = 22
const CELL_LABEL = 7
const GAP = 3

export function MonthPoster({ spec, paper }: { spec: MonthPosterSpec; paper: Paper }) {
  const inner = innerSize(spec)
  const { columns, rows } = gridSize(spec.grid)
  const cell = {
    width: (inner.width - GAP * (columns - 1)) / columns,
    height: (inner.height - HEADER - GAP * (rows - 1)) / rows,
  }
  const area = { width: cell.width - 4, height: cell.height - CELL_LABEL - 1 }
  const nameSize = spec.foods.names === "korean" ? 2.4 : 0
  const foods = MONTHS.map((month) => monthFoods(month, { max: spec.foods.max, categories: spec.categories }))
  const size = Math.min(...foods.filter((list) => list.length).map((list) => flowSize(list.length, area.width, area.height, nameSize)))
  return (
    <Sheet spec={spec} paper={paper} background={surfaceColor(spec.surface === "season" ? "white" : spec.surface)}>
      <h1 className="print-heading" style={{ height: u(HEADER), margin: 0, textAlign: "center", fontSize: t(8), fontWeight: 700 }}>
        {spec.title}
      </h1>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, ${u(cell.width)})`, gap: u(GAP) }}>
        {MONTHS.map((month, i) => (
          <section
            key={month}
            style={{ height: u(cell.height), borderRadius: u(2), padding: `0 ${u(2)}`, boxSizing: "border-box", background: spec.surface === "season" ? surfaceColor("season", monthSeason(month)) : undefined }}
          >
            <h2 className="print-heading" style={{ height: u(CELL_LABEL), margin: 0, display: "flex", alignItems: "center", fontSize: t(4.2), fontWeight: 700, color: `var(--color-season-${monthSeason(month)})` }}>
              {formatMonthLabel(month, spec.monthLabel, "long")}
            </h2>
            <FoodArea
              foods={foods[i]!}
              width={area.width}
              height={area.height}
              layout="flow"
              month={month}
              showName={spec.foods.names === "korean"}
              nameSize={nameSize}
              maxSize={size}
            />
          </section>
        ))}
      </div>
    </Sheet>
  )
}
