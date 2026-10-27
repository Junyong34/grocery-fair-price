import { CALENDAR_VARIANT_LABELS, CALENDAR_VARIANTS } from "@workspace/seasonal/calendar/variants"
import { FOODS } from "@workspace/seasonal/data/foods"
import { printMonthLabel, PRINT_MONTH_LABELS } from "@workspace/seasonal/print/month-label"
import { LAYOUT_DEFS, layoutDef, layoutReads, type LayoutDef, type LayoutOption } from "@workspace/seasonal/print/layouts"
import type { PrintKind, PrintSpec } from "@workspace/seasonal/print/spec"

export const FOOD_CATEGORIES = [...new Set(FOODS.map((food) => food.category))]

/**
 * code는 그 값이 그리는 와이어프레임 안(wireframe-catalog.ts). 구성·표지 선택을 썸네일로 보일 때 쓴다.
 * when이 거짓이면 이 구성에서 뜻이 없는 선택지라 목록에서 뺀다. 이미 고른 값은 사양에 남는다.
 */
export type Option = { value: string | number; label: string; code?: string; when?: (spec: PrintSpec) => boolean }

export type OptionFieldSpec = (
  | {
      type: "select"
      label: string
      path: readonly string[]
      options: readonly Option[]
      /** 있으면 선택지를 이 쪽(시트·표지)의 와이어프레임 썸네일로 보인다. 아직 안 되는 안(needs-option)은 "준비 중"으로 덧붙인다. */
      wireframes?: "sheet" | "cover"
    }
  | { type: "toggle"; label: string; path: readonly string[] }
  | {
      type: "number"
      label: string
      path: readonly string[]
      min: number
      max: number
      /** 있으면 지금 사양에서의 최대값(구성마다 판 크기 상한이 다를 때). 패널에 보일 때 max를 이것으로 바꾼다. */
      maxFor?: (spec: PrintSpec) => number
    }
  | { type: "text"; label: string; path: readonly string[] }
  | { type: "categories"; label: string; path: readonly string[] }
) & {
  hint?: string
  /** 이 구성에서만 뜻이 있는 옵션. 거짓이면 패널에서 숨기고, 인쇄도 그 값을 보지 않는다. 값은 사양에 남는다. */
  when?: (spec: PrintSpec) => boolean
}

export type OptionSection = { title: string; fields: readonly OptionFieldSpec[] }

export function isFieldShown(field: OptionFieldSpec, spec: PrintSpec): boolean {
  return field.when?.(spec) ?? true
}

/** 패널에 보일 모양. 선택 필드에서 이 구성에 뜻이 없는 선택지(Option.when)를 빼고, 숫자 필드의 최대값을 이 구성의 상한으로 맞춘다. */
export function shownField(field: OptionFieldSpec, spec: PrintSpec): OptionFieldSpec {
  if (field.type === "number" && field.maxFor) return { ...field, max: field.maxFor(spec) }
  if (field.type !== "select" || !field.options.some((option) => option.when)) return field
  return { ...field, options: field.options.filter((option) => option.when?.(spec) ?? true) }
}

const options = (entries: Record<string, string>): Option[] => Object.entries(entries).map(([value, label]) => ({ value, label }))

