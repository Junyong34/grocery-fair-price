import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { MONTHS } from "@workspace/seasonal/data/months"
import { monthPictures } from "@workspace/seasonal/print/foods"
import { DEFAULT_SPECS } from "@workspace/seasonal/print/spec"

import { MonthPoster } from "./month-poster"

describe.each(["wheel", "rows-check"] as const)("월별 포스터 %s", (layout) => {
  it.each(["korean", "hidden"] as const)("품종 24개 설정과 이름 %s가 인쇄 결과에 반영된다", (names) => {
    const spec = { ...DEFAULT_SPECS["month-poster"], layout, foods: { names, max: 24 } }
    const html = renderToStaticMarkup(<MonthPoster spec={spec} paper="A4" />)
    const count = MONTHS.reduce((total, month) => total + monthPictures(spec, month).length, 0)
    expect(count).toBe(24 * 12)
    expect(html.match(/<figure /g)).toHaveLength(count)
    expect(html.match(/<figcaption /g) ?? []).toHaveLength(names === "korean" ? count : 0)
  })
})
