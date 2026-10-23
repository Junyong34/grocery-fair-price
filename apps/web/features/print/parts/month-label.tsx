import { seasonOfMonth } from "@workspace/seasonal/data/seasons"
import {
  MONTH_LABEL_SCALE,
  monthFlow,
  printMonthLabel,
  type MonthLabelFrame,
  type MonthLabelKind,
  type MonthLabelPalette,
  type MonthStyle,
  type PrintMonthLabel,
} from "@workspace/seasonal/print/month-label"

import { t, u } from "./units"

/** 달 표기 색. 토큰은 packages/ui의 globals.css(--color-season-*, --color-month-tone-*, --color-month-vivid-*)에 있다. */
export function monthColor(palette: MonthLabelPalette, month: number): string {
  if (palette === "flow") {
    const { from, to, weight } = monthFlow(month)
    return `color-mix(in oklab, var(--color-season-${from}) ${weight}%, var(--color-season-${to}))`
  }
  if (palette === "twelve") return `var(--color-month-tone-${month})`
  if (palette === "vivid") return `var(--color-month-vivid-${month})`
  return `var(--color-season-${seasonOfMonth(month)})`
}

/** 장식마다 큰 글자 줄의 높이(글자 크기 배). print.css의 .print-month-label 안쪽 여백·선과 맞춘다. */
const FRAME_HEIGHT: Record<MonthLabelFrame, number> = { none: 1, rule: 1.16, pill: 0.92, ribbon: 1.18, outline: 1 }
/** 곁들이는 작은 글자 줄(간격 + 글자)의 높이(글자 크기 배) */
const SUB_HEIGHT = 0.36
/** 글자 하나의 대략 폭(글자 크기 배). 자리 폭에 맞춰 줄일 때만 쓰는 어림값이다. */
const GLYPH: Record<MonthLabelKind, number> = { number: 0.66, text: 0.56, caps: 0.74 }
const HANGUL = 1

function estimateWidth(text: string, kind: MonthLabelKind): number {
  return [...text].reduce((sum, char) => sum + (/[가-힣]/.test(char) ? HANGUL : GLYPH[kind]), 0)
}

/** 곁들이는 글자 크기(큰 글자 크기 배). 아래 줄(stack)과 옆(inline)이 다르다. print.css의 .sub와 맞춘다. */
const SUB_SIZE = { stack: { caps: 0.22, text: 0.26 }, inline: { caps: 0.42, text: 0.5 } } as const
/** 곁들이는 글자가 이보다 작아지면(용지 단위, A4 약 5pt) 아래 줄 대신 큰 글자 옆에 붙인다. */
const SUB_MIN = 1.8
/** 옆에 붙일 때 큰 글자와의 간격(큰 글자 크기 배) */
const INLINE_GAP = 0.3

function subWidth(sub: { text: string; kind: MonthLabelKind }, layout: "stack" | "inline"): number {
  const kind = sub.kind === "caps" ? "caps" : "text"
  const size = SUB_SIZE[layout][kind]
  // 대문자는 자간(0.22em)이 붙는다.
  return kind === "caps" ? [...sub.text].length * (GLYPH.caps + 0.22) * size : estimateWidth(sub.text, sub.kind) * size
}

/**
 * 인쇄물의 달 표기 하나. 표기(text) 글자를 색·크기·장식(style)으로 그린다.
 * fontSize는 보통 크기의 큰 글자(용지 단위)이고, 숫자가 아닌 표기는 textFontSize를 쓴다(제목 서체 글자가 숫자보다 커 보여서).
 * 크기 배율을 곱한 뒤 maxHeight·maxWidth(용지 단위)를 넘으면 그 안에 들도록 줄인다. 폭은 글자 수로 어림한다.
 * 곁들이는 글자(sub)는 큰 글자 아래 줄에 두고, 그러면 너무 작아지는 자리에서는 옆에 붙인다.
 */
export function MonthLabel({
  month,
  text,
  style,
  fontSize,
  textFontSize = fontSize,
  maxHeight,
  maxWidth,
  length = "long",
  align = "start",
}: {
  month: number
  text: PrintMonthLabel
  style: MonthStyle
  fontSize: number
  textFontSize?: number
  maxHeight?: number
  maxWidth?: number
  length?: "long" | "short"
  align?: "start" | "center" | "end"
}) {
  const label = printMonthLabel(month, text, { length, frame: style.frame })
  const wanted = (label.kind === "number" ? fontSize : textFontSize) * MONTH_LABEL_SCALE[style.size]
  const frameScale = style.frame === "pill" || style.frame === "ribbon" ? 0.6 : 1
  const mainWidth = estimateWidth(label.main, label.kind) * frameScale + (style.frame === "pill" ? 0.5 : 0)
  const fit = (height: number, width: number) => ({ height, width, size: Math.min(wanted, (maxHeight ?? Infinity) / height, (maxWidth ?? Infinity) / width) })
  const stack = fit(FRAME_HEIGHT[style.frame] + (label.sub ? SUB_HEIGHT : 0), Math.max(mainWidth, label.sub ? subWidth(label.sub, "stack") : 0))
  // 작은 자리(포스터 칸·연간 달력 머리)에서는 아래 줄 글자가 읽히지 않을 만큼 작아져 큰 글자 옆에 붙인다.
  const inline = !!label.sub && stack.size * SUB_SIZE.stack[label.sub.kind === "caps" ? "caps" : "text"] < SUB_MIN
  const box = inline && label.sub ? fit(FRAME_HEIGHT[style.frame], mainWidth + INLINE_GAP + subWidth(label.sub, "inline")) : stack
  // 상한은 글자 배율(type.scale)을 곱하지 않은 용지 길이라, 글자를 키워도 자리를 넘지 않는다.
  const limits = [maxHeight && u(maxHeight / box.height), maxWidth && u(maxWidth / box.width)].filter(Boolean)
  const size = limits.length ? `min(${[t(wanted), ...limits].join(", ")})` : t(wanted)
  return (
    <span
      className="print-month-label"
      data-frame={style.frame}
      data-align={align}
      data-sub={inline ? "inline" : undefined}
      style={{ fontSize: size, "--month-color": monthColor(style.palette, month) } as React.CSSProperties}
    >
      <span className="main" data-kind={label.kind}>
        {label.main}
      </span>
      {label.sub && (
        <span className="sub" data-kind={label.sub.kind}>
          {label.sub.text}
        </span>
      )}
    </span>
  )
}
