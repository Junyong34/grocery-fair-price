import { z } from "zod"

import { CALENDAR_VARIANTS } from "../calendar/variants"
import { FOODS, type FoodCategory } from "../data/foods"
import { MONTHS, type Month } from "../data/months"
import { SEASONS } from "../data/seasons"
import { layoutDef, LAYOUTS } from "./layouts"
import { MONTH_LABEL_FONTS, MONTH_LABEL_FRAMES, MONTH_LABEL_PALETTES, MONTH_LABEL_SIZES, PRINT_MONTH_LABELS } from "./month-label"

// PDF 인쇄 사양(.scratch/calendar-print/spec.md "데이터 모양"). 같은 사양이면 언제나 같은 PDF가 나온다.
// 종류(kind)마다 쓰는 옵션이 달라 kind로 갈리는 유니언이다. 선택지는 모두 유한한 값이고, 바깥에서 온 값은 parsePrintSpec 하나로 들어온다.

export const PRINT_KINDS = ["monthly", "year-sheet", "season-poster", "month-poster"] as const
export type PrintKind = (typeof PRINT_KINDS)[number]

export const PRINT_KIND_LABELS: Record<PrintKind, string> = {
  monthly: "월간 달력",
  "year-sheet": "연간 달력 한 장",
  "season-poster": "계절 제철 포스터",
  "month-poster": "월별 제철 포스터",
}

export const PAPER_SIZES = ["A4", "A3"] as const
export type Paper = (typeof PAPER_SIZES)[number]

/** 용지 치수(mm, 세로 기준). 인쇄 CSS와 생성기가 모두 이 표를 읽는다. A3는 A4의 √2배다(ISO 216). */
export const PAPERS = {
  A4: { width: 210, height: 297, scale: 1 },
  A3: { width: 297, height: 420, scale: Math.SQRT2 },
} as const satisfies Record<Paper, { width: number; height: number; scale: number }>

/** 방향을 반영한 용지 크기(mm). 인쇄 시트, 어드민 미리보기, 생성기의 PDF 쪽 크기 검사가 모두 이것을 쓴다. */
export function sheetSize(paper: Paper, orientation: "portrait" | "landscape"): { width: number; height: number } {
  const { width, height } = PAPERS[paper]
  return orientation === "portrait" ? { width, height } : { width: height, height: width }
}

export function isPaper(value: string): value is Paper {
  return PAPER_SIZES.some((paper) => paper === value)
}

const CATEGORIES = new Set<string>(FOODS.map((food) => food.category))

const orientation = z.enum(["portrait", "landscape"])
/** 예전 사양의 "english"(좁은 자리 Jan, 제목 January)는 지금의 english-full과 같은 모양이다. */
const legacyEnglish = (value: unknown) => (value === "english" ? "english-full" : value)
const monthLabel = z.preprocess(legacyEnglish, z.enum(PRINT_MONTH_LABELS))
/** 달 표기의 색·크기·장식·서체(print/month-label.ts). 이 값이 없던 예전 사양은 지금까지의 모양(계절색·보통·장식 없음·서체 따름)으로 읽는다. 서체만 없으면 따름이다. */
const monthStyle = z
  .object({
    palette: z.enum(MONTH_LABEL_PALETTES),
    size: z.enum(MONTH_LABEL_SIZES),
    frame: z.enum(MONTH_LABEL_FRAMES),
    font: z.enum(MONTH_LABEL_FONTS).default("auto"),
  })
  .default({ palette: "season", size: "medium", frame: "none", font: "auto" })
const grid = z.enum(["4x3", "3x4", "2x6"])
const title = z.string().trim().min(1).max(40)
const categories = z.array(z.custom<FoodCategory>((value) => typeof value === "string" && CATEGORIES.has(value)))

const base = {
  version: z.literal(1),
  orientation,
  type: z.object({
    heading: z.enum(["gowun-batang", "pretendard"]),
    // 숫자 display 서체는 PDF 포함 라이선스를 확인하기 전까지 고를 수 없다.
    number: z.enum(["pretendard", "gowun-batang"]),
    scale: z.union([z.literal(0.9), z.literal(1), z.literal(1.1)]),
  }),
  /** 배경: 크림 / 흰색(잉크 절약) / 계절색 */
  surface: z.enum(["cream", "white", "season"]),
  /** safe: 바깥 여백 12mm. none: 좁은 여백 6mm로 그림·달력을 넓게 쓴다(글자가 가정용 프린터가 못 찍는 가장자리 3~5mm에 걸리지 않는 최소). 이 값이 없던 예전 사양은 safe로 읽는다. */
  margin: z.enum(["safe", "none"]).default("safe"),
  foods: z.object({
    names: z.enum(["hidden", "korean"]),
    /** 칸 하나(달·계절)에 넣을 품종 수 상한. 종류마다 폼의 상한이 따로 있다(월간 40은 흩뿌림·줄 맞춤 모두 그림끼리 겹치지 않는 데까지). */
    max: z.number().int().min(1).max(40),
  }),
}

