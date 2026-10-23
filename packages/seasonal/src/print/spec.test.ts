import { describe, expect, it } from "vitest"

import {
  DEFAULT_SPECS,
  PAPERS,
  PRINT_KINDS,
  decodeSpec,
  encodeSpec,
  pageCount,
  parsePrintSpec,
  sheetSize,
  specHash,
} from "./spec"

// 1차 구현(2026-10-16) 때 저장된 모양. 월간은 foodLayout·cover: boolean, 나머지는 layout이 없다.
const LEGACY_COMMON = {
  version: 1,
  orientation: "portrait",
  type: { heading: "gowun-batang", number: "pretendard", scale: 1 },
  surface: "cream",
  margin: "safe",
} as const
const LEGACY = {
  monthly: {
    ...LEGACY_COMMON,
    kind: "monthly",
    year: 2027,
    cover: true,
    monthLabel: "number",
    calendar: { variant: "plain", weekStart: 0, weekday: "korean", holidays: "mark-and-name" },
    foods: { names: "korean", max: 8 },
    foodLayout: "grid",
    memo: "none",
  },
  "year-sheet": {
    ...LEGACY_COMMON,
    kind: "year-sheet",
    year: 2027,
    monthLabel: "big-number",
    calendar: { weekStart: 0, weekday: "korean", holidays: "mark" },
    foods: { names: "hidden", max: 4 },
    grid: "2x6",
  },
  "season-poster": { ...LEGACY_COMMON, kind: "season-poster", title: "계절별 제철 음식", seasonLabel: "english-korean", foods: { names: "korean", max: 24 }, categories: [] },
  "month-poster": { ...LEGACY_COMMON, kind: "month-poster", title: "달마다 제철", monthLabel: "korean", foods: { names: "korean", max: 8 }, grid: "3x4", categories: [] },
}

describe("PAPERS", () => {
  it("A3는 A4를 √2배 키운 크기다(1mm 안)", () => {
    expect(Math.abs(PAPERS.A4.width * PAPERS.A3.scale - PAPERS.A3.width)).toBeLessThan(1)
    expect(Math.abs(PAPERS.A4.height * PAPERS.A3.scale - PAPERS.A3.height)).toBeLessThan(1)
  })
})

describe("sheetSize", () => {
  it("가로 방향은 폭과 높이를 맞바꾼다", () => {
    expect(sheetSize("A4", "portrait")).toEqual({ width: 210, height: 297 })
    expect(sheetSize("A3", "landscape")).toEqual({ width: 420, height: 297 })
  })
})

