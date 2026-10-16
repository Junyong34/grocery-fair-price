import { SEASONS, type Season } from "@workspace/seasonal/data/seasons"
import { seasonFoods } from "@workspace/seasonal/print/foods"
import type { Paper, SeasonPosterSpec } from "@workspace/seasonal/print/spec"

import { FoodArea, flowSize } from "./parts/food-area"
import { Sheet } from "./parts/sheet"
import { innerSize, surfaceColor, t, u } from "./parts/units"

// 계절 제철 포스터: 봄·여름·가을·겨울 네 띠에 그 계절에 제철이 시작하는 품종을 놓는다. 달력이 없다.

const HEADER = 22
const BAND_LABEL = 9
const GAP = 3

const SEASON_NAMES: Record<Season, { korean: string; english: string }> = {
  spring: { korean: "봄", english: "Spring" },
  summer: { korean: "여름", english: "Summer" },
  autumn: { korean: "가을", english: "Autumn" },
  winter: { korean: "겨울", english: "Winter" },
}

export function SeasonPoster({ spec, paper }: { spec: SeasonPosterSpec; paper: Paper }) {
  const inner = innerSize(spec)
  const band = (inner.height - HEADER - GAP * 3) / 4
  const nameSize = spec.foods.names === "korean" ? 2.8 : 0
  const foods = SEASONS.map((season) => seasonFoods(season, { max: spec.foods.max, categories: spec.categories }))
  const size = Math.min(...foods.filter((list) => list.length).map((list) => flowSize(list.length, inner.width, band - BAND_LABEL, nameSize)))
  return (
    <Sheet spec={spec} paper={paper} background={surfaceColor(spec.surface === "season" ? "white" : spec.surface)}>
      <h1 className="print-heading" style={{ height: u(HEADER), margin: 0, textAlign: "center", fontSize: t(8), fontWeight: 700 }}>
        {spec.title}
      </h1>
      <div style={{ display: "flex", flexDirection: "column", gap: u(GAP) }}>
        {SEASONS.map((season, i) => (
          <section key={season} style={{ height: u(band), borderRadius: u(2), background: spec.surface === "season" ? surfaceColor("season", season) : undefined }}>
            <h2 className="print-heading" style={{ height: u(BAND_LABEL), margin: 0, display: "flex", alignItems: "center", gap: u(3), fontSize: t(5), color: `var(--color-season-${season})` }}>
              {spec.seasonLabel === "english-korean" && <span>{SEASON_NAMES[season].english}</span>}
              {spec.seasonLabel === "english-korean" && <span style={{ fontSize: t(2.4) }}>●</span>}
              <span>{SEASON_NAMES[season].korean}</span>
              <span style={{ flex: 1, borderBottom: "var(--line) solid var(--color-hairline)" }} />
            </h2>
            <FoodArea
              foods={foods[i]!}
              width={inner.width}
              height={band - BAND_LABEL}
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
