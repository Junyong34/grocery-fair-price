import { describe, expect, it } from "vitest"

import { buildManifest, downloadPath, EDITION_LIMITS, isBuildCurrent, nextEditionId, objectKey, parseEdition, staleObjectKeys, thumbnailPages, thumbnailPath, type BuildRecord, type Edition } from "./edition"
import { DEFAULT_SPECS, specHash } from "./spec"

const edition = (id: string, status: Edition["status"]): Edition => ({
  id,
  title: id,
  description: status === "published" ? `${id} 설명` : "",
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
  const build = { specHash: specHash(spec), generatedAt: "2026-10-16T12:00:00.000Z", bytes: {}, thumbnails: [] }

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

describe("staleObjectKeys", () => {
  const manifest = (ids: string[]) => ({ editions: ids.map((id) => ({ id }) as never), withdrawn: [] })

  it("공개 목록에 없는 에디션의 객체를 고른다", () => {
    const keys = ["downloads/monthly-1/a4.pdf", "downloads/monthly-2/a4.pdf"]
    expect(staleObjectKeys(keys, manifest(["monthly-1"]))).toEqual(["downloads/monthly-2/a4.pdf"])
  })

  it("공개 에디션이라도 공개하지 않는 용지나 모르는 파일은 고른다", () => {
    const keys = ["downloads/monthly-1/a4.pdf", "downloads/monthly-1/a3.pdf", "downloads/monthly-1/old.pdf", "_check/hello.txt"]
    expect(staleObjectKeys(keys, manifest(["monthly-1"]))).toEqual(["downloads/monthly-1/a3.pdf", "downloads/monthly-1/old.pdf", "_check/hello.txt"])
  })

  it("모두 공개 중이면 비어 있다", () => {
    expect(staleObjectKeys(["downloads/monthly-1/a4.pdf"], manifest(["monthly-1"]))).toEqual([])
  })
})

describe("objectKey", () => {
  it("R2 키는 로컬 경로에서 앞의 /만 뺀 것이다", () => {
    expect(objectKey("monthly-1", "A4")).toBe("downloads/monthly-1/a4.pdf")
    expect(objectKey("monthly-1", "A4")).toBe(downloadPath("monthly-1", "A4").slice(1))
  })
})

describe("parseEdition 공개 조건", () => {
  it("공개하려면 설명이 있어야 한다(카드에 보이는 한 줄)", () => {
    expect(parseEdition({ ...edition("monthly-1", "published"), description: " " })).toBeInstanceOf(Error)
    expect(parseEdition({ ...edition("monthly-1", "draft"), description: "" })).not.toBeInstanceOf(Error)
    expect(parseEdition({ ...edition("monthly-1", "withdrawn"), description: "" })).not.toBeInstanceOf(Error)
  })
})

describe("thumbnailPages", () => {
  it("월간 달력은 표지가 있으면 표지와 첫 달, 없으면 첫 달 한 장", () => {
    expect(thumbnailPages({ ...DEFAULT_SPECS.monthly, cover: "year" })).toEqual([0, 1])
    expect(thumbnailPages({ ...DEFAULT_SPECS.monthly, cover: "none" })).toEqual([0])
  })

  it("나머지 종류는 첫 쪽 한 장", () => {
    expect(thumbnailPages(DEFAULT_SPECS["year-sheet"])).toEqual([0])
    expect(thumbnailPages(DEFAULT_SPECS["season-poster"])).toEqual([0])
    expect(thumbnailPages(DEFAULT_SPECS["month-poster"])).toEqual([0])
  })
})

describe("thumbnailPath", () => {
  it("에디션 폴더 안에 쪽 순서대로 webp 하나", () => {
    expect(thumbnailPath("monthly-cream", 0)).toBe("/downloads/monthly-cream/thumb-1.webp")
    expect(thumbnailPath("monthly-cream", 1)).toBe("/downloads/monthly-cream/thumb-2.webp")
  })
})

describe("buildManifest", () => {
  const thumb = (id: string) => [{ path: thumbnailPath(id, 0), width: 480, height: 679 }]
  const build = (id: string, bytes: Record<string, number> = {}): BuildRecord => ({ specHash: `${id}-hash`, generatedAt: "2026-10-16", bytes, thumbnails: thumb(id) })

  it("공개된 에디션 가운데 생성 기록이 있는 것만, id 순서로 담는다", () => {
    const manifest = buildManifest([edition("b", "published"), edition("a", "published"), edition("c", "draft"), edition("d", "published")], {
      a: build("a"),
      b: build("b"),
      c: build("c"),
    })
    expect(manifest.editions.map((entry) => entry.id)).toEqual(["a", "b"])
  })

  it("공개 용지(A4)만 담는다. A3는 만들어도 내놓지 않는다", () => {
    const manifest = buildManifest([edition("a", "published")], { a: build("a", { "/downloads/a/a4.pdf": 120, "/downloads/a/a3.pdf": 240 }) })
    expect(manifest.editions[0]!.files).toEqual({ A4: { bytes: 120 } })
  })

  it("카드에 쓸 값(썸네일·연도·방향·쪽 수)을 옮긴다", () => {
    const monthly = { ...edition("a", "published"), spec: { ...DEFAULT_SPECS.monthly, year: 2027, cover: "year" as const } }
    const poster = { ...edition("p", "published"), spec: DEFAULT_SPECS["month-poster"] }
    const [a, p] = buildManifest([monthly, poster], { a: build("a"), p: build("p") }).editions
    expect(a).toMatchObject({ kind: "monthly", year: 2027, orientation: monthly.spec.orientation, pages: 13, thumbnails: thumb("a"), description: "a 설명" })
    expect(p!.year).toBeUndefined()
    expect(p!.pages).toBe(1)
  })

  it("내린 에디션은 목록에서 빠지고 withdrawn에 남는다(옛 링크 안내용). 생성 기록이 없어도 된다", () => {
    const manifest = buildManifest([edition("a", "published"), edition("old", "withdrawn")], { a: build("a") })
    expect(manifest.editions.map((entry) => entry.id)).toEqual(["a"])
    expect(manifest.withdrawn).toEqual([{ id: "old", kind: "monthly", title: "old", year: DEFAULT_SPECS.monthly.year }])
  })
})
