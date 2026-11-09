import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import type { ProductDetail } from "@workspace/price/types"

import { TrendSection } from "./trend-section"

const points = [
  { date: "2026-09-01", median: 2400, min: 2100 },
  { date: "2026-09-15", median: 2200, min: 1800 },
  { date: "2026-10-27", median: 2600, min: 2000 },
] satisfies ProductDetail["trend"]

function renderTrend(trend: ProductDetail["trend"]) {
  return renderToStaticMarkup(<TrendSection product={{ trend }} />)
}

describe("최근 조사 가격", () => {
  it("조사일 간격을 날짜 차이대로 그려 조사 공백을 보여 준다", () => {
    const html = renderTrend(points)
    expect(html).toMatch(/d="M0,[\d.]+L25,[\d.]+L100,[\d.]+"/)
    expect(html).toContain('dateTime="2026-09-15"')
    expect(html).toContain("1,800원")
  })

  it("조사 기록이 하나면 가격을 보여 주고 추이 선은 그리지 않는다", () => {
    const html = renderTrend([{ date: "2026-09-01", median: 0, min: 0 }])
    expect(html).toContain("1회 조사")
    expect(html).toContain("0원")
    expect(html).not.toContain("<path")
  })

  it("같은 금액이 계속 조사돼도 좌표가 유효하다", () => {
    const html = renderTrend(
      points.map((point) => ({ ...point, median: 0, min: 0 }))
    )
    expect(html).toMatch(/d="M0,100L25,100L100,100"/)
    expect(html).not.toContain("NaN")
  })

  it("조사 기록이 비어 있으면 추이 영역을 만들지 않는다", () => {
    expect(renderTrend([])).toBe("")
  })
})
