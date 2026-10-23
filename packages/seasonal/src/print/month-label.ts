import type { Season } from "../data/seasons"

// 인쇄물의 달 표기(.scratch/calendar-print/spec.md). 표기(글자) × 색(palette) × 크기(size) × 장식(frame)으로 나눈다.
// 화면(2a ⚙ 설정)은 data/months.ts의 MONTH_LABEL_STYLES 세 가지만 쓴다.

/** 표기. 숫자 "1", 두 자리 "01", 한글 "1월", 영어 축약 "Jan"·"JAN", 영어 풀네임 "January"·"JANUARY", 숫자 + 영문 "1 JANUARY", 한글 + 영문 "1월 JAN" */
export const PRINT_MONTH_LABELS = [
  "number",
  "two-digit",
  "korean",
  "english-short",
  "english-short-caps",
  "english-full",
  "english-full-caps",
  "number-english",
  "korean-english",
] as const
export type PrintMonthLabel = (typeof PRINT_MONTH_LABELS)[number]

/**
 * 달 표기 색. season: 계절색, flow: 계절색 사이를 섞어 달마다 조금씩, twelve: 달마다 차분한 열두 색, vivid: 달마다 채도 높은 열두 색.
 * 바탕까지 계절색으로 칠하는 것은 사양의 surface("season")가 맡는다.
 */
export const MONTH_LABEL_PALETTES = ["season", "flow", "twelve", "vivid"] as const
export type MonthLabelPalette = (typeof MONTH_LABEL_PALETTES)[number]

export const MONTH_LABEL_SIZES = ["small", "medium", "large"] as const
export type MonthLabelSize = (typeof MONTH_LABEL_SIZES)[number]

/** 달 표기 글자 배율. 놓일 자리 높이를 넘으면 부르는 쪽이 줄인다. */
export const MONTH_LABEL_SCALE: Record<MonthLabelSize, number> = { small: 0.7, medium: 1, large: 1.4 }

/** 장식. none: 글자만, rule: 굵은 밑줄, pill: 둥근 테두리 태그, ribbon: 아래가 V로 파인 책갈피 띠, outline: 속 빈 큰 숫자 + 아래 영문 */
export const MONTH_LABEL_FRAMES = ["none", "rule", "pill", "ribbon", "outline"] as const
export type MonthLabelFrame = (typeof MONTH_LABEL_FRAMES)[number]

/**
 * 달 표기 서체. auto: 서체·배경의 서체를 따른다(숫자는 숫자 서체, 한글·영어 이름은 제목 서체, 대문자는 프리텐다드).
 * 서체를 고르면 큰 글자와 곁들이는 영문이 모두 그 서체다. 숫자 display 서체는 PDF 포함 라이선스를 확인하기 전까지 고를 수 없다.
 */
export const MONTH_LABEL_FONTS = ["auto", "gowun-batang", "pretendard"] as const
export type MonthLabelFont = (typeof MONTH_LABEL_FONTS)[number]

/** 글자 모양. number: 숫자 서체, text: 제목 서체, caps: 자간을 넓힌 대문자 */
export type MonthLabelKind = "number" | "text" | "caps"
export type MonthLabelText = { main: string; kind: MonthLabelKind; sub?: { text: string; kind: MonthLabelKind } }

const ENGLISH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as const

/**
 * 달 하나의 표기 글자. 큰 글자(main)와 곁들이는 작은 글자(sub)로 나눈다.
 * short는 막대표 머리·원형 판처럼 좁은 자리라 풀네임을 세 글자로 줄이고 곁들이는 영문을 뺀다.
 * 장식이 글자를 바꾸기도 한다. ribbon은 좁아 네 글자 넘는 이름을 숫자로 바꾸고, outline은 숫자만 크게 쓴다.
 */
export function printMonthLabel(
  month: number,
  style: PrintMonthLabel,
  { length = "long", frame = "none" }: { length?: "long" | "short"; frame?: MonthLabelFrame } = {},
): MonthLabelText {
  const full = ENGLISH[month - 1]!
  const short = full.slice(0, 3)
  const label = baseLabel(month, style, length === "long" ? full : short, short, length)
  if (frame === "ribbon" && label.main.length > 3) return { main: String(month), kind: "number", sub: { text: label.main.toUpperCase(), kind: "caps" } }
  if (frame === "outline" && label.kind !== "number") return { main: String(month), kind: "number", sub: label.sub ?? { text: full, kind: "text" } }
  if (frame === "outline" && !label.sub) return { ...label, sub: { text: full, kind: "text" } }
  return label
}

function baseLabel(month: number, style: PrintMonthLabel, name: string, short: string, length: "long" | "short"): MonthLabelText {
  const withSub = (label: MonthLabelText, sub: string): MonthLabelText => (length === "long" ? { ...label, sub: { text: sub, kind: "caps" } } : label)
  switch (style) {
    case "number":
      return { main: String(month), kind: "number" }
    case "two-digit":
      return { main: String(month).padStart(2, "0"), kind: "number" }
    case "korean":
      return { main: `${month}월`, kind: "text" }
    case "english-short":
      return { main: short, kind: "text" }
    case "english-short-caps":
      return { main: short.toUpperCase(), kind: "caps" }
    case "english-full":
      return { main: name, kind: "text" }
    case "english-full-caps":
      return { main: name.toUpperCase(), kind: "caps" }
    case "number-english":
      return withSub({ main: String(month), kind: "number" }, name.toUpperCase())
    case "korean-english":
      return withSub({ main: `${month}월`, kind: "text" }, short.toUpperCase())
  }
}

/** 열두 달 흐름(flow)의 기준: 계절 가운데 달. 이 달은 그 계절색 하나, 사이 달은 앞뒤 계절색을 섞는다. */
const FLOW_CENTERS: readonly (readonly [number, Season])[] = [
  [1, "winter"],
  [4, "spring"],
  [7, "summer"],
  [10, "autumn"],
  [13, "winter"],
]

/** flow 색의 섞는 비율. from 계절색이 weight%, 나머지가 to 계절색이다. 예: 2월 → 겨울 67% + 봄 33% */
export function monthFlow(month: number): { from: Season; to: Season; weight: number } {
  const i = FLOW_CENTERS.findIndex(([center]) => center > month) - 1
  const [start, from] = FLOW_CENTERS[i]!
  const [end, to] = FLOW_CENTERS[i + 1]!
  return { from, to, weight: Math.round(100 - ((month - start) / (end - start)) * 100) }
}

export type MonthStyle = { palette: MonthLabelPalette; size: MonthLabelSize; frame: MonthLabelFrame; font: MonthLabelFont }
