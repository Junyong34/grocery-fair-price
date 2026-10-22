import { describe, expect, it } from "vitest"

import { DEFAULT_SPECS, parsePrintSpec, PRINT_KINDS } from "@workspace/seasonal/print/spec"

import { getAt, setAt } from "../lib/spec-path"
import { FOOD_CATEGORIES, isFieldShown, KIND_SECTIONS, type OptionFieldSpec } from "./option-fields"

// 폼(KIND_SECTIONS)과 사양 스키마(parsePrintSpec)가 어긋나지 않는지 본다. 폼이 내는 값은 모두 사양으로 읽혀야 하고, 사양의 값은 모두 폼에서 바꿀 수 있어야 한다.

/** 고정값이라 폼에 없는 경로. */
const FIXED = new Set(["version", "kind"])

function leafPaths(value: unknown, prefix: string[] = []): string[][] {
  if (value && typeof value === "object" && !Array.isArray(value))
    return Object.entries(value).flatMap(([key, child]) => leafPaths(child, [...prefix, key]))
  return [prefix]
}

/** 필드가 낼 수 있는 값들. 숫자는 양 끝, 글자는 짧은 예. */
function samples(field: OptionFieldSpec): unknown[] {
  switch (field.type) {
    case "select":
      return field.options.map((option) => option.value)
    case "toggle":
      return [true, false]
    case "number":
      return [field.min, field.max]
    case "text":
      return ["제목"]
    case "categories":
      return [[], FOOD_CATEGORIES]
  }
}

describe.each(PRINT_KINDS)("%s 폼", (kind) => {
  const base = DEFAULT_SPECS[kind]
  const fields = KIND_SECTIONS[kind].flatMap((section) => section.fields)

  it("기본 사양이 폼의 선택지 안에 있다", () => {
    for (const field of fields) {
      if (field.type !== "select") continue
      expect(field.options.map((option) => option.value), field.label).toContainEqual(getAt(base, field.path))
    }
  })

  // 값 사이 규칙(가로 용지에 2x6 금지)에 걸리면 편집기가 오류를 보여 주고 다른 값을 고치게 한다.
  // 그래서 값 하나만 바꿔 막히면, 다른 필드 하나를 고쳐 풀리는지까지 본다. 어떻게 해도 안 읽히는 선택지가 없어야 한다.
  it("폼이 내는 값은 모두 사양으로 읽힌다(막다른 선택지가 없다)", () => {
    const readable = (spec: unknown) => !(parsePrintSpec(spec) instanceof Error)
    for (const field of fields)
      for (const value of samples(field)) {
        const spec = setAt(base, field.path, value)
        const ok =
          readable(spec) ||
          fields.some((other) => other !== field && samples(other).some((fix) => readable(setAt(spec, other.path, fix))))
        expect(ok, `${field.label}=${JSON.stringify(value)}: ${String(parsePrintSpec(spec))}`).toBe(true)
      }
  })

  it("사양의 값은 모두 폼에서 바꿀 수 있다", () => {
    const covered = new Set(fields.map((field) => field.path.join(".")))
    const missing = leafPaths(base)
      .map((path) => path.join("."))
      .filter((path) => !FIXED.has(path) && !covered.has(path))
    expect(missing).toEqual([])
  })

  it("첫 섹션은 구성이고, 구성(layout) 선택이 맨 앞이다", () => {
    const [first] = KIND_SECTIONS[kind]
    expect(first!.title).toBe("구성")
    expect(first!.fields[0]!.path).toEqual(["layout"])
  })

  it("기본 사양에서는 모든 필드가 보인다", () => {
    for (const field of fields) expect(isFieldShown(field, base), field.label).toBe(true)
  })

  it("한 경로를 두 필드가 나눠 갖지 않는다", () => {
    const paths = fields.map((field) => field.path.join("."))
    expect(paths.length).toBe(new Set(paths).size)
  })
})

