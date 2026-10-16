import { describe, expect, it } from "vitest"

import {
  DEFAULT_SPECS,
  KIND_PAGES,
  PAPERS,
  PRINT_KINDS,
  decodeSpec,
  encodeSpec,
  pageCount,
  parsePrintSpec,
  specHash,
} from "./spec"

describe("PAPERS", () => {
  it("A3는 A4를 √2배 키운 크기다(1mm 안)", () => {
    expect(Math.abs(PAPERS.A4.width * PAPERS.A3.scale - PAPERS.A3.width)).toBeLessThan(1)
    expect(Math.abs(PAPERS.A4.height * PAPERS.A3.scale - PAPERS.A3.height)).toBeLessThan(1)
  })
})

describe("parsePrintSpec", () => {
  it("종류마다 기본 사양은 그대로 통과한다", () => {
    for (const kind of PRINT_KINDS) expect(parsePrintSpec(DEFAULT_SPECS[kind])).toEqual(DEFAULT_SPECS[kind])
  })

  it("모르는 종류, 없는 선택지는 오류다", () => {
    expect(parsePrintSpec({ ...DEFAULT_SPECS.monthly, kind: "poster" })).toBeInstanceOf(Error)
    expect(parsePrintSpec({ ...DEFAULT_SPECS.monthly, orientation: "square" })).toBeInstanceOf(Error)
    expect(parsePrintSpec("{}")).toBeInstanceOf(Error)
  })

  it("연간 한 장에서는 공휴일 이름을 고를 수 없다", () => {
    const spec = { ...DEFAULT_SPECS["year-sheet"], calendar: { ...DEFAULT_SPECS["year-sheet"].calendar, holidays: "mark-and-name" } }
    expect(parsePrintSpec(spec)).toBeInstanceOf(Error)
  })

  it("포스터에는 연도가 없고, 들어와도 버린다", () => {
    const parsed = parsePrintSpec({ ...DEFAULT_SPECS["season-poster"], year: 2026 })
    expect(parsed).not.toBeInstanceOf(Error)
    expect(parsed).not.toHaveProperty("year")
  })

  it("가로 용지에 세로로 긴 칸 배열(2x6)은 글자가 너무 작아져 거른다", () => {
    expect(parsePrintSpec({ ...DEFAULT_SPECS["year-sheet"], orientation: "landscape", grid: "2x6" })).toBeInstanceOf(Error)
    expect(parsePrintSpec({ ...DEFAULT_SPECS["year-sheet"], orientation: "portrait", grid: "2x6" })).not.toBeInstanceOf(Error)
  })
})

describe("encodeSpec · decodeSpec", () => {
  it("URL로 보낸 사양이 그대로 돌아온다(한글 제목 포함)", () => {
    const spec = { ...DEFAULT_SPECS["month-poster"], title: "달마다 제철" }
    const encoded = encodeSpec(spec)
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(decodeSpec(encoded)).toEqual(spec)
  })

  it("깨진 값은 오류다", () => {
    expect(decodeSpec("!!!")).toBeInstanceOf(Error)
  })
})

describe("specHash", () => {
  it("키 순서와 상관없이 같은 사양이면 같은 해시다", () => {
    const spec = DEFAULT_SPECS.monthly
    const shuffled = Object.fromEntries(Object.entries(spec).reverse()) as typeof spec
    expect(specHash(shuffled)).toBe(specHash(spec))
    expect(specHash({ ...spec, cover: !spec.cover })).not.toBe(specHash(spec))
  })
})

describe("쪽", () => {
  it("월간 달력은 달별 12개와 묶음 하나, 나머지는 한 장이다", () => {
    expect(KIND_PAGES.monthly).toHaveLength(13)
    expect(KIND_PAGES["year-sheet"]).toEqual(["all"])
  })

  it("묶음 쪽 수는 표지를 켜면 하나 늘어난다", () => {
    expect(pageCount({ ...DEFAULT_SPECS.monthly, cover: false }, "all")).toBe(12)
    expect(pageCount({ ...DEFAULT_SPECS.monthly, cover: true }, "all")).toBe(13)
    expect(pageCount(DEFAULT_SPECS.monthly, 10)).toBe(1)
    expect(pageCount(DEFAULT_SPECS["season-poster"], "all")).toBe(1)
  })
})
