import { MONTHS } from "@workspace/seasonal/data/months"
import { printMonthLabel, type PrintMonthLabel } from "@workspace/seasonal/print/month-label"
import { startSeason } from "@workspace/seasonal/print/foods"
import { chartColumns, type ChartLine } from "@workspace/seasonal/print/period-chart"

import { FoodFigure } from "./food-figure"
import { t, u } from "./units"

/** 여러 단의 줄 높이 상한(용지 단위). 줄이 적을 때 막대표가 너무 성기지 않게 한다. */
const ROW_MAX = 9

/** 줄 높이 대비 크기: 품종 그림, 이름 글자(상한 3.2 = A4 약 9pt), 막대 높이 */
const RATIO = { picture: 0.82, name: 0.55, bar: 0.46 } as const
const NAME_MAX = 3.2
/** 달 열 폭 대비 달 머리 글자 크기. 가장 긴 표기(두 글자 0.6, "12월"·"Sep" 0.4)가 열 안에 들게 글자 수로 나눈다. 대문자는 더 넓다. */
function monthFit(monthLabel: PrintMonthLabel): number {
  const labels = MONTHS.map((month) => printMonthLabel(month, monthLabel, { length: "short" }))
  const longest = Math.max(...labels.map((label) => label.main.length))
  return Math.min(0.6, (labels[0]!.kind === "caps" ? 1.1 : 1.2) / longest)
}
/** 막대를 달 경계에서 들이는 폭(용지 단위) */
const BAR_INSET = 0.6

/** 줄 높이에 맞춘 이름 글자 크기(용지 단위). 7pt(약 2.5) 아래로 내려가면 부르는 쪽이 단을 늘려야 한다. */
function chartNameSize(rowHeight: number): number {
  return Math.min(NAME_MAX, rowHeight * RATIO.name)
}

/** 이름 칸 폭(그림 + 가장 긴 이름). 여러 단을 나란히 둘 때 같은 값을 넘겨 달 열을 맞춘다. */
function chartLabelWidth(lines: readonly ChartLine[], rowHeight: number, pictures: boolean): number {
  const longest = Math.max(3, ...lines.map((line) => (line.type === "food" ? line.food.name.length : line.category.length)))
  return (pictures ? rowHeight * RATIO.picture + 1.2 : 0) + longest * chartNameSize(rowHeight) + 1.5
}

/**
 * 제철 막대표 한 단. 맨 위는 달 머리 줄, 그 아래로 lines를 한 줄씩. 막대 색은 제철이 시작하는 계절색이다.
 * 줄 배치는 @workspace/seasonal/print/period-chart가 정하고, 여기서는 정해진 줄 높이로 그리기만 한다.
 */
function PeriodChart({
  lines,
  width,
  rowHeight,
  labelWidth,
  monthLabel,
  pictures,
}: {
  lines: readonly ChartLine[]
  width: number
  /** 한 줄 높이(용지 단위). 달 머리 줄도 같은 높이다. */
  rowHeight: number
  labelWidth: number
  monthLabel: PrintMonthLabel
  pictures: boolean
}) {
  const nameSize = chartNameSize(rowHeight)
  const monthWidth = (width - labelWidth) / MONTHS.length
  // 달 머리 글자: 열 폭에 가장 긴 표기("12월"·"Sep"·"12")가 들어가는 크기, 이름 글자보다 조금 작게.
  const monthSize = Math.min(nameSize * 0.85, monthWidth * monthFit(monthLabel))
  const bar = rowHeight * RATIO.bar
  return (
    <div className="print-chart" style={{ width: u(width), gridTemplateColumns: `${u(labelWidth)} 1fr`, gridAutoRows: u(rowHeight) }}>
      {/* 달 경계 세로줄. 머리 줄 아래부터 끝까지 깐다. */}
      <div aria-hidden className="print-chart-grid" style={{ left: u(labelWidth), top: u(rowHeight), right: 0, bottom: 0 }}>
        {MONTHS.map((month) => (
          <span key={month} />
        ))}
      </div>
      <span />
      <div className="print-chart-months">
        {MONTHS.map((month) => (
          <span key={month} className="print-number" style={{ fontSize: t(monthSize) }}>
            {printMonthLabel(month, monthLabel, { length: "short" }).main}
          </span>
        ))}
      </div>
      {lines.map((line) =>
        line.type === "group" ? (
          <h3 key={`group-${line.category}`} className="print-chart-group print-heading" style={{ fontSize: t(nameSize) }}>
            {line.category}
          </h3>
        ) : (
          <div key={line.food.id} className="print-chart-row">
            <div className="print-chart-name" style={{ gap: u(1.2), fontSize: t(nameSize) }}>
              {pictures && <FoodFigure food={line.food} size={rowHeight * RATIO.picture} nameSize={0} showName={false} style={{ position: "static", flex: "none" }} />}
              <span>{line.food.name}</span>
            </div>
            <div className="print-chart-bars">
              {line.runs.map((run) => (
                <span
                  key={run.from}
                  style={{
                    // 달 경계에서 조금 안쪽으로 들여 막대끼리, 세로줄과 붙지 않게 한다.
                    left: `calc(${((run.from - 1) / 12) * 100}% + ${u(BAR_INSET)})`,
                    width: `calc(${((run.to - run.from + 1) / 12) * 100}% - ${u(BAR_INSET * 2)})`,
                    height: u(bar),
                    borderRadius: u(bar / 2),
                    background: `var(--color-season-${startSeason(line.food.months)})`,
                  }}
                />
              ))}
            </div>
          </div>
        ),
      )}
    </div>
  )
}

/**
 * 막대표 여러 단. 줄을 columns단으로 나누고(chartColumns), 가장 긴 단이 달 머리 줄과 함께 height에 들도록 줄 높이를 정한다.
 * 단마다 이름 칸 폭을 같게 해 달 열이 나란히 맞는다. 부르는 쪽은 이름 글자(chartNameSize)가 7pt 아래로 내려가지 않게 단 수와 품종 수를 고른다.
 */
export function PeriodChartColumns({
  lines,
  columns,
  width,
  height,
  gap,
  monthLabel,
}: {
  lines: readonly ChartLine[]
  columns: number
  width: number
  height: number
  /** 단 사이 간격(용지 단위) */
  gap: number
  monthLabel: PrintMonthLabel
}) {
  const split = chartColumns(lines, columns)
  const columnWidth = (width - gap * (columns - 1)) / columns
  const rowHeight = Math.min(ROW_MAX, height / (Math.max(...split.map((column) => column.length)) + 1))
  const labelWidth = chartLabelWidth(lines, rowHeight, true)
  return (
    <div style={{ display: "flex", gap: u(gap), alignItems: "flex-start" }}>
      {split.map((column, i) => (
        <PeriodChart key={i} lines={column} width={columnWidth} rowHeight={rowHeight} labelWidth={labelWidth} monthLabel={monthLabel} pictures />
      ))}
    </div>
  )
}
