import { describe, expect, it } from "vitest"

import { formatArtMeta, parseArtMeta, type ArtMeta } from "./art-meta"

const meta: ArtMeta = { id: "abalone", name: "전복", review: "unreviewed", references: [] }

describe("parseArtMeta", () => {
  it("미검수 그림은 검수일 없이 받는다", () => {
    expect(parseArtMeta(meta)).toEqual(meta)
  })

  it("검수일은 YYYY-MM-DD만 받는다", () => {
    expect(parseArtMeta({ ...meta, review: "reviewed", reviewedAt: "2026-11-12" }).reviewedAt).toBe("2026-11-12")
    expect(() => parseArtMeta({ ...meta, review: "reviewed", reviewedAt: "11/12" })).toThrow()
  })

  it("미검수 그림에 검수일이 있으면 받지 않는다", () => {
    expect(() => parseArtMeta({ ...meta, reviewedAt: "2026-11-12" })).toThrow()
  })

  it("그림 ID는 영문 소문자 kebab-case만 받는다", () => {
    expect(() => parseArtMeta({ ...meta, id: "Abalone" })).toThrow()
  })
})

describe("formatArtMeta", () => {
  it("다시 읽으면 같은 값이 나오고 줄바꿈으로 끝난다", () => {
    const text = formatArtMeta(meta)

    expect(parseArtMeta(JSON.parse(text))).toEqual(meta)
    expect(text.endsWith("}\n")).toBe(true)
  })
})
