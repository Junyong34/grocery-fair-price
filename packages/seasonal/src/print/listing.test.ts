import { describe, expect, it } from "vitest"

import { DOWNLOADS_COPY } from "../data/copy"
import type { ManifestEntry } from "./edition"
import { attachmentDisposition, downloadFileName, editionMeta, editionName, featuredEdition, megabytes, replacementFor, resolveDownload, shelvesOf } from "./listing"

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

describe("resolveDownload", () => {
  const manifest = { editions: [entry("monthly-2", "monthly", { year: 2027 })], withdrawn: [{ id: "monthly-1", kind: "monthly" as const, title: "2026 크림", year: 2026 }] }

  it("게시된 에디션의 공개 용지면 파일", () => {
    expect(resolveDownload(manifest, "monthly-2", "a4")).toEqual({ type: "file", edition: manifest.editions[0], paper: "A4" })
  })

  it("공개하지 않은 용지(A3)나 없는 에디션은 없음", () => {
    expect(resolveDownload(manifest, "monthly-2", "a3")).toEqual({ type: "missing" })
    expect(resolveDownload(manifest, "nope", "a4")).toEqual({ type: "missing" })
  })

  it("내린 에디션은 용지와 상관없이 내림(상세 안내로 보낸다)", () => {
    expect(resolveDownload(manifest, "monthly-1", "a4")).toEqual({ type: "withdrawn", id: "monthly-1" })
  })
})

describe("replacementFor", () => {
  it("같은 종류에서 가장 새 연도, 같으면 id 순서로 첫째", () => {
    const editions = [entry("p", "month-poster"), entry("m-3", "monthly", { year: 2027 }), entry("m-2", "monthly", { year: 2027 }), entry("m-9", "monthly", { year: 2026 })]
    expect(replacementFor({ kind: "monthly" }, editions)?.id).toBe("m-2")
  })

  it("같은 종류가 없으면 없음", () => {
    expect(replacementFor({ kind: "year-sheet" }, [entry("p", "month-poster")])).toBeUndefined()
  })
})

describe("downloadFileName", () => {
  it("이름과 용지로 저장 파일 이름을 만든다", () => {
    expect(downloadFileName({ kind: "monthly", title: "2027 크림" }, "A4")).toBe("2027 크림 월간 달력 A4.pdf")
  })
})

describe("attachmentDisposition", () => {
  it("한글 이름은 filename*(RFC 5987)에, 영문 대체 이름은 filename에 넣는다", () => {
    expect(attachmentDisposition({ id: "monthly-1", kind: "monthly", title: "2027 크림" }, "A4")).toBe(
      `attachment; filename="monthly-1-a4.pdf"; filename*=UTF-8''2027%20%ED%81%AC%EB%A6%BC%20%EC%9B%94%EA%B0%84%20%EB%8B%AC%EB%A0%A5%20A4.pdf`,
    )
  })

  it("encodeURIComponent가 남기는 ' ( ) *도 인코딩한다", () => {
    expect(attachmentDisposition({ id: "m", kind: "monthly", title: "it's (봄)*" }, "A4")).toContain("filename*=UTF-8''it%27s%20%28%EB%B4%84%29%2A%20")
  })
})

describe("featuredEdition", () => {
  it("입구 카드에는 월간 달력 줄의 첫 에디션, 없으면 첫 줄의 첫 에디션", () => {
    expect(featuredEdition([entry("p", "month-poster"), entry("m", "monthly", { year: 2027 })])?.id).toBe("m")
    expect(featuredEdition([entry("p", "month-poster"), entry("s", "season-poster")])?.id).toBe("s")
    expect(featuredEdition([])).toBeUndefined()
  })
})

describe("내린 에디션 문구", () => {
  it("이름 끝 받침에 맞춰 은/는을 고른다", () => {
    expect(DOWNLOADS_COPY.withdrawn.body(editionName({ kind: "monthly", title: "2026 크림" }))).toBe("2026 크림 월간 달력은 더 받을 수 없어요.")
    expect(DOWNLOADS_COPY.withdrawn.body(editionName({ kind: "month-poster", title: "열두 달" }))).toBe("열두 달 월별 제철 포스터는 더 받을 수 없어요.")
  })
})