const orientation: OptionFieldSpec = { type: "select", label: "방향", path: ["orientation"], options: options({ portrait: "세로", landscape: "가로" }) }
const margin: OptionFieldSpec = {
  type: "select",
  label: "여백",
  path: ["margin"],
  options: options({ safe: "기본 여백", none: "좁은 여백" }),
  hint: "좁은 여백은 그림과 달력을 넓게 써요. 바탕색은 어느 쪽이든 용지 끝까지 칠해져요.",
}
const year: OptionFieldSpec = { type: "number", label: "연도", path: ["year"], min: 2020, max: 2100 }
const title: OptionFieldSpec = { type: "text", label: "제목", path: ["title"] }
/** 선택지 이름은 1월로 적은 그 표기다(두 자리가 숫자와 구별되게). 곁들이는 영문은 한 칸 띄워 붙인다. */
const monthLabel: OptionFieldSpec = {
  type: "select",
  label: "달 표기",
  path: ["monthLabel"],
  options: PRINT_MONTH_LABELS.map((style) => {
    const label = printMonthLabel(1, style)
    return { value: style, label: label.sub ? `${label.main} ${label.sub.text}` : label.main }
  }),
}
/** 달 표기의 색·크기·장식. 연간 Y-A의 "그림 위 큰 숫자"는 색만 따른다. */
const monthStyle: OptionFieldSpec[] = [
  {
    type: "select",
    label: "달 표기 색",
    path: ["monthStyle", "palette"],
    options: options({ season: "계절색", flow: "열두 달 흐름", twelve: "달마다 다른 색", vivid: "쨍한 열두 달" }),
    hint: "바탕까지 계절색으로 칠하려면 서체·배경에서 배경을 계절색으로 고르세요.",
  },
  { type: "select", label: "달 표기 크기", path: ["monthStyle", "size"], options: options({ small: "작게", medium: "보통", large: "크게" }) },
  { type: "select", label: "달 표기 장식", path: ["monthStyle", "frame"], options: options({ none: "없음", rule: "밑줄", pill: "알약 태그", ribbon: "책갈피 리본", outline: "외곽선 숫자" }) },
  {
    type: "select",
    label: "달 표기 서체",
    path: ["monthStyle", "font"],
    options: options({ auto: "서체·배경 따름", "gowun-batang": "고운바탕", pretendard: "프리텐다드" }),
    hint: "따름이면 숫자는 숫자 서체, 1월·January는 제목 서체를 써요.",
  },
]
const grid: OptionFieldSpec = { type: "select", label: "달 배열(열×행)", path: ["grid"], options: options({ "2x6": "2×6", "3x4": "3×4", "4x3": "4×3" }) }
const weekStart: OptionFieldSpec = { type: "select", label: "주 시작", path: ["calendar", "weekStart"], options: [{ value: 0, label: "일요일" }, { value: 1, label: "월요일" }] }
const weekday: OptionFieldSpec = {
  type: "select",
  label: "요일 표기",
  path: ["calendar", "weekday"],
  options: options({ korean: "일 월 화", "english-short": "Sun Mon", "english-initial": "S M T" }),
}
const calendarSize: OptionFieldSpec = {
  type: "select",
  label: "달력 글자 크기",
  path: ["calendar", "size"],
  options: options({ small: "작게", medium: "보통", large: "크게" }),
  hint: "날짜·요일·공휴일 이름만 바뀌어요. 서체·배경의 글자 크기와 곱해져요.",
}
const categories: OptionFieldSpec = { type: "categories", label: "카테고리(비우면 전부)", path: ["categories"] }

/** 구성이 그 옵션을 읽을 때만 보인다(layouts.ts). */
const reads = (option: LayoutOption) => (spec: PrintSpec) => layoutReads(spec, option)

/** 품종 칸. max는 종류의 상한이고, 구성에 판 크기 상한(foodsCap)이 있으면 그보다 작게 고를 수 없다. */
const foods = (max: number): OptionSection => ({
  title: "품종",
  fields: [
    { type: "select", label: "이름", path: ["foods", "names"], options: options({ korean: "한글 이름", hidden: "숨김" }), when: reads("foods.names") },
    {
      type: "number",
      label: "칸마다 최대 개수",
      path: ["foods", "max"],
      min: 1,
      max,
      maxFor: (spec) => Math.min(max, layoutDef(spec).foodsCap ?? max),
      when: reads("foods.max"),
    },
  ],
})

/** 구성(layout) 선택. 이름과 와이어프레임 안 코드는 구성 정의(layouts.ts)에서 온다. */
const layout = (kind: PrintKind): OptionFieldSpec => ({
  type: "select",
  label: "구성",
  path: ["layout"],
  options: Object.entries(LAYOUT_DEFS[kind] as Record<string, LayoutDef>).map(([value, def]) => ({ value, label: def.label, code: def.wireframe })),
  wireframes: "sheet",
})

