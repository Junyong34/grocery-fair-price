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

/** 태그를 뺀 글자만(숫자와 "원"이 다른 요소에 나뉘어 있어도 읽히는 문장으로 본다). */
const textOf = (html: string) => html.replace(/<[^>]+>/g, "")

describe("최근 조사 가격", () => {
  it("조사일 간격을 날짜 차이대로 그려 조사 공백을 보여 준다", () => {
    const html = renderTrend(points)
    expect(html).toMatch(/d="M0,[\d.]+L25,[\d.]+L100,[\d.]+"/)
    expect(html).toContain('dateTime="2026-09-15"')
    expect(html).toContain("1,800원")
  })

  it("처음에는 마지막 조사일 값을 크게 보여 주고 그 점을 강조한다", () => {
    const html = renderTrend(points)
    expect(textOf(html)).toContain("최근 조사 · 10/27")
    expect(textOf(html)).toContain("전국 판매가2,600원")
    expect(html).toContain('aria-valuenow="3"')
    expect(html.match(/size-4 border-\[3px\]/g)).toHaveLength(1)
  })

  it("기간 최고 · 평균 · 최저와 첫 조사 대비 변화를 보여 주고, 평균 기준선을 그린다", () => {
    const text = textOf(renderTrend(points))
    expect(text).toContain("첫 조사보다 200원 올랐어요")
    expect(text).toContain("기간 최고2,600원10/27")
    expect(text).toContain("기간 평균2,400원")
    expect(text).toContain("기간 최저2,200원9/15")
    expect(renderTrend(points)).toContain('stroke-dasharray="1 3"')
  })

  it("그림을 글로 요약한 대체 텍스트가 있다", () => {
    const html = renderTrend(points)
    expect(html).toMatch(
      /<figcaption class="sr-only">9\/1부터 10\/27까지 3회 조사한 전국 판매가는 2,400원에서 2,600원이 됐어요\./
    )
  })

  it("조사 기록이 하나면 가격을 보여 주고 추이 선은 그리지 않는다", () => {
    const html = renderTrend([{ date: "2026-09-01", median: 0, min: 0 }])
    expect(html).toContain("1회 조사")
    expect(textOf(html)).toContain("0원")
    expect(html).not.toContain("<path")
    expect(html).not.toContain("기간 평균")
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