describe("isFieldShown", () => {
  const monthly = KIND_SECTIONS.monthly.flatMap((section) => section.fields)
  const byPath = (path: string) => monthly.find((field) => field.path.join(".") === path)!

  it("월간에서 그림 없음을 고르면 품종 이름·개수를 숨긴다", () => {
    const spec = { ...DEFAULT_SPECS.monthly, layout: "none" as const }
    expect(isFieldShown(byPath("foods.names"), spec)).toBe(false)
    expect(isFieldShown(byPath("foods.max"), spec)).toBe(false)
    expect(isFieldShown(byPath("memo"), spec)).toBe(true)
  })
})

describe("월별 포스터 한 줄에 한 달", () => {
  const fields = KIND_SECTIONS["month-poster"].flatMap((section) => section.fields)
  const byPath = (path: string) => fields.find((field) => field.path.join(".") === path)!

  it("이름은 체크 목록에 늘 적고 배열은 한 줄 고정이라, 품종 이름·달 배열을 숨긴다", () => {
    const spec = { ...DEFAULT_SPECS["month-poster"], layout: "rows-check" as const }
    expect(isFieldShown(byPath("foods.names"), spec)).toBe(false)
    expect(isFieldShown(byPath("grid"), spec)).toBe(false)
    expect(isFieldShown(byPath("categories"), spec)).toBe(true)
  })
})

describe("구성마다 숨는 옵션", () => {
  const field = (kind: keyof typeof KIND_SECTIONS, path: string) => KIND_SECTIONS[kind].flatMap((section) => section.fields).find((f) => f.path.join(".") === path)!

  it("월간 달력 옆 체크 목록은 달력 아래 메모를 숨긴다", () => {
    expect(isFieldShown(field("monthly", "memo"), { ...DEFAULT_SPECS.monthly, layout: "side-check" })).toBe(false)
  })

  it("월간 쓰는 달력은 메모·달력 모양(격자 고정)·품종 개수(그림 있는 품종 전부)를 숨긴다", () => {
    const spec = { ...DEFAULT_SPECS.monthly, layout: "strip" as const }
    expect(isFieldShown(field("monthly", "memo"), spec)).toBe(false)
    expect(isFieldShown(field("monthly", "calendar.variant"), spec)).toBe(false)
    expect(isFieldShown(field("monthly", "foods.max"), spec)).toBe(false)
    expect(isFieldShown(field("monthly", "foods.names"), spec)).toBe(true)
  })

  it("월간 그림 판 전체는 메모를 숨기고, 가로(날짜 한 열)에서는 달력 모양·주 시작도 숨긴다", () => {
    const portrait = { ...DEFAULT_SPECS.monthly, layout: "allover" as const, orientation: "portrait" as const }
    const landscape = { ...portrait, orientation: "landscape" as const }
    expect(isFieldShown(field("monthly", "memo"), portrait)).toBe(false)
    expect(isFieldShown(field("monthly", "calendar.variant"), portrait)).toBe(true)
    expect(isFieldShown(field("monthly", "calendar.weekStart"), portrait)).toBe(true)
    expect(isFieldShown(field("monthly", "foods.max"), portrait)).toBe(true)
    expect(isFieldShown(field("monthly", "memo"), landscape)).toBe(false)
    expect(isFieldShown(field("monthly", "calendar.variant"), landscape)).toBe(false)
    expect(isFieldShown(field("monthly", "calendar.weekStart"), landscape)).toBe(false)
  })

  it("연간 큰 그림 위는 달 배열(3x4 고정)과 품종 개수(달마다 하나 고정)를 숨긴다", () => {
    const spec = { ...DEFAULT_SPECS["year-sheet"], layout: "hero-top" as const }
    expect(isFieldShown(field("year-sheet", "grid"), spec)).toBe(false)
    expect(isFieldShown(field("year-sheet", "foods.max"), spec)).toBe(false)
  })
})
