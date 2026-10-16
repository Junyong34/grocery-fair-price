import { describe, expect, it } from "vitest"

import { buildManifest, downloadPath, nextEditionId, parseEdition, type Edition } from "./edition"
import { DEFAULT_SPECS } from "./spec"

const edition = (id: string, status: Edition["status"]): Edition => ({
  id,
  title: id,
  description: "",
  status,
  spec: DEFAULT_SPECS.monthly,
})

describe("parseEdition", () => {
  it("id는 경로에 쓰이므로 영문 소문자·숫자·하이픈만 받는다", () => {
    expect(parseEdition(edition("monthly-cream", "draft"))).not.toBeInstanceOf(Error)
    expect(parseEdition(edition("../etc", "draft"))).toBeInstanceOf(Error)
    expect(parseEdition(edition("크림", "draft"))).toBeInstanceOf(Error)
  })
})

describe("nextEditionId", () => {
  it("종류 이름 뒤에 그 종류에서 가장 큰 번호 + 1을 붙인다", () => {
    expect(nextEditionId("monthly", [])).toBe("monthly-1")
    expect(nextEditionId("monthly", ["monthly-1", "monthly-4", "year-sheet-9", "aa"])).toBe("monthly-5")
    expect(nextEditionId("year-sheet", ["monthly-1"])).toBe("year-sheet-1")
  })

  it("중간의 빈 번호를 채우지 않고 최댓값을 잇는다", () => {
    expect(nextEditionId("month-poster", ["month-poster-2"])).toBe("month-poster-3")
  })
})

describe("downloadPath", () => {
  it("에디션·용지·쪽으로 해시 없는 고정 경로를 만든다", () => {
    expect(downloadPath("monthly-cream", "A4", 10)).toBe("/downloads/monthly-cream/a4/10.pdf")
    expect(downloadPath("monthly-cream", "A3", "all")).toBe("/downloads/monthly-cream/a3/all.pdf")
  })
})

describe("buildManifest", () => {
  it("공개된 에디션만, id 순서로 담고 파일 경로는 KIND_PAGES를 따른다", () => {
    const manifest = buildManifest(
      [edition("b", "published"), edition("a", "published"), edition("c", "draft")],
      { a: { specHash: "aa", generatedAt: "2026-10-16", bytes: {} }, b: { specHash: "bb", generatedAt: "2026-10-15", bytes: {} } },
    )
    expect(manifest.editions.map((entry) => entry.id)).toEqual(["a", "b"])
    expect(Object.keys(manifest.editions[0]!.files.A4)).toEqual(["all"])
    expect(manifest.editions[0]!.specHash).toBe("aa")
  })
})
