import { z } from "zod"

import { CALENDAR_VARIANTS } from "../calendar/variants"
import { FOODS, type FoodCategory } from "../data/foods"
import { MONTH_LABEL_STYLES, MONTHS, type Month } from "../data/months"

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

export function isPaper(value: string): value is Paper {
  return PAPER_SIZES.some((paper) => paper === value)
}

const CATEGORIES = new Set<string>(FOODS.map((food) => food.category))

const orientation = z.enum(["portrait", "landscape"])
const monthLabel = z.enum(MONTH_LABEL_STYLES)
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
  /** safe: 가정용 프린터가 못 찍는 가장자리를 비운다. none: 여백 없이 용지 끝까지 채운다. 이 값이 없던 예전 사양은 safe로 읽는다. */
  margin: z.enum(["safe", "none"]).default("safe"),
  foods: z.object({
    names: z.enum(["hidden", "korean"]),
    /** 칸 하나(달·계절)에 넣을 품종 수 상한 */
    max: z.number().int().min(1).max(30),
  }),
}

const calendar = <H extends z.ZodEnum>(holidays: H) =>
  z.object({
    weekStart: z.union([z.literal(0), z.literal(1)]),
    weekday: z.enum(["korean", "english-short", "english-initial"]),
    /** 미노출 / 빨간 날짜만 / 날짜와 이름 */
    holidays,
  })

const year = z.number().int().min(2020).max(2100)

const monthlySchema = z.object({
  ...base,
  kind: z.literal("monthly"),
  year,
  /** 첫 장에 연도 표지. 12개월 묶음에만 붙는다. */
  cover: z.boolean(),
  monthLabel,
  calendar: calendar(z.enum(["hidden", "mark", "mark-and-name"])).extend({ variant: z.enum(CALENDAR_VARIANTS) }),
  /** 흩뿌림 / 줄 맞춘 격자 / 그림 없음 */
  foodLayout: z.enum(["scatter", "grid", "none"]),
  /** 달력 아래 여백: 없음 / 메모 줄 / 먹은 음식 체크 칸(빈 칸 인쇄) */
  memo: z.enum(["none", "lines", "eaten-check"]),
})

const yearSheetSchema = z.object({
  ...base,
  kind: z.literal("year-sheet"),
  year,
  /** big-number: 그림 칸에 달 숫자를 크게 얹는다 */
  monthLabel: z.enum([...MONTH_LABEL_STYLES, "big-number"]),
  // 칸이 작아 공휴일 이름은 들어가지 않는다.
  calendar: calendar(z.enum(["hidden", "mark"])),
  /** 달 배열(열×행) */
  grid,
})

const seasonPosterSchema = z.object({
  ...base,
  kind: z.literal("season-poster"),
  title,
  seasonLabel: z.enum(["korean", "english-korean"]),
  /** 넣을 카테고리. 비우면 전부 */
  categories,
})

const monthPosterSchema = z.object({
  ...base,
  kind: z.literal("month-poster"),
  title,
  monthLabel,
  grid,
  categories,
})

const printSpecSchema = z
  .discriminatedUnion("kind", [monthlySchema, yearSheetSchema, seasonPosterSchema, monthPosterSchema])
  .refine((spec) => !("grid" in spec && spec.grid === "2x6" && spec.orientation === "landscape"), {
    message: "가로 용지에 2x6 배열은 칸이 너무 작다",
  })

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
    cover: true,
    monthLabel: "number",
    calendar: { variant: "plain", weekStart: 0, weekday: "korean", holidays: "mark-and-name" },
    foods: { names: "korean", max: 8 },
    foodLayout: "scatter",
    memo: "none",
  },
  "year-sheet": {
    ...common,
    surface: "white",
    kind: "year-sheet",
    year: 2027,
    monthLabel: "big-number",
    calendar: { weekStart: 0, weekday: "korean", holidays: "mark" },
    foods: { names: "hidden", max: 4 },
    grid: "2x6",
  },
  "season-poster": {
    ...common,
    surface: "white",
    kind: "season-poster",
    title: "계절별 제철 음식",
    seasonLabel: "english-korean",
    foods: { names: "korean", max: 24 },
    categories: [],
  },
  "month-poster": {
    ...common,
    surface: "white",
    kind: "month-poster",
    title: "달마다 제철",
    monthLabel: "korean",
    foods: { names: "korean", max: 8 },
    grid: "3x4",
    categories: [],
  },
}

/** 결과 파일 하나가 담는 쪽. 달 하나이거나 묶음 전체(all)다. */
export type PageKey = Month | "all"

/** 종류마다 만들 결과 파일. 생성기·미리보기 탭·다운로드 버튼이 모두 이 표를 읽는다. */
export const KIND_PAGES = {
  // 월간 달력은 12개월(표지 선택)을 담은 PDF 하나만 만든다. 달별 파일은 만들지 않는다.
  monthly: ["all"],
  "year-sheet": ["all"],
  "season-poster": ["all"],
  "month-poster": ["all"],
} as const satisfies Record<PrintKind, readonly PageKey[]>

export function isPageKey(kind: PrintKind, value: string): PageKey | undefined {
  return (KIND_PAGES[kind] as readonly PageKey[]).find((page) => String(page) === value)
}

/** 결과 파일 하나의 쪽 수. 생성기가 PDF를 검사할 때 쓴다. */
export function pageCount(spec: PrintSpec, page: PageKey): number {
  if (spec.kind !== "monthly" || page !== "all") return 1
  return MONTHS.length + (spec.cover ? 1 : 0)
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
