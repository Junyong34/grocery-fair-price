import { describe, expect, it } from "vitest"

import type { ManifestEntry } from "./edition"
import { editionMeta, editionName, megabytes, shelvesOf } from "./listing"

const entry = (id: string, kind: ManifestEntry["kind"], extra: Partial<ManifestEntry> = {}): ManifestEntry => ({
  id,
  kind,
  title: id,
  description: "",
  orientation: "portrait",
  pages: 1,
  specHash: "h",
  generatedAt: "2026-10-29",
  files: { A4: { bytes: 0 } },
  thumbnails: [],
  ...extra,
})

describe("shelvesOf", () => {
  it("인쇄물 종류 순서(월간 · 연간 · 계절 · 월별)로 줄을 만들고 빈 종류는 뺀다", () => {
    const shelves = shelvesOf([entry("p", "month-poster"), entry("m", "monthly", { year: 2027 })])
    expect(shelves.map((shelf) => shelf.kind)).toEqual(["monthly", "month-poster"])
  })

  it("줄 안에서는 새 연도가 앞이고, 같으면 id 순서다", () => {
    const shelves = shelvesOf([
      entry("monthly-3", "monthly", { year: 2026 }),
      entry("monthly-2", "monthly", { year: 2027 }),
      entry("monthly-1", "monthly", { year: 2027 }),
    ])
    expect(shelves[0]!.editions.map((edition) => edition.id)).toEqual(["monthly-1", "monthly-2", "monthly-3"])
  })
})

describe("editionName", () => {
  it("제목 뒤에 종류를 붙인다(줄 밖에서 쓰는 이름: 시트 제목, 탭 제목)", () => {
    expect(editionName({ kind: "monthly", title: "2027 크림" })).toBe("2027 크림 월간 달력")
  })
})

describe("megabytes", () => {
  it("소수 한 자리 MB", () => {
    expect(megabytes(7_808_881)).toBe("7.4MB")
    expect(megabytes(0)).toBe("0.0MB")
  })
})

describe("editionMeta", () => {
  it("용지 · 방향 · 쪽 수 · 크기", () => {
    expect(editionMeta(entry("m", "monthly", { pages: 13, files: { A4: { bytes: 7_808_881 } } }))).toEqual(["A4 세로", "13쪽", "7.4MB"])
    expect(editionMeta(entry("y", "year-sheet", { orientation: "landscape", files: { A4: { bytes: 1_048_576 } } }))).toEqual(["A4 가로", "1쪽", "1.0MB"])
  })
})