export const CALENDAR_TEXT_SIZES = ["small", "medium", "large"] as const
export type CalendarTextSize = (typeof CALENDAR_TEXT_SIZES)[number]

/** 달력 글자 배율. 인쇄 달력이 날짜 크기에 곱한다. */
export const CALENDAR_TEXT_SCALE: Record<CalendarTextSize, number> = { small: 0.85, medium: 1, large: 1.2 }

const calendar = <H extends z.ZodEnum>(holidays: H) =>
  z.object({
    weekStart: z.union([z.literal(0), z.literal(1)]),
    weekday: z.enum(["korean", "english-short", "english-initial"]),
    /** 미노출 / 빨간 날짜만 / 날짜와 이름 */
    holidays,
    /** 달력 글자(날짜·요일·공휴일 이름)만의 크기. type.scale과 곱한다. 이 값이 없던 예전 사양은 medium으로 읽는다. */
    size: z.enum(CALENDAR_TEXT_SIZES).default("medium"),
  })

const year = z.number().int().min(2020).max(2100)

// 구성(layout) 값과 정의(이름, 와이어프레임 안, 세로 전용, 품종 상한, 읽지 않는 옵션)는 layouts.ts 한 곳에 있다.
export { LAYOUTS } from "./layouts"

/** 월간 12개월 묶음 표지 값 */
export const MONTHLY_COVERS = ["none", "year", "months", "chart"] as const

const monthlySchema = z.object({
  ...base,
  kind: z.literal("monthly"),
  year,
  /** 12개월 묶음 첫 장의 표지. none: 표지 없음, year: 큰 연도 + 대표 품종(C-1), months: 큰 연도 + 열두 달 미리보기(C-2), chart: 큰 연도 + 1년 제철 막대표(C-3) */
  cover: z.enum(MONTHLY_COVERS),
  monthLabel,
  monthStyle,
  calendar: calendar(z.enum(["hidden", "mark", "mark-and-name"])).extend({ variant: z.enum(CALENDAR_VARIANTS) }),
  /**
   * 위 그림 + 아래 달력(M-A). 그림을 흩뿌림 / 줄 맞춘 격자 / 그림 없음.
   * side-check: 달력 옆에 그 달 품종 체크 목록(M-B. 세로 용지만). strip: 쓰는 큰 칸 달력 + 그림 띠, 빈 날짜 칸에도 그림(M-D)
   * allover: 그림이 판 전체, 달력은 세로 용지에서 오른쪽 아래 모서리 블록, 가로 용지에서 오른쪽 날짜 한 열(M-E)
   */
  layout: z.enum(LAYOUTS.monthly),
  /** 달력 아래 여백: 없음 / 메모 줄 / 먹은 음식 체크 칸(빈 칸 인쇄) */
  memo: z.enum(["none", "lines", "eaten-check"]),
})

const yearSheetSchema = z.object({
  ...base,
  kind: z.literal("year-sheet"),
  year,
  /** big-number: 그림 칸에 달 숫자를 크게 얹는다 */
  monthLabel: z.preprocess(legacyEnglish, z.enum([...PRINT_MONTH_LABELS, "big-number"])),
  monthStyle,
  // 칸이 작아 공휴일 이름은 들어가지 않는다.
  calendar: calendar(z.enum(["hidden", "mark"])),
  /** 그림·달력 짝 체크무늬(Y-A) / 위에 1년치 그림 한 판, 아래 열두 달 3x4(Y-B. 세로 용지만) / 위에 작은 달력 열둘, 아래 제철 막대표(Y-C) */
  layout: z.enum(LAYOUTS["year-sheet"]).default("pairs"),
  /** 달 배열(열×행) */
  grid,
})

const seasonPosterSchema = z.object({
  ...base,
  kind: z.literal("season-poster"),
  title,
  /** 가로 띠 넷(S-A) / 사분면, 가로 용지는 네 열(S-B) / 사계절 원형 판(S-C) / 계절마다 한 장, PDF 4쪽(S-D) */
  layout: z.enum(LAYOUTS["season-poster"]).default("bands"),
  seasonLabel: z.enum(["korean", "english-korean"]),
  /** 넣을 카테고리. 비우면 전부 */
  categories,
})

const monthPosterSchema = z.object({
  ...base,
  kind: z.literal("month-poster"),
  title,
  /** 열두 칸(P-A) / 품종×달 막대표(P-B) / 열두 달 원형 판(P-C) / 한 줄에 한 달, 그림과 장보기 체크 목록(P-D. 세로 용지만) */
  layout: z.enum(LAYOUTS["month-poster"]).default("cells"),
  monthLabel,
  monthStyle,
  grid,
  categories,
})

/**
 * 1차 구현(2026-10-16) 때 저장된 월간 사양을 지금 모양으로 옮긴다. foodLayout → layout, cover 참·거짓 → "year"·"none".
 * 나머지 종류의 빠진 layout은 스키마의 default가 채운다. 저장된 JSON은 고치지 않고, 다음 저장 때 새 모양으로 써진다.
 */