describe("parsePrintSpec", () => {
  it("종류마다 기본 사양은 그대로 통과한다", () => {
    for (const kind of PRINT_KINDS) expect(parsePrintSpec(DEFAULT_SPECS[kind])).toEqual(DEFAULT_SPECS[kind])
  })

  it("여백 옵션이 없는 예전 사양은 기본 여백으로 읽는다", () => {
    const { margin: _margin, ...legacy } = DEFAULT_SPECS.monthly
    expect(parsePrintSpec(legacy)).toEqual({ ...DEFAULT_SPECS.monthly, margin: "safe" })
  })

  it("달 표기 색·크기·장식이 없는 예전 사양은 계절색·보통·장식 없음으로 읽는다", () => {
    for (const kind of ["monthly", "year-sheet", "month-poster"] as const) {
      const { monthStyle: _monthStyle, ...legacy } = DEFAULT_SPECS[kind]
      expect(parsePrintSpec(legacy)).toEqual({ ...DEFAULT_SPECS[kind], monthStyle: { palette: "season", size: "medium", frame: "none" } })
    }
  })

  it("예전 달 표기 english는 english-full(좁은 자리 Jan, 제목 January)로 읽는다", () => {
    expect(parsePrintSpec({ ...DEFAULT_SPECS.monthly, monthLabel: "english" })).toEqual({ ...DEFAULT_SPECS.monthly, monthLabel: "english-full" })
    expect(parsePrintSpec({ ...DEFAULT_SPECS["year-sheet"], monthLabel: "english" })).toEqual({ ...DEFAULT_SPECS["year-sheet"], monthLabel: "english-full" })
  })

  it("예전 월간 사양의 foodLayout은 layout으로, cover 참·거짓은 year·none으로 읽는다", () => {
    const parsed = parsePrintSpec(LEGACY.monthly)
    expect(parsed).toMatchObject({ layout: "grid", cover: "year" })
    expect(parsed).not.toHaveProperty("foodLayout")
    expect(parsePrintSpec({ ...LEGACY.monthly, cover: false })).toMatchObject({ cover: "none" })
  })

  it("layout이 없는 예전 사양은 지금 모양(pairs·bands·cells)으로 읽는다", () => {
    expect(parsePrintSpec(LEGACY["year-sheet"])).toMatchObject({ layout: "pairs" })
    expect(parsePrintSpec(LEGACY["season-poster"])).toMatchObject({ layout: "bands" })
    expect(parsePrintSpec(LEGACY["month-poster"])).toMatchObject({ layout: "cells" })
  })

  it("새 모양 사양에 layout이 있으면 foodLayout보다 layout을 따른다", () => {
    expect(parsePrintSpec({ ...DEFAULT_SPECS.monthly, layout: "none", foodLayout: "scatter" })).toMatchObject({ layout: "none" })
  })

  it("한 줄에 한 달(rows-check)은 세로 용지만 받는다", () => {
    const spec = { ...DEFAULT_SPECS["month-poster"], layout: "rows-check" }
    expect(parsePrintSpec(spec)).not.toBeInstanceOf(Error)
    expect(parsePrintSpec({ ...spec, orientation: "landscape" })).toBeInstanceOf(Error)
  })

  it("월간 달력 옆 체크 목록(side-check)과 연간 큰 그림 위(hero-top)는 세로 용지만 받는다", () => {
    for (const spec of [
      { ...DEFAULT_SPECS.monthly, layout: "side-check" },
      { ...DEFAULT_SPECS["year-sheet"], layout: "hero-top" },
    ]) {
      expect(parsePrintSpec(spec)).not.toBeInstanceOf(Error)
      expect(parsePrintSpec({ ...spec, orientation: "landscape" })).toBeInstanceOf(Error)
    }
  })

  it("월간 쓰는 달력(strip)은 두 방향 모두 받는다", () => {
    const spec = { ...DEFAULT_SPECS.monthly, layout: "strip" }
    expect(parsePrintSpec(spec)).not.toBeInstanceOf(Error)
    expect(parsePrintSpec({ ...spec, orientation: "landscape" })).not.toBeInstanceOf(Error)
  })

  it("월간 그림 판 전체(allover)는 두 방향 모두 받는다", () => {
    const spec = { ...DEFAULT_SPECS.monthly, layout: "allover" }
    expect(parsePrintSpec(spec)).not.toBeInstanceOf(Error)
    expect(parsePrintSpec({ ...spec, orientation: "landscape" })).not.toBeInstanceOf(Error)
  })

  it("계절 포스터는 계절마다 한 장(per-season)을 두 방향 모두 받는다", () => {
    const spec = { ...DEFAULT_SPECS["season-poster"], layout: "per-season" }
    expect(parsePrintSpec(spec)).not.toBeInstanceOf(Error)
    expect(parsePrintSpec({ ...spec, orientation: "landscape" })).not.toBeInstanceOf(Error)
  })

  it("계절 포스터 사계절 원형 판(wheel)은 두 방향 모두 받고 1쪽이다", () => {
    const spec = { ...DEFAULT_SPECS["season-poster"], layout: "wheel" }
    expect(parsePrintSpec(spec)).not.toBeInstanceOf(Error)
    expect(parsePrintSpec({ ...spec, orientation: "landscape" })).not.toBeInstanceOf(Error)
    expect(pageCount({ ...DEFAULT_SPECS["season-poster"], layout: "wheel" })).toBe(1)
  })

  it("월별 포스터 원형 판(wheel)은 두 방향 모두 받는다", () => {
    const spec = { ...DEFAULT_SPECS["month-poster"], layout: "wheel" }
    expect(parsePrintSpec(spec)).not.toBeInstanceOf(Error)
    expect(parsePrintSpec({ ...spec, orientation: "landscape" })).not.toBeInstanceOf(Error)
  })

  it("월별 포스터 막대표(chart)는 두 방향 모두 받는다", () => {
    const spec = { ...DEFAULT_SPECS["month-poster"], layout: "chart" }
    expect(parsePrintSpec(spec)).not.toBeInstanceOf(Error)
    expect(parsePrintSpec({ ...spec, orientation: "landscape" })).not.toBeInstanceOf(Error)
  })

  it("연간 한 장 열두 달 달력 + 막대표(chart)는 두 방향 모두 받는다", () => {
    const spec = { ...DEFAULT_SPECS["year-sheet"], layout: "chart" }
    expect(parsePrintSpec(spec)).not.toBeInstanceOf(Error)
    expect(parsePrintSpec({ ...spec, orientation: "landscape", grid: "3x4" })).not.toBeInstanceOf(Error)
  })

  it("월간 표지 1년 제철 표(chart)를 받는다", () => {
    expect(parsePrintSpec({ ...DEFAULT_SPECS.monthly, cover: "chart" })).toMatchObject({ cover: "chart" })
  })

  it("계절 포스터는 사분면·네 열(quarters)을 두 방향 모두 받는다", () => {
    const spec = { ...DEFAULT_SPECS["season-poster"], layout: "quarters" }
    expect(parsePrintSpec(spec)).not.toBeInstanceOf(Error)
    expect(parsePrintSpec({ ...spec, orientation: "landscape" })).not.toBeInstanceOf(Error)
  })

  it("달력 글자 크기가 없는 예전 사양은 보통으로 읽고, 포스터에는 없다", () => {
    for (const kind of ["monthly", "year-sheet"] as const) {
      const { size: _size, ...calendar } = DEFAULT_SPECS[kind].calendar
      expect(parsePrintSpec({ ...DEFAULT_SPECS[kind], calendar })).toMatchObject({ calendar: { size: "medium" } })
      expect(parsePrintSpec({ ...DEFAULT_SPECS[kind], calendar: { ...calendar, size: "huge" } })).toBeInstanceOf(Error)
    }
    expect(parsePrintSpec(LEGACY.monthly)).toMatchObject({ calendar: { size: "medium" } })
  })

  it("없는 구성 값은 오류다", () => {
    expect(parsePrintSpec({ ...DEFAULT_SPECS.monthly, layout: "wheel" })).toBeInstanceOf(Error)
    expect(parsePrintSpec({ ...DEFAULT_SPECS["year-sheet"], layout: "cells" })).toBeInstanceOf(Error)
    expect(parsePrintSpec({ ...DEFAULT_SPECS.monthly, cover: "poster" })).toBeInstanceOf(Error)
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
    expect(specHash({ ...spec, cover: "none" })).not.toBe(specHash(spec))
  })
})

describe("쪽 수", () => {
  it("월간 달력은 열두 달에 표지를 켜면 하나 더한다", () => {
    expect(pageCount({ ...DEFAULT_SPECS.monthly, cover: "none" })).toBe(12)
    expect(pageCount({ ...DEFAULT_SPECS.monthly, cover: "year" })).toBe(13)
    expect(pageCount({ ...DEFAULT_SPECS.monthly, cover: "months" })).toBe(13)
    expect(pageCount({ ...DEFAULT_SPECS.monthly, cover: "chart" })).toBe(13)
  })

  it("계절 포스터를 계절마다 한 장(per-season)으로 하면 4쪽이다", () => {
    expect(pageCount({ ...DEFAULT_SPECS["season-poster"], layout: "per-season" })).toBe(4)
  })

  it("나머지 종류는 한 장이다", () => {
    expect(pageCount(DEFAULT_SPECS["year-sheet"])).toBe(1)
    expect(pageCount(DEFAULT_SPECS["season-poster"])).toBe(1)
    expect(pageCount(DEFAULT_SPECS["month-poster"])).toBe(1)
  })
})
