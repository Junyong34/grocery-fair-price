import { describe, expect, it } from "vitest"

import { DEFAULT_SPECS, parsePrintSpec, PRINT_KINDS } from "@workspace/seasonal/print/spec"

import { getAt, setAt } from "../lib/spec-path"
import { FOOD_CATEGORIES, KIND_SECTIONS, type OptionFieldSpec } from "./option-fields"

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

  it("한 경로를 두 필드가 나눠 갖지 않는다", () => {
    const paths = fields.map((field) => field.path.join("."))
    expect(paths.length).toBe(new Set(paths).size)
  })
})