/** Y-A만 그림 칸이 있어 달 숫자를 그림 위에 크게 얹을 수 있다. */
const yearSheetInPairs = (spec: PrintSpec) => spec.kind === "year-sheet" && spec.layout === "pairs"

const look: OptionSection = {
  title: "서체·배경",
  fields: [
    { type: "select", label: "제목 서체", path: ["type", "heading"], options: options({ "gowun-batang": "고운바탕", pretendard: "프리텐다드" }) },
    { type: "select", label: "숫자 서체", path: ["type", "number"], options: options({ pretendard: "프리텐다드", "gowun-batang": "고운바탕" }) },
    { type: "select", label: "글자 크기", path: ["type", "scale"], options: [{ value: 0.9, label: "작게" }, { value: 1, label: "보통" }, { value: 1.1, label: "크게" }] },
    { type: "select", label: "배경", path: ["surface"], options: options({ cream: "크림", white: "흰색", season: "계절색" }) },
  ],
}

export const KIND_SECTIONS: Record<PrintKind, readonly OptionSection[]> = {
  monthly: [
    {
      title: "구성",
      fields: [
        layout("monthly"),
        {
          type: "select",
          label: "12개월 묶음 표지",
          path: ["cover"],
          options: [
            { value: "year", label: "큰 연도 + 대표 품종", code: "C-1" },
            { value: "months", label: "큰 연도 + 열두 달 미리보기", code: "C-2" },
            { value: "chart", label: "큰 연도 + 1년 제철 막대표", code: "C-3" },
            { value: "none", label: "표지 없음" },
          ],
          wireframes: "cover",
        },
      ],
    },
    { title: "용지", fields: [orientation, margin, year] },
    {
      title: "달력",
      fields: [
        { type: "select", label: "모양", path: ["calendar", "variant"], options: CALENDAR_VARIANTS.map((variant) => ({ value: variant, label: CALENDAR_VARIANT_LABELS[variant] })), when: reads("calendar.variant") },
        { ...weekStart, when: reads("calendar.weekStart") },
        weekday,
        { type: "select", label: "공휴일", path: ["calendar", "holidays"], options: options({ "mark-and-name": "날짜와 이름", mark: "빨간 날짜만", hidden: "표시 안 함" }) },
        calendarSize,
        { type: "select", label: "달력 아래", path: ["memo"], options: options({ none: "없음", lines: "메모 줄", "eaten-check": "먹은 음식 체크 칸" }), when: reads("memo") },
      ],
    },
    { title: "달 표기", fields: [monthLabel, ...monthStyle] },
    foods(40),
    look,
  ],
  "year-sheet": [
    { title: "구성", fields: [layout("year-sheet")] },
    { title: "용지", fields: [orientation, margin, year, { ...grid, when: reads("grid") }] },
    {
      title: "달력",
      fields: [
        weekStart,
        weekday,
        { type: "select", label: "공휴일", path: ["calendar", "holidays"], options: options({ mark: "빨간 날짜", hidden: "표시 안 함" }) },
        calendarSize,
      ],
    },
    { title: "달 표기", fields: [{ ...monthLabel, options: [{ value: "big-number", label: "그림 위 큰 숫자", when: yearSheetInPairs }, ...monthLabel.options] } as OptionFieldSpec, ...monthStyle] },
    foods(8),
    look,
  ],
  "season-poster": [
    { title: "구성", fields: [layout("season-poster")] },
    { title: "용지", fields: [orientation, margin, title, { type: "select", label: "계절 표기", path: ["seasonLabel"], options: options({ "english-korean": "Spring · 봄", korean: "봄" }) }] },
    { ...foods(30), fields: [...foods(30).fields, categories] },
    look,
  ],
  "month-poster": [
    { title: "구성", fields: [layout("month-poster")] },
    { title: "용지", fields: [orientation, margin, title, { ...grid, when: reads("grid") }] },
    { title: "달 표기", fields: [monthLabel, ...monthStyle] },
    { ...foods(12), fields: [...foods(12).fields, categories] },
    look,
  ],
}
