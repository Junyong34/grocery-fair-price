import { describe, expect, it } from "vitest"

import { buildManifest, downloadPath, parseEdition, type Edition } from "./edition"
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
    expect(Object.keys(manifest.editions[0]!.files.A4)).toHaveLength(13)
    expect(manifest.editions[0]!.specHash).toBe("aa")
  })
})