function migrateLegacy(value: unknown): unknown {
  if (!value || typeof value !== "object" || (value as { kind?: unknown }).kind !== "monthly") return value
  const { foodLayout, ...spec } = value as Record<string, unknown>
  if (!("layout" in spec) && foodLayout !== undefined) spec.layout = foodLayout
  if (typeof spec.cover === "boolean") spec.cover = spec.cover ? "year" : "none"
  return spec
}

const printSpecSchema = z.preprocess(
  migrateLegacy,
  z.discriminatedUnion("kind", [monthlySchema, yearSheetSchema, seasonPosterSchema, monthPosterSchema]).refine((spec) => !("grid" in spec && spec.grid === "2x6" && spec.orientation === "landscape"), {
    message: "가로 용지에 2x6 배열은 칸이 너무 작다",
  })
  .refine((spec) => spec.orientation === "portrait" || !layoutDef(spec).portraitOnly, {
    message: "이 구성은 세로 용지만 된다",
  }),
)

export type PrintSpec = z.infer<typeof printSpecSchema>
export type MonthlySpec = z.infer<typeof monthlySchema>
export type YearSheetSpec = z.infer<typeof yearSheetSchema>
export type SeasonPosterSpec = z.infer<typeof seasonPosterSchema>
export type MonthPosterSpec = z.infer<typeof monthPosterSchema>
export type PrintGrid = z.infer<typeof grid>

/** 바깥(URL, 파일)에서 온 값을 사양으로 읽는다. 안쪽 코드는 다시 검증하지 않는다. */
export function parsePrintSpec(value: unknown): PrintSpec | Error {
  const result = printSpecSchema.safeParse(value)
  return result.success ? result.data : new Error(z.prettifyError(result.error))
}

const common = {
  version: 1,
  orientation: "portrait",
  type: { heading: "gowun-batang", number: "pretendard", scale: 1 },
  surface: "cream",
  margin: "safe",
} as const

/** 종류마다 새 에디션이 시작하는 값. */
export const DEFAULT_SPECS: { [K in PrintKind]: Extract<PrintSpec, { kind: K }> } = {
  monthly: {
    ...common,
    kind: "monthly",
    year: 2027,
    cover: "year",
    monthLabel: "number",
    monthStyle: { palette: "season", size: "medium", frame: "none", font: "auto" },
    calendar: { variant: "plain", weekStart: 0, weekday: "korean", holidays: "mark-and-name", size: "medium" },
    foods: { names: "korean", max: 8 },
    layout: "scatter",
    memo: "none",
  },
  "year-sheet": {
    ...common,
    surface: "white",
    kind: "year-sheet",
    year: 2027,
    monthLabel: "big-number",
    monthStyle: { palette: "season", size: "medium", frame: "none", font: "auto" },
    calendar: { weekStart: 0, weekday: "korean", holidays: "mark", size: "medium" },
    foods: { names: "hidden", max: 4 },
    layout: "pairs",
    grid: "2x6",
  },
  "season-poster": {
    ...common,
    surface: "white",
    kind: "season-poster",
    title: "계절별 제철 음식",
    layout: "bands",
    seasonLabel: "english-korean",
    foods: { names: "korean", max: 24 },
    categories: [],
  },
  "month-poster": {
    ...common,
    surface: "white",
    kind: "month-poster",
    title: "달마다 제철",
    layout: "cells",
    monthLabel: "korean",
    monthStyle: { palette: "season", size: "medium", frame: "none", font: "auto" },
    foods: { names: "korean", max: 8 },
    grid: "3x4",
    categories: [],
  },
}

/**
 * 결과 PDF의 쪽 수. 결과 파일은 사양·용지마다 하나다. 월간 달력은 열두 달(표지를 켜면 표지 포함), 계절마다 한 장(S-D)은 네 계절을 한 파일에 담는다.
 * 생성기가 PDF를 검사할 때 쓴다.
 */
export function pageCount(spec: PrintSpec): number {
  if (spec.kind === "monthly") return MONTHS.length + (spec.cover === "none" ? 0 : 1)
  if (spec.kind === "season-poster" && spec.layout === "per-season") return SEASONS.length
  return 1
}

/** URL 쿼리에 넣는 모양(UTF-8 JSON의 base64url). */
export function encodeSpec(spec: PrintSpec): string {
  const bytes = new TextEncoder().encode(JSON.stringify(spec))
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "")
}

export function decodeSpec(encoded: string): PrintSpec | Error {
  try {
    const binary = atob(encoded.replaceAll("-", "+").replaceAll("_", "/"))
    const json = new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)))
    return parsePrintSpec(JSON.parse(json))
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error))
  }
}

/** 키 순서와 상관없는 사양 해시(FNV-1a 32비트). 결과 파일이 지금 사양으로 만든 것인지 가린다. */
export function specHash(spec: PrintSpec): string {
  let hash = 0x811c9dc5
  for (const char of stableJson(spec)) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, "0")
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`
  if (value && typeof value === "object")
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`)
      .join(",")}}`
  return JSON.stringify(value)
}
