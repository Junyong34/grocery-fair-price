import { CALENDAR_VARIANT_LABELS, CALENDAR_VARIANTS } from "@workspace/seasonal/calendar/variants"
import { formatMonthLabel, MONTH_LABEL_STYLES } from "@workspace/seasonal/data/months"
import type { PrintKind } from "@workspace/seasonal/print/spec"

// 편집기 옵션 패널의 표. 종류마다 보일 칸과 그 칸이 고치는 사양 경로를 여기서만 정한다.

type Option = { value: string | number; label: string }

export type Field =
  | { type: "select"; label: string; path: readonly string[]; options: readonly Option[] }
  | { type: "toggle"; label: string; path: readonly string[] }
  | { type: "number"; label: string; path: readonly string[]; min: number; max: number }
  | { type: "text"; label: string; path: readonly string[] }
  | { type: "categories"; label: string; path: readonly string[] }

export type Section = { title: string; fields: readonly Field[] }

const options = (entries: Record<string, string>): Option[] => Object.entries(entries).map(([value, label]) => ({ value, label }))

const orientation: Field = { type: "select", label: "방향", path: ["orientation"], options: options({ portrait: "세로", landscape: "가로" }) }
const year: Field = { type: "number", label: "연도", path: ["year"], min: 2020, max: 2100 }
const title: Field = { type: "text", label: "제목", path: ["title"] }
const monthLabel: Field = {
  type: "select",
  label: "달 표기",
  path: ["monthLabel"],
  options: MONTH_LABEL_STYLES.map((style) => ({ value: style, label: formatMonthLabel(10, style, "long") })),
}
const grid: Field = { type: "select", label: "달 배열(열×행)", path: ["grid"], options: options({ "2x6": "2×6", "3x4": "3×4", "4x3": "4×3" }) }
const weekStart: Field = { type: "select", label: "주 시작", path: ["calendar", "weekStart"], options: [{ value: 0, label: "일요일" }, { value: 1, label: "월요일" }] }
const weekday: Field = {
  type: "select",
  label: "요일 표기",
  path: ["calendar", "weekday"],
  options: options({ korean: "일 월 화", "english-short": "Sun Mon", "english-initial": "S M T" }),
}
const categories: Field = { type: "categories", label: "카테고리(비우면 전부)", path: ["categories"] }

const foods = (max: number): Section => ({
  title: "품종",
  fields: [
    { type: "select", label: "이름", path: ["foods", "names"], options: options({ korean: "한글 이름", hidden: "숨김" }) },
    { type: "number", label: "칸마다 최대 개수", path: ["foods", "max"], min: 1, max },
  ],
})

const look: Section = {
  title: "서체·배경",
  fields: [
    { type: "select", label: "제목 서체", path: ["type", "heading"], options: options({ "gowun-batang": "고운바탕", pretendard: "프리텐다드" }) },
    { type: "select", label: "숫자 서체", path: ["type", "number"], options: options({ pretendard: "프리텐다드", "gowun-batang": "고운바탕" }) },
    { type: "select", label: "글자 크기", path: ["type", "scale"], options: [{ value: 0.9, label: "작게" }, { value: 1, label: "보통" }, { value: 1.1, label: "크게" }] },
    { type: "select", label: "배경", path: ["surface"], options: options({ cream: "크림", white: "흰색", season: "계절색" }) },
  ],
}

export const KIND_SECTIONS: Record<PrintKind, readonly Section[]> = {
  monthly: [
    { title: "용지", fields: [orientation, year, { type: "toggle", label: "12개월 묶음에 표지", path: ["cover"] }] },
    {
      title: "달력",
      fields: [
        { type: "select", label: "모양", path: ["calendar", "variant"], options: CALENDAR_VARIANTS.map((variant) => ({ value: variant, label: CALENDAR_VARIANT_LABELS[variant] })) },
        weekStart,
        weekday,
        { type: "select", label: "공휴일", path: ["calendar", "holidays"], options: options({ "mark-and-name": "날짜와 이름", mark: "빨간 날짜만", hidden: "표시 안 함" }) },
        monthLabel,
        { type: "select", label: "달력 아래", path: ["memo"], options: options({ none: "없음", lines: "메모 줄", "eaten-check": "먹은 음식 체크 칸" }) },
      ],
    },
    { ...foods(20), fields: [{ type: "select", label: "배치", path: ["foodLayout"], options: options({ scatter: "흩뿌림", grid: "줄 맞춤", none: "그림 없음" }) }, ...foods(20).fields] },
    look,
  ],
  "year-sheet": [
    { title: "용지", fields: [orientation, year, grid] },
    {
      title: "달력",
      fields: [
        weekStart,
        weekday,
        { type: "select", label: "공휴일", path: ["calendar", "holidays"], options: options({ mark: "빨간 날짜", hidden: "표시 안 함" }) },
        { ...monthLabel, options: [{ value: "big-number", label: "그림 위 큰 숫자" }, ...monthLabel.options] } as Field,
      ],
    },
    foods(8),
    look,
  ],
  "season-poster": [
    { title: "용지", fields: [orientation, title, { type: "select", label: "계절 표기", path: ["seasonLabel"], options: options({ "english-korean": "Spring · 봄", korean: "봄" }) }] },
    { ...foods(30), fields: [...foods(30).fields, categories] },
    look,
  ],
  "month-poster": [
    { title: "용지", fields: [orientation, title, grid, monthLabel] },
    { ...foods(12), fields: [...foods(12).fields, categories] },
    look,
  ],
}

/** 사양에서 경로의 값을 읽는다. */
export function getAt(value: unknown, path: readonly string[]): unknown {
  return path.reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], value)
}

/** 경로의 값을 바꾼 새 객체. */
export function setAt<T>(value: T, path: readonly string[], next: unknown): T {
  const [key, ...rest] = path
  if (key === undefined) return next as T
  const node = value as Record<string, unknown>
  return { ...node, [key]: setAt(node[key], rest, next) } as T
}
