import { describe, expect, it } from "vitest"

import { downloadPattern, pageLabel, pdfPaths } from "./downloads"

describe("pdfPaths", () => {
  it("용지마다 규칙대로 경로를 만든다. 월간 달력도 묶음 PDF 하나뿐이다", () => {
    expect(pdfPaths("year-sheet-1", "year-sheet", "A4")).toEqual(["/downloads/year-sheet-1/a4/all.pdf"])
    expect(pdfPaths("monthly-2", "monthly", "A3")).toEqual(["/downloads/monthly-2/a3/all.pdf"])
  })
})

describe("downloadPattern", () => {
  it("용지와 쪽 자리를 비운 주소 꼴을 보여 준다", () => {
    expect(downloadPattern("monthly-2")).toBe("/downloads/monthly-2/{a4|a3}/{쪽}.pdf")
  })
})

describe("pageLabel", () => {
  it("묶음은 전체, 달은 n월로 읽는다", () => {
    expect(pageLabel("all")).toBe("전체")
    expect(pageLabel(3)).toBe("3월")
  })
})
