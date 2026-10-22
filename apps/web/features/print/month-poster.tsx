import { formatMonthLabel, MONTHS } from "@workspace/seasonal/data/months"
import { monthChecklist, monthFoods } from "@workspace/seasonal/print/foods"
import type { MonthPosterSpec, Paper } from "@workspace/seasonal/print/spec"

import { CheckList } from "./parts/check-list"
import { FoodArea, flowSize } from "./parts/food-area"
import { gridSize } from "./parts/grid"
import { Sheet } from "./parts/sheet"
import { innerSize, monthSeason, surfaceColor, t, u } from "./parts/units"

// 월별 제철 포스터. 날짜가 없어 해가 바뀌어도 그대로 쓴다.
// cells(P-A): 열두 칸에 그 달 품종. rows-check(P-D): 달마다 한 줄에 큰 달 표기, 그림, 장보기 체크 목록(세로 용지만).

const HEADER = 22
const CELL_LABEL = 7
const GAP = 3

export function MonthPoster({ spec, paper }: { spec: MonthPosterSpec; paper: Paper }) {
  return (
    <Sheet spec={spec} paper={paper} background={surfaceColor(spec.surface === "season" ? "white" : spec.surface)}>
      <h1 className="print-heading" style={{ height: u(HEADER), margin: 0, textAlign: "center", fontSize: t(8), fontWeight: 700 }}>
        {spec.title}
      </h1>
      {spec.layout === "rows-check" ? <MonthRows spec={spec} /> : <MonthCells spec={spec} />}
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
