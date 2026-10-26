import { SEASON_MONTHS, SEASONS, type Season } from "@workspace/seasonal/data/seasons"
import { seasonPictures } from "@workspace/seasonal/print/foods"
import type { Paper, SeasonPosterSpec } from "@workspace/seasonal/print/spec"
import { wheelLayout } from "@workspace/seasonal/print/wheel"

import { FoodArea, flowSize } from "./parts/food-area"
import { Sheet } from "./parts/sheet"
import { Wheel } from "./parts/wheel"
import { innerSize, surfaceColor, t, u } from "./parts/units"

// 계절 제철 포스터: 봄·여름·가을·겨울 네 칸에 그 계절에 제철이 시작하는 품종을 놓는다. 달력이 없다.
// bands(S-A): 위에서 아래로 가로 띠 넷. quarters(S-B): 세로 용지는 2×2 사분면, 가로 용지는 네 열.
// wheel(S-C): 원을 네 부채꼴로 나눠 12시부터 봄·여름·가을·겨울. 계절 이름은 원 밖 판 모서리에 쓴다.
// per-season(S-D): 계절마다 한 장(PDF 4쪽). 계절 이름을 크게 쓰고 판 전체에 그 계절 품종을 놓는다.

const HEADER = 22
const BAND_LABEL = 9
const GAP = 3

const SEASON_NAMES: Record<Season, { korean: string; english: string }> = {
  spring: { korean: "봄", english: "Spring" },
  summer: { korean: "여름", english: "Summer" },
  autumn: { korean: "가을", english: "Autumn" },
  winter: { korean: "겨울", english: "Winter" },
}

/** 네 계절 칸의 열·행 수와 칸 안쪽 여백(용지 단위). 띠는 판 끝까지 그림을 채우고, 사분면·열은 칸을 테로 묶는다. */
function arrangement(spec: SeasonPosterSpec) {
  if (spec.layout === "bands") return { columns: 1, rows: 4, padding: 0 }
  return spec.orientation === "portrait" ? { columns: 2, rows: 2, padding: 3 } : { columns: 4, rows: 1, padding: 3 }
}

