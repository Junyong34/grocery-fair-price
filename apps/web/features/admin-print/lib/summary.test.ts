import { describe, expect, it } from "vitest"

import type { Edition } from "@workspace/seasonal/print/edition"
import { DEFAULT_SPECS, specHash } from "@workspace/seasonal/print/spec"

import { nextIdsByKind, toEditionSummary } from "./summary"

const edition: Edition = { id: "monthly-1", title: "크림 달력", description: "", status: "draft", spec: DEFAULT_SPECS.monthly }

describe("toEditionSummary", () => {
  it("지금 사양으로 만든 PDF가 있으면 생성일을 서울 날짜로 적는다", () => {
    const build = { specHash: specHash(edition.spec), generatedAt: "2026-10-16T16:30:00.000Z", bytes: {} }
    expect(toEditionSummary(edition, build)).toEqual({ id: "monthly-1", kind: "monthly", title: "크림 달력", status: "draft", generatedAt: "2026-10-17" })
  })

  it("사양이 바뀐 뒤의 옛 PDF나 PDF가 없으면 생성일이 없다", () => {
    const old = { specHash: "old", generatedAt: "2026-10-16T00:00:00.000Z", bytes: {} }
    expect(toEditionSummary(edition, old).generatedAt).toBeNull()
    expect(toEditionSummary({ ...edition, status: "published" }, undefined)).toMatchObject({ status: "published", generatedAt: null })
  })
})

describe("nextIdsByKind", () => {
  it("종류마다 다음 id를 미리 정한다", () => {
    expect(nextIdsByKind(["monthly-1", "monthly-3"])).toEqual({
      monthly: "monthly-4",
      "year-sheet": "year-sheet-1",
      "season-poster": "season-poster-1",
      "month-poster": "month-poster-1",
    })
  })
})
