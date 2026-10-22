import { formatMonthLabel, MONTHS } from "@workspace/seasonal/data/months"
import { monthChecklist, monthFoods } from "@workspace/seasonal/print/foods"
import { chartColumns, chartFoods, chartLines } from "@workspace/seasonal/print/period-chart"
import { wheelLayout } from "@workspace/seasonal/print/wheel"
import type { MonthPosterSpec, Paper } from "@workspace/seasonal/print/spec"

import { CheckList } from "./parts/check-list"
import { FoodArea, flowSize } from "./parts/food-area"
import { gridSize } from "./parts/grid"
import { chartLabelWidth, PeriodChart } from "./parts/period-chart"
import { Wheel } from "./parts/wheel"
import { Sheet } from "./parts/sheet"
import { innerSize, monthSeason, surfaceColor, t, u } from "./parts/units"

// 월별 제철 포스터. 날짜가 없어 해가 바뀌어도 그대로 쓴다.
// cells(P-A): 열두 칸에 그 달 품종. chart(P-B): 품종×달 막대표(세로 2단, 가로 3단). wheel(P-C): 열두 조각 원형 판. rows-check(P-D): 달마다 한 줄에 큰 달 표기, 그림, 장보기 체크 목록(세로 용지만).

const HEADER = 22
const CELL_LABEL = 7
const GAP = 3

export function MonthPoster({ spec, paper }: { spec: MonthPosterSpec; paper: Paper }) {
  return (
    <Sheet spec={spec} paper={paper} background={surfaceColor(spec.surface === "season" ? "white" : spec.surface)}>
      <h1 className="print-heading" style={{ height: u(HEADER), margin: 0, textAlign: "center", fontSize: t(8), fontWeight: 700 }}>
        {spec.title}
      </h1>
      {spec.layout === "rows-check" ? <MonthRows spec={spec} /> : spec.layout === "chart" ? <MonthChart spec={spec} /> : spec.layout === "wheel" ? <MonthWheel spec={spec} /> : <MonthCells spec={spec} />}
    </Sheet>
  )
}

function MonthCells({ spec }: { spec: MonthPosterSpec }) {
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
  )
}

/**
 * P-B 막대표의 단 수와 단 사이 간격, 줄 높이 상한. 그림 있는 품종(67개)을 한 단에 넣으면 A4 세로 줄이 3.5mm(이름 약 6pt)라
 * 세로 2단(줄 약 6.8mm), 가로 3단(줄 약 6.4mm)으로 나눈다. 카테고리를 골라 줄이 적으면 한 단으로 두고, 줄이 너무 높아지지 않게 상한을 둔다.
 */
const CHART = { columns: { portrait: 2, landscape: 3 }, single: 24, gap: 8, maxRow: 9 } as const

function MonthChart({ spec }: { spec: MonthPosterSpec }) {
  const inner = innerSize(spec)
  const lines = chartLines(chartFoods(spec.categories))
  const count = lines.length <= CHART.single ? 1 : CHART.columns[spec.orientation]
  const columns = chartColumns(lines, count)
  const width = (inner.width - CHART.gap * (count - 1)) / count
  // 달 머리 줄 하나 + 가장 긴 단의 줄 수
  const rowHeight = Math.min(CHART.maxRow, (inner.height - HEADER) / (Math.max(...columns.map((column) => column.length)) + 1))
  const labelWidth = chartLabelWidth(lines, rowHeight, true)
  return (
    <div style={{ display: "flex", gap: u(CHART.gap), alignItems: "flex-start" }}>
      {columns.map((column, i) => (
        <PeriodChart key={i} lines={column} width={width} rowHeight={rowHeight} labelWidth={labelWidth} monthLabel={spec.monthLabel} pictures />
      ))}
    </div>
  )
}

/**
 * P-C 원형 판: 조각마다 그림 상한(foods.max와 이것 중 작은 값), 달 표기 크기. 넷이면 A4 세로 그림 한 변 약 11mm다.
 * 조각이 좁아 이름은 넣지 않는다. 세로는 판 폭, 가로는 판 높이가 지름이다.
 */
const WHEEL = { perSector: 4, label: 4.2 } as const