export function SeasonPoster({ spec, paper }: { spec: SeasonPosterSpec; paper: Paper }) {
  if (spec.layout === "per-season")
    return (
      <>
        {SEASONS.map((season, i) => (
          <SeasonSheet key={season} spec={spec} paper={paper} season={season} index={i} />
        ))}
      </>
    )
  if (spec.layout === "wheel") return <SeasonWheel spec={spec} paper={paper} />
  const inner = innerSize(spec)
  const { columns, rows, padding } = arrangement(spec)
  const cell = {
    width: (inner.width - GAP * (columns - 1)) / columns,
    height: (inner.height - HEADER - GAP * (rows - 1)) / rows,
  }
  const area = { width: cell.width - padding * 2, height: cell.height - padding * 2 - BAND_LABEL }
  const nameSize = spec.foods.names === "korean" ? 2.8 : 0
  const foods = SEASONS.map((season) => seasonPictures(spec, season))
  const size = Math.min(...foods.filter((list) => list.length).map((list) => flowSize(list.length, area.width, area.height, nameSize)))
  return (
    <Sheet spec={spec} paper={paper} background={surfaceColor(spec.surface === "season" ? "white" : spec.surface)}>
      <h1 className="print-heading" style={{ height: u(HEADER), margin: 0, textAlign: "center", fontSize: t(8), fontWeight: 700 }}>
        {spec.title}
      </h1>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, ${u(cell.width)})`, gap: u(GAP) }}>
        {SEASONS.map((season, i) => (
          <section
            key={season}
            style={{
              height: u(cell.height),
              padding: u(padding),
              boxSizing: "border-box",
              borderRadius: u(2),
              border: padding ? "var(--line) solid var(--color-hairline)" : undefined,
              background: spec.surface === "season" ? surfaceColor("season", season) : undefined,
            }}
          >
            <h2 className="print-heading" style={{ height: u(BAND_LABEL), margin: 0, display: "flex", alignItems: "center", gap: u(3), fontSize: t(5), color: `var(--color-season-${season})` }}>
              {spec.seasonLabel === "english-korean" && <span>{SEASON_NAMES[season].english}</span>}
              {spec.seasonLabel === "english-korean" && <span style={{ fontSize: t(2.4) }}>●</span>}
              <span>{SEASON_NAMES[season].korean}</span>
              <span style={{ flex: 1, borderBottom: "var(--line) solid var(--color-hairline)" }} />
            </h2>
            <FoodArea
              foods={foods[i]!}
              width={area.width}
              height={area.height}
              layout="flow"
              month={13 + i}
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

/**
 * S-C. 부채꼴이 90°라 바깥 띠에 가로 글자를 쓰면 원 밖으로 삐져나온다. 그래서 띠를 거의 없애 그림 고리를 넓히고,
 * 계절 이름은 원과 판(정사각형) 모서리 사이 빈 자리에 쓴다. 봄은 오른쪽 위, 여름 오른쪽 아래, 가을 왼쪽 아래, 겨울 왼쪽 위다.
 */
const WHEEL = { band: 0.02, name: 8, english: 3.6 } as const
const CORNERS: Record<Season, { top: boolean; left: boolean }> = {
  spring: { top: true, left: false },
  summer: { top: false, left: false },
  autumn: { top: false, left: true },
  winter: { top: true, left: true },
}

function SeasonWheel({ spec, paper }: { spec: SeasonPosterSpec; paper: Paper }) {
  const inner = innerSize(spec)
  const diameter = Math.min(inner.width, inner.height - HEADER)
  const foods = SEASONS.map((season) => seasonPictures(spec, season))
  const layout = wheelLayout({ diameter, sectors: SEASONS.length, counts: foods.map((list) => list.length), band: WHEEL.band })
  const items = SEASONS.map((season, i) => ({ foods: foods[i]!, fill: spec.surface === "season" ? surfaceColor("season", season) : undefined }))
  return (
    <Sheet spec={spec} paper={paper} background={surfaceColor(spec.surface === "season" ? "white" : spec.surface)}>
      <h1 className="print-heading" style={{ height: u(HEADER), margin: 0, textAlign: "center", fontSize: t(8), fontWeight: 700 }}>
        {spec.title}
      </h1>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative" }}>
          <Wheel layout={layout} items={items}>
            <span className="print-heading" style={{ fontSize: t(5), fontWeight: 700 }}>
              사계절
            </span>
            <span className="print-heading" style={{ marginTop: u(1.5), fontSize: t(3.2), color: "var(--color-stone)" }}>
              제철 음식
            </span>
          </Wheel>
          {SEASONS.map((season) => {
            const { top, left } = CORNERS[season]
            return (
              <div
                key={season}
                className="print-heading"
                style={{
                  position: "absolute",
                  [top ? "top" : "bottom"]: 0,
                  [left ? "left" : "right"]: 0,
                  textAlign: left ? "left" : "right",
                  lineHeight: 1,
                  color: `var(--color-season-${season})`,
                }}
              >
                {spec.seasonLabel === "english-korean" && <p style={{ margin: 0, marginBottom: u(1.2), fontSize: t(WHEEL.english), letterSpacing: "0.12em" }}>{SEASON_NAMES[season].english}</p>}
                <p style={{ margin: 0, fontSize: t(WHEEL.name), fontWeight: 700 }}>{SEASON_NAMES[season].korean}</p>
              </div>
            )
          })}
        </div>
      </div>
    </Sheet>
  )
}

/** S-D 한 장의 머리(계절 이름)·줄·발(제목과 쪽 번호) 높이와 사이 간격. 세로·가로 순서다. */
const SHEET = {
  portrait: { header: 34, rule: 1.2, foot: 8, gap: 7, title: 24, name: 3.6 },
  landscape: { header: 26, rule: 1.2, foot: 7, gap: 5, title: 18, name: 3.2 },
} as const

/** S-D: 계절 하나에 한 장. 품종 수가 계절마다 달라(그림 있는 품종 겨울 10 ~ 가을 26) 그림 크기는 장마다 판에 맞춘다. */
function SeasonSheet({ spec, paper, season, index }: { spec: SeasonPosterSpec; paper: Paper; season: Season; index: number }) {
  const inner = innerSize(spec)
  const size = SHEET[spec.orientation]
  const foods = seasonPictures(spec, season)
  const art = { width: inner.width, height: inner.height - size.header - size.rule - size.foot - size.gap * 3 }
  const color = `var(--color-season-${season})`
  return (
    <Sheet spec={spec} paper={paper} background={surfaceColor(spec.surface, season)}>
      <header style={{ height: u(size.header), display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          {spec.seasonLabel === "english-korean" && (
            <p className="print-heading" style={{ margin: 0, marginBottom: u(1.5), fontSize: t(5), letterSpacing: "0.12em", color }}>
              {SEASON_NAMES[season].english}
            </p>
          )}
          <h1 className="print-heading" style={{ margin: 0, fontSize: t(size.title), lineHeight: 1, fontWeight: 700, color }}>
            {SEASON_NAMES[season].korean}
          </h1>
        </div>
        <span className="print-number" style={{ fontSize: t(4), color: "var(--color-caption)" }}>
          {SEASON_MONTHS[season].join(" · ")}월
        </span>
      </header>
      <div style={{ width: "50%", height: u(size.rule), marginTop: u(size.gap), background: color }} />
      <FoodArea
        foods={foods}
        width={art.width}
        height={art.height}
        layout="flow"
        month={13 + index}
        showName={spec.foods.names === "korean"}
        nameSize={size.name}
        // 품종이 적은 계절은 그림이 폭에 막혀 커지지 못하므로, 줄 사이를 넓혀 판 높이를 고르게 채운다.
        style={{ marginTop: u(size.gap), alignContent: "space-evenly" }}
      />
      <footer style={{ height: u(size.foot), marginTop: u(size.gap), display: "flex", alignItems: "flex-end", justifyContent: "space-between", fontSize: t(3.2), color: "var(--color-stone)" }}>
        <span className="print-heading">{spec.title}</span>
        <span className="print-number">
          {index + 1} / {SEASONS.length}
        </span>
      </footer>
    </Sheet>
  )
}

