import { CALENDAR_VARIANT_LABELS, CALENDAR_VARIANTS } from "@workspace/seasonal/calendar/variants"
import { FOODS } from "@workspace/seasonal/data/foods"
import { formatMonthLabel, MONTH_LABEL_STYLES } from "@workspace/seasonal/data/months"
import type { PrintKind, PrintSpec } from "@workspace/seasonal/print/spec"

export const FOOD_CATEGORIES = [...new Set(FOODS.map((food) => food.category))]

export type Option = { value: string | number; label: string }

export type OptionFieldSpec = (
  | { type: "select"; label: string; path: readonly string[]; options: readonly Option[] }
  | { type: "toggle"; label: string; path: readonly string[] }
  | { type: "number"; label: string; path: readonly string[]; min: number; max: number }
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

const options = (entries: Record<string, string>): Option[] => Object.entries(entries).map(([value, label]) => ({ value, label }))

const orientation: OptionFieldSpec = { type: "select", label: "방향", path: ["orientation"], options: options({ portrait: "세로", landscape: "가로" }) }
const margin: OptionFieldSpec = {
  type: "select",
  label: "여백",
  path: ["margin"],
  options: options({ safe: "기본 여백", none: "여백 없이 꽉 채우기" }),
  hint: "꽉 채우면 집 프린터에서 가장자리 3~5mm가 잘릴 수 있어요. 인쇄할 때 '여백 없음'을 고르세요.",
}
const year: OptionFieldSpec = { type: "number", label: "연도", path: ["year"], min: 2020, max: 2100 }
const title: OptionFieldSpec = { type: "text", label: "제목", path: ["title"] }
const monthLabel: OptionFieldSpec = {
  type: "select",
  label: "달 표기",
  path: ["monthLabel"],
  options: MONTH_LABEL_STYLES.map((style) => ({ value: style, label: formatMonthLabel(10, style, "long") })),
}
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

const foods = (max: number, when?: { names?: OptionFieldSpec["when"]; max?: OptionFieldSpec["when"] }): OptionSection => ({
  title: "품종",
  fields: [
    { type: "select", label: "이름", path: ["foods", "names"], options: options({ korean: "한글 이름", hidden: "숨김" }), when: when?.names },
    { type: "number", label: "칸마다 최대 개수", path: ["foods", "max"], min: 1, max, when: when?.max },
  ],
})

/** 구성(layout) 선택. 값마다 와이어프레임 안 하나다(wireframe-catalog.ts). */
const layout = (entries: Record<string, string>): OptionFieldSpec => ({ type: "select", label: "구성", path: ["layout"], options: options(entries) })

const monthlyHasFoods = (spec: PrintSpec) => spec.kind === "monthly" && spec.layout !== "none"
/** M-B는 체크 목록이 달력 옆에 있어 달력 아래 메모를 쓰지 않는다. */
const monthlyHasMemo = (spec: PrintSpec) => spec.kind === "monthly" && spec.layout !== "side-check"
/** Y-B는 달 배열이 3x4로, 위 그림은 달마다 하나로 정해져 있다. */
const yearSheetInPairs = (spec: PrintSpec) => spec.kind === "year-sheet" && spec.layout === "pairs"
/** P-D는 이름을 체크 목록에 늘 적고, 달을 한 줄씩 쌓는다. */
const monthPosterInCells = (spec: PrintSpec) => spec.kind === "month-poster" && spec.layout === "cells"

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
        layout({
          scatter: "그림 위, 달력 아래 · 흩뿌림",
          grid: "그림 위, 달력 아래 · 줄 맞춤",
          none: "달력만(그림 없음)",
          "side-check": "달력 옆 제철 체크 목록(세로 용지)",
        }),
        { type: "select", label: "12개월 묶음 표지", path: ["cover"], options: options({ year: "큰 연도 + 대표 품종", none: "표지 없음" }) },
      ],
    },
    { title: "용지", fields: [orientation, margin, year] },
    {
      title: "달력",
      fields: [
        { type: "select", label: "모양", path: ["calendar", "variant"], options: CALENDAR_VARIANTS.map((variant) => ({ value: variant, label: CALENDAR_VARIANT_LABELS[variant] })) },
        weekStart,
        weekday,
        { type: "select", label: "공휴일", path: ["calendar", "holidays"], options: options({ "mark-and-name": "날짜와 이름", mark: "빨간 날짜만", hidden: "표시 안 함" }) },
        calendarSize,
        monthLabel,
        { type: "select", label: "달력 아래", path: ["memo"], options: options({ none: "없음", lines: "메모 줄", "eaten-check": "먹은 음식 체크 칸" }), when: monthlyHasMemo },
      ],
    },
    foods(20, { names: monthlyHasFoods, max: monthlyHasFoods }),
    look,
  ],
  "year-sheet": [
    { title: "구성", fields: [layout({ pairs: "그림·달력 짝 체크무늬", "hero-top": "큰 그림 위, 열두 달 아래(세로 용지)" })] },
    { title: "용지", fields: [orientation, margin, year, { ...grid, when: yearSheetInPairs }] },
    {
      title: "달력",
      fields: [
        weekStart,
        weekday,
        { type: "select", label: "공휴일", path: ["calendar", "holidays"], options: options({ mark: "빨간 날짜", hidden: "표시 안 함" }) },
        calendarSize,
        { ...monthLabel, options: [{ value: "big-number", label: "그림 위 큰 숫자" }, ...monthLabel.options] } as OptionFieldSpec,
      ],
    },
    foods(8, { max: yearSheetInPairs }),
    look,
  ],
  "season-poster": [
    { title: "구성", fields: [layout({ bands: "가로 띠 넷", quarters: "사분면(가로 용지는 네 열)" })] },
    { title: "용지", fields: [orientation, margin, title, { type: "select", label: "계절 표기", path: ["seasonLabel"], options: options({ "english-korean": "Spring · 봄", korean: "봄" }) }] },
    { ...foods(30), fields: [...foods(30).fields, categories] },
    look,
  ],
  "month-poster": [
    { title: "구성", fields: [layout({ cells: "열두 칸", "rows-check": "한 줄에 한 달 · 장보기 체크(세로 용지)" })] },
    { title: "용지", fields: [orientation, margin, title, { ...grid, when: monthPosterInCells }, monthLabel] },
    { ...foods(12), fields: [...foods(12, { names: monthPosterInCells }).fields, categories] },
    look,
  ],
}