function MonthWheel({ spec }: { spec: MonthPosterSpec }) {
  const inner = innerSize(spec)
  const diameter = Math.min(inner.width, inner.height - HEADER)
  const foods = MONTHS.map((month) => monthFoods(month, { max: Math.min(spec.foods.max, WHEEL.perSector), categories: spec.categories }))
  const layout = wheelLayout({ diameter, sectors: MONTHS.length, counts: foods.map((list) => list.length) })
  const items = MONTHS.map((month, i) => ({
    foods: foods[i]!,
    label: formatMonthLabel(month, spec.monthLabel, "short"),
    color: `var(--color-season-${monthSeason(month)})`,
    fill: spec.surface === "season" ? surfaceColor("season", monthSeason(month)) : undefined,
  }))
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Wheel layout={layout} items={items} labelSize={WHEEL.label}>
        <span className="print-heading" style={{ fontSize: t(5), fontWeight: 700 }}>
          열두 달
        </span>
        <span className="print-heading" style={{ marginTop: u(1.5), fontSize: t(3.2), color: "var(--color-stone)" }}>
          제철 음식
        </span>
      </Wheel>
    </div>
  )
}

/** P-D 한 줄의 칸 폭(용지 단위): 달 표기, 그림. 나머지가 체크 목록이다. */
const ROW = { label: 16, pictures: 72, gap: 4, padding: 1.2 } as const
/** 그림은 한 줄로만 놓는다. 이보다 많으면 두 줄로 접혀 그림이 작아진다. 나머지 품종은 체크 목록에 이름으로 있다. */
const PICTURES_PER_ROW = 6
const CHECK_COLUMNS = 4
/** 체크 목록 한 줄 높이(글자 크기 배). 줄이 낮아 월간 메모(1.6)보다 좁게 잡고, 글자 크기는 여유(1.1배)를 두고 정해 열이 넘치지 않게 한다. */
const CHECK_LINE = 1.35

function MonthRows({ spec }: { spec: MonthPosterSpec }) {
  const inner = innerSize(spec)
  const row = (inner.height - HEADER) / MONTHS.length
  const body = row - ROW.padding * 2
  const pictures = MONTHS.map((month) => monthFoods(month, { max: Math.min(spec.foods.max, PICTURES_PER_ROW), categories: spec.categories }))
  const lists = MONTHS.map((month) => monthChecklist(month, spec.categories))
  // 그림과 목록 글자를 열두 줄이 같은 크기로 쓴다. 가장 많은 달에 맞춘다.
  const size = Math.min(...pictures.filter((list) => list.length).map((list) => flowSize(list.length, ROW.pictures, body, 0)))
  const lines = Math.ceil(Math.max(1, ...lists.map((list) => list.length)) / CHECK_COLUMNS)
  const fontSize = Math.min(2.8, body / (lines * CHECK_LINE * 1.1))
  const big = spec.monthLabel === "number"
  return (
    <div>
      {MONTHS.map((month, i) => (
        <section
          key={month}
          style={{
            height: u(row),
            padding: `${u(ROW.padding)} 0`,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            gap: u(ROW.gap),
            borderTop: "var(--line) solid var(--color-hairline)",
            background: spec.surface === "season" ? surfaceColor("season", monthSeason(month)) : undefined,
          }}
        >
          <h2
            className={big ? "print-number" : "print-heading"}
            style={{ width: u(ROW.label), flex: "none", margin: 0, textAlign: "right", fontSize: t(big ? Math.min(body * 0.6, 11) : 4.2), lineHeight: 1, fontWeight: big ? 500 : 700, color: `var(--color-season-${monthSeason(month)})` }}
          >
            {formatMonthLabel(month, spec.monthLabel, "short")}
          </h2>
          <FoodArea foods={pictures[i]!} width={ROW.pictures} height={body} layout="flow" month={month} showName={false} maxSize={size} style={{ justifyContent: "flex-start" }} />
          <CheckList foods={lists[i]!} columns={CHECK_COLUMNS} fontSize={fontSize} lineHeight={CHECK_LINE} style={{ flex: 1, alignSelf: "stretch", columnFill: "auto", height: u(body) }} />
        </section>
      ))}
    </div>
  )
}
