import { describe, expect, it } from "vitest"

import { buildManifest, downloadPath, EDITION_LIMITS, isBuildCurrent, nextEditionId, parseEdition, type Edition } from "./edition"
import { DEFAULT_SPECS, specHash } from "./spec"

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

describe("parseEdition 예전 에디션", () => {
  it("1차 구현 때 저장한 월간 에디션(foodLayout, cover: true)이 새 모양으로 읽힌다", () => {
    const { layout: _layout, ...rest } = DEFAULT_SPECS.monthly
    const parsed = parseEdition({ ...edition("monthly-1", "draft"), spec: { ...rest, foodLayout: "scatter", cover: true } })
    expect(parsed).not.toBeInstanceOf(Error)
    expect((parsed as Edition).spec).toEqual(DEFAULT_SPECS.monthly)
  })
})

describe("parseEdition 글자 수", () => {
  it("이름은 1자 이상 EDITION_LIMITS.title자 이하만 받는다", () => {
    expect(parseEdition({ ...edition("monthly-1", "draft"), title: " " })).toBeInstanceOf(Error)
    expect(parseEdition({ ...edition("monthly-1", "draft"), title: "가".repeat(EDITION_LIMITS.title) })).not.toBeInstanceOf(Error)
    expect(parseEdition({ ...edition("monthly-1", "draft"), title: "가".repeat(EDITION_LIMITS.title + 1) })).toBeInstanceOf(Error)
  })
})

describe("isBuildCurrent", () => {
  const spec = DEFAULT_SPECS.monthly
  const build = { specHash: specHash(spec), generatedAt: "2026-10-16T12:00:00.000Z", bytes: {} }

  it("같은 사양으로 만든 기록만 최신이다", () => {
    expect(isBuildCurrent(spec, build)).toBe(true)
    expect(isBuildCurrent({ ...spec, year: spec.year + 1 }, build)).toBe(false)
  })

  it("기록이 없으면 최신이 아니다", () => {
    expect(isBuildCurrent(spec, undefined)).toBe(false)
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
  it("에디션·용지마다 해시 없는 고정 경로 하나를 만든다", () => {
    expect(downloadPath("monthly-cream", "A4")).toBe("/downloads/monthly-cream/a4.pdf")
    expect(downloadPath("monthly-cream", "A3")).toBe("/downloads/monthly-cream/a3.pdf")
  })
})

describe("buildManifest", () => {
  it("공개된 에디션만, id 순서로 담고 용지마다 파일 하나와 크기를 적는다", () => {
    const manifest = buildManifest(
      [edition("b", "published"), edition("a", "published"), edition("c", "draft")],
      { a: { specHash: "aa", generatedAt: "2026-10-16", bytes: { "/downloads/a/a4.pdf": 120 } }, b: { specHash: "bb", generatedAt: "2026-10-15", bytes: {} } },
    )
    expect(manifest.editions.map((entry) => entry.id)).toEqual(["a", "b"])
    expect(manifest.editions[0]!.files).toEqual({
      A4: { path: "/downloads/a/a4.pdf", bytes: 120 },
      A3: { path: "/downloads/a/a3.pdf", bytes: 0 },
    })
    expect(manifest.editions[0]!.specHash).toBe("aa")
  })
})
