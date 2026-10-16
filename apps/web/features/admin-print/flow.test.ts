import { describe, expect, it } from "vitest"

import { editionFlow, pdfPaths } from "./flow"

const base = { dirty: false, invalid: false, hasBuild: true, stale: false }

describe("editionFlow", () => {
  it("저장하지 않은 변경이 있으면 저장이 지금 할 일이고 PDF는 잠긴다", () => {
    const flow = editionFlow({ ...base, dirty: true })
    expect(flow.phase).toBe("unsaved")
    expect(flow.save).toEqual({ state: "current" })
    expect(flow.pdf).toEqual({ state: "locked", reason: "먼저 저장하세요" })
  })

  it("옵션에 오류가 있으면 저장이 막히고 이유를 돌려준다", () => {
    const flow = editionFlow({ ...base, dirty: true, invalid: true })
    expect(flow.save).toEqual({ state: "locked", reason: "옵션의 오류를 먼저 고치세요" })
  })

  it("저장했고 PDF가 없으면 PDF 만들기가 지금 할 일이다", () => {
    const flow = editionFlow({ ...base, hasBuild: false, stale: true })
    expect(flow.phase).toBe("no-pdf")
    expect(flow.save.state).toBe("done")
    expect(flow.pdf).toEqual({ state: "current", action: "generate" })
  })

  it("저장한 옵션이 만든 PDF와 다르면 다시 만들기가 지금 할 일이다", () => {
    const flow = editionFlow({ ...base, stale: true })
    expect(flow.phase).toBe("outdated")
    expect(flow.pdf).toEqual({ state: "current", action: "regenerate" })
  })

  it("저장한 옵션으로 만든 PDF가 있으면 모두 끝이다", () => {
    const flow = editionFlow(base)
    expect(flow.phase).toBe("done")
    expect(flow.save.state).toBe("done")
    expect(flow.pdf).toEqual({ state: "done" })
  })

  it("이전 PDF가 있어도 저장 전에는 옵션을 바꾸는 중이라고 안내한다", () => {
    const flow = editionFlow({ ...base, dirty: true, stale: true })
    expect(flow.phase).toBe("unsaved")
    expect(flow.hint).toContain("저장")
  })
})

describe("pdfPaths", () => {
  it("용지마다 규칙대로 경로를 만든다. 월간 달력도 묶음 PDF 하나뿐이다", () => {
    expect(pdfPaths("year-sheet-1", "year-sheet", "A4")).toEqual(["/downloads/year-sheet-1/a4/all.pdf"])
    expect(pdfPaths("monthly-2", "monthly", "A3")).toEqual(["/downloads/monthly-2/a3/all.pdf"])
  })
})
