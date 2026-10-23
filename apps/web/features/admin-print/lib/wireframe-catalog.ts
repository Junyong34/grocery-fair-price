import { holidaysInMonth } from "@workspace/seasonal/calendar/holidays"
import { MONTHS } from "@workspace/seasonal/data/months"
import type { PrintKind } from "@workspace/seasonal/print/spec"

import {
  calendar,
  contentBox,
  dayColumn,
  flow,
  inset,
  monthGrid,
  nameList,
  periodChart,
  scatter,
  split,
  wheel,
  type Orientation,
  type Rect,
  type Shape,
} from "./wireframe-shapes"

// 인쇄물 와이어프레임 안 목록. 시장 조사와 안의 근거: .scratch/calendar-print/research/market.md
// 어드민 옵션 고르기의 미리보기로 쓴다. 지금 사양으로 되는 안(available)과 새 옵션이 있어야 하는 안(needs-option)이 섞여 있다.
// 폐기한 안(코드는 다시 쓰지 않는다): M-C 이달의 대표 품종, Y-D 달마다 이름 목록.

export type WireframeEntry = {
  /** 조사 문서·와이어프레임 페이지와 같은 코드(M-A, Y-B, …) */
  code: string
  kind: PrintKind
  /** cover는 월간 달력의 표지 쪽 */
  page: "sheet" | "cover"
  title: string
  summary: string
  /** market.md의 구조 유형과 사례 번호 */
  source: string
  availability: { status: "available" | "needs-option"; options: string }
  orientations: readonly Orientation[]
  draw: (orientation: Orientation) => readonly Shape[]
}

const YEAR = 2027
const MONTH = 10
const HOLIDAYS = Object.keys(holidaysInMonth(YEAR, MONTH)).map(Number)
const SEASON_NAMES = ["봄", "여름", "가을", "겨울"]

// ── 머리 ──

function monthHeader(rect: Rect, size: number): Shape[] {
  return [
    { type: "label", tone: "strong", x: rect.x, y: rect.y, size, text: String(MONTH) },
    { type: "bar", tone: "text", box: { x: rect.x + rect.width * 0.88, y: rect.y + 1, width: rect.width * 0.12, height: 1 } },
  ]
}

function yearHeader(rect: Rect, size: number): Shape[] {
  return [
    { type: "label", tone: "strong", x: rect.x, y: rect.y, size, text: String(YEAR) },
    { type: "bar", tone: "strong", box: { x: rect.x + rect.width * 0.76, y: rect.y + size * 0.3, width: rect.width * 0.24, height: Math.min(3, size * 0.25) } },
  ]
}

function posterTitle(rect: Rect): Shape[] {
  const height = Math.min(3.2, rect.height * 0.35)
  return [{ type: "bar", tone: "strong", box: { x: rect.x + rect.width * 0.3, y: rect.y + (rect.height - height) / 2, width: rect.width * 0.4, height } }]
}

function smallLabel(rect: Rect, text: string, size = 3.6): Shape {
  return { type: "label", tone: "small", x: rect.x, y: rect.y + (rect.height - size) / 2, size, text }
}

/** 그림 칸 가운데에 달 숫자를 옅게 크게 얹는다(연간 한 장의 big-number) */
function pictureWithNumber(box: Rect, month: number): Shape[] {
  const size = Math.min(box.height * 0.55, box.width * 0.6)
  return [
    { type: "picture", box },
    { type: "label", tone: "soft", anchor: "middle", x: box.x + box.width / 2, y: box.y + (box.height - size) / 2, size, text: String(month) },
  ]
}

const miniCalendar = (rect: Rect, month: number) => calendar(rect, { year: YEAR, month, style: "mini" })

function labelledMiniCalendar(cell: Rect, month: number): Shape[] {
  const [label, body] = split(cell, "rows", [4, "*"], 1)
  return [smallLabel(label!, String(month), 3), ...miniCalendar(body!, month)]
}

const frame = (box: Rect): Shape => ({ type: "frame", box })

// ── 월간 달력 ──

const monthly: WireframeEntry[] = [
  {
    code: "M-A",
    kind: "monthly",
    page: "sheet",
    title: "그림 위, 달력 아래",
    summary: "지금 모양. 그림과 달력이 반씩 나뉘어 벽에 걸면 그림이 먼저 보인다.",
    source: "① 그림 위 · 달력 아래 · K3, K7, K12, G3, G4",
    availability: { status: "available", options: 'layout: "scatter" | "grid"' },
    orientations: ["portrait", "landscape"],
    draw: (orientation) => {
      const c = contentBox(orientation)
      if (orientation === "portrait") {
        const [header, food, rest] = split(c, "rows", [26, 112, "*"], 8)
        return [...monthHeader(header!, 20), ...scatter(food!, { count: 8, seed: 3, names: true }), ...calendar(rest!, { year: YEAR, month: MONTH, holidays: HOLIDAYS })]
      }
      const [header, body] = split(c, "rows", [22, "*"], 6)
      const [food, rest] = split(body!, "cols", [128, "*"], 8)
      return [...monthHeader(header!, 16), ...scatter(food!, { count: 8, seed: 4, names: true }), ...calendar(rest!, { year: YEAR, month: MONTH, holidays: HOLIDAYS })]
    },
  },
  {
    code: "M-B",
    kind: "monthly",
    page: "sheet",
    title: "달력 옆 제철 체크 목록",
    summary: "그 달 품종 이름을 달력 오른쪽 세로 목록으로 옮겨 그림 수보다 많은 품종을 싣는다. 먹은 것에 체크한다.",
    source: "④ 정보형 · K10(이 달의 요리 목록), K11(품목 카드, 먹은 것 스티커), R1",
    availability: { status: "available", options: 'layout: "side-check"(세로 용지만)' },
    orientations: ["portrait"],
    draw: () => {
      const [header, food, body] = split(contentBox("portrait"), "rows", [26, 80, "*"], 8)
      const [rest, side] = split(body!, "cols", ["*", 56], 6)
      const [title, list] = split(side!, "rows", [5, "*"], 2)
      return [
        ...monthHeader(header!, 20),
        ...scatter(food!, { count: 6, seed: 8, names: true }),
        ...calendar(rest!, { year: YEAR, month: MONTH, holidays: HOLIDAYS }),
        { type: "line", from: [side!.x - 3, side!.y], to: [side!.x - 3, side!.y + side!.height] },
        { type: "bar", tone: "strong", box: { x: title!.x, y: title!.y + 1.5, width: title!.width * 0.7, height: 1.2 } },
        ...nameList(list!, { count: 12, check: true }),
      ]
    },
  },
  {
    code: "M-D",
    kind: "monthly",
    page: "sheet",
    title: "쓰는 달력: 큰 칸 + 그림 띠 두 줄",
    summary:
      "달력 칸을 키워 일정을 적는다(격자 고정). 그림 띠를 14개(세로는 위 두 줄, 가로는 왼쪽 두 열)로 늘리고 1일 앞·말일 뒤 빈 칸에도 그림을 넣어 품종 수를 지킨다. 그 달 대표 품종부터 띠 14개와 빈 칸(2027년 달마다 0~11개)에 넣는다. 한 달 제철이 31~86개라 다 들어가지는 않는다.",
    source: "④ 정보형 · K10(그림 30 : 달력 70), G3·G5(쓰기 칸). 빈 칸 그림은 판매 사례 없는 제안",
    availability: { status: "available", options: 'layout: "strip"' },
    orientations: ["portrait", "landscape"],
    draw: (orientation) => {
      const c = contentBox(orientation)
      const grid = (rect: Rect) => calendar(rect, { year: YEAR, month: MONTH, holidays: HOLIDAYS, style: "grid", write: true, fillBlanks: true })
      if (orientation === "portrait") {
        const [header, strip, rest] = split(c, "rows", [22, 44, "*"], 5)
        return [...monthHeader(header!, 16), ...flow(strip!, { count: 14, names: true }), ...grid(rest!)]
      }
      const [header, body] = split(c, "rows", [20, "*"], 5)
      const [strip, rest] = split(body!, "cols", [48, "*"], 6)
      return [...monthHeader(header!, 14), ...flow(strip!, { count: 14, names: true }), ...grid(rest!)]
    },
  },
  {
    code: "M-E",
    kind: "monthly",
    page: "sheet",
    title: "그림이 판 전체, 달력은 작은 블록",
    summary: "품종 그림을 시트 전체에 깔고 달력을 모서리 블록(세로)이나 가장자리 날짜 한 열(가로)로 줄인다. 감상용이고 그림이 가장 많다. 날짜가 작아지는 것이 약점이다(K12 리뷰).",
    source: "② 그림이 판 전체 · K1(모서리 블록), K4(가장자리 날짜 열), K8",
    availability: { status: "available", options: 'layout: "allover"' },
    orientations: ["portrait", "landscape"],
    draw: (orientation) => {
      const c = contentBox(orientation)
      if (orientation === "portrait") {
        const [header, body] = split(c, "rows", [26, "*"], 6)
        const block = { x: body!.x + body!.width * 0.46, y: body!.y + body!.height * 0.64, width: body!.width * 0.54, height: body!.height * 0.36 }
        return [
          ...monthHeader(header!, 20),
          ...scatter(body!, { count: 20, seed: 51, names: true, avoid: block }),
          { type: "frame", box: block, fill: true },
          ...miniCalendar(inset(block, 3), MONTH),
        ]
      }
      const [left, right] = split(c, "cols", ["*", 30], 6)
      const [header, art] = split(left!, "rows", [22, "*"], 4)
      return [
        ...monthHeader(header!, 16),
        ...scatter(art!, { count: 18, seed: 52, names: true }),
        { type: "line", from: [right!.x - 3, right!.y], to: [right!.x - 3, right!.y + right!.height] },
        ...dayColumn(right!, { year: YEAR, month: MONTH }),
      ]
    },
  },
  {
    code: "C-1",
    kind: "monthly",
    page: "cover",
    title: "표지: 큰 연도 + 대표 품종",
    summary: "지금 표지. 연도 숫자가 주인공이다.",
    source: "① 표지 · K7, R1, G5",
    availability: { status: "available", options: 'cover: "year"' },
    orientations: ["portrait"],
    draw: () => {
      const c = contentBox("portrait")
      const [, bar, , year, , foods] = split(c, "rows", ["*", 3, 10, 46, 12, 28, "*"], 0)
      return [
        { type: "bar", tone: "strong", box: { x: c.x + (c.width - 50) / 2, y: bar!.y, width: 50, height: 3 } },
        { type: "label", tone: "strong", anchor: "middle", x: c.x + c.width / 2, y: year!.y, size: 46, text: String(YEAR) },
        ...flow(foods!, { count: 5, max: 24 }),
      ]
    },
  },
  {
    code: "C-2",
    kind: "monthly",
    page: "cover",
    title: "표지: 열두 달 미리보기",
    summary: "달마다 대표 그림 하나를 3×4로 모아 표지에서 1년을 보여 준다.",
    source: "⑤ 연간 한 장 격자를 표지로 · K5, K13",
    availability: { status: "available", options: 'cover: "months"' },
    orientations: ["portrait"],
    draw: () => {
      const [header, body] = split(contentBox("portrait"), "rows", [26, "*"], 6)
      return [
        ...yearHeader(header!, 20),
        ...monthGrid(body!, 3, 4, 4).flatMap((cell, i): Shape[] => {
          const [picture, label] = split(cell, "rows", ["*", 5], 1)
          return [{ type: "picture", box: picture! }, { type: "label", tone: "small", anchor: "middle", x: label!.x + label!.width / 2, y: label!.y + 0.9, size: 3.2, text: String(MONTHS[i]) }]
        }),
      ]
    },
  },
  {
    code: "C-3",
    kind: "monthly",
    page: "cover",
    title: "표지: 1년 제철 표",
    summary: "첫 장을 품종×달 막대표로 만든다. 달을 넘기기 전에 1년 흐름을 한눈에 본다. 달마다 대표 여섯(많아야 72개)을 세로 2단, 가로 3단에 나눠 이름이 A4 약 9pt다.",
    source: "⑨ 기간 표시 · G10, G7. 표지 자리에 계절표·범례 쪽을 넣는 K10, G5. 막대표 자체는 판매 사례로 확인 못 함",
    availability: { status: "available", options: 'cover: "chart"' },
    orientations: ["portrait"],
    draw: () => {
      // 달마다 대표 품종을 세로 2단에 나눈다(monthly.tsx의 CHART_COVER).
      const [header, body] = split(contentBox("portrait"), "rows", [26, "*"], 6)
      const [left, right] = split(body!, "cols", ["*", "*"], 8)
      return [...yearHeader(header!, 20), ...periodChart(left!, { rows: 30, groups: ["채소", "과일"], seed: 11, label: 0.3 }), ...periodChart(right!, { rows: 30, groups: ["수산", "곡물·견과"], seed: 12, label: 0.3 })]
    },
  },
]

// ── 연간 달력 한 장 ──

const yearSheet: WireframeEntry[] = [
  {
    code: "Y-A",
    kind: "year-sheet",
    page: "sheet",
    title: "그림·달력 짝 체크무늬",
    summary: "지금 모양. 달마다 그림과 달력이 같은 크기라 열두 달이 고르게 보인다.",
    source: "⑤ 연간 한 장 격자 · K5(A3 3×4), K13, K6",
    availability: { status: "available", options: 'layout: "pairs", grid: "2x6" | "3x4" | "4x3"' },
    orientations: ["portrait", "landscape"],
    draw: (orientation) => {
      const c = contentBox(orientation)
      if (orientation === "portrait") {
        const [header, body] = split(c, "rows", [18, "*"], 4)
        return [
          ...yearHeader(header!, 12),
          ...monthGrid(body!, 2, 6, 3).flatMap((cell, i) => {
            const flip = Math.floor(i / 2) % 2 === 1
            const [a, b] = split(cell, "cols", ["*", "*"], 1.5)
            return [...pictureWithNumber(flip ? b! : a!, MONTHS[i]!), ...miniCalendar(inset(flip ? a! : b!, 1), MONTHS[i]!)]
          }),
        ]
      }
      const [header, body] = split(c, "rows", [14, "*"], 4)
      return [
        ...yearHeader(header!, 10),
        ...monthGrid(body!, 4, 3, 4).flatMap((cell, i): Shape[] => {
          const [picture, name, rest] = split(cell, "rows", [cell.height * 0.42, 2, "*"], 1.2)
          return [...pictureWithNumber(picture!, MONTHS[i]!), { type: "bar", tone: "strong", box: { ...name!, width: name!.width * 0.3 } }, ...miniCalendar(rest!, MONTHS[i]!)]
        }),
      ]
    },
  },
  {
    code: "Y-B",
    kind: "year-sheet",
    page: "sheet",
    title: "큰 그림 위, 열두 달 아래",
    summary: "위 1/3에 1년치 품종(달마다 하나, 열둘)을 한 판으로 모으고, 아래에 작은 달력 열둘(3×4). 달별 그림 칸이 없어 달력 글자가 커진다.",
    source: "⑤ 콜라주형 + ② · K14, K3 연력",
    availability: { status: "available", options: 'layout: "hero-top"(세로 용지만)' },
    orientations: ["portrait"],
    draw: () => {
      const [header, art, body] = split(contentBox("portrait"), "rows", [26, 84, "*"], 6)
      return [...yearHeader(header!, 20), ...scatter(art!, { count: 12, seed: 21 }), ...monthGrid(body!, 3, 4, 4).flatMap((cell, i) => labelledMiniCalendar(cell, MONTHS[i]!))]
    },
  },
  {
    code: "Y-C",
    kind: "year-sheet",
    page: "sheet",
    title: "열두 달 달력 + 제철 막대표",
    summary: "날짜는 작은 달력 열둘이, 제철은 품종×달 막대표가 맡는다. 막대표는 달마다 대표 넷(48개)이고, 날짜와 이름이 A4 약 7pt를 넘게 달력 칸 폭을 44mm로 잡았다.",
    source: "⑤ + ⑨ · 이 조합의 판매 사례는 없음. 막대표는 G10·G7을 편 것",
    availability: { status: "available", options: 'layout: "chart"' },
    orientations: ["portrait", "landscape"],
    draw: (orientation) => {
      // 달력 세로 4×3·가로 6×2, 막대표 세로 2단·가로 3단(year-sheet.tsx의 CHART).
      const c = contentBox(orientation)
      const [header, months, chart] = split(c, "rows", [18, orientation === "portrait" ? 114 : 73, "*"], 5)
      const [columns, rows, chartColumns] = orientation === "portrait" ? [4, 3, 2] : [6, 2, 3]
      const groups = orientation === "portrait" ? [["채소", "과일"], ["과일", "수산", "곡물·견과"]] : [["채소"], ["과일"], ["수산", "곡물·견과"]]
      return [
        ...yearHeader(header!, 12),
        ...monthGrid(months!, columns, rows, 3).flatMap((cell, i) => labelledMiniCalendar(cell, MONTHS[i]!)),
        ...split(chart!, "cols", Array<"*">(chartColumns).fill("*"), 8).flatMap((column, i) => periodChart(column, { rows: orientation === "portrait" ? 25 : 16, groups: groups[i], seed: 31 + i, label: 0.3 })),
      ]
    },
  },
]

// ── 계절 포스터 ──

const seasonPoster: WireframeEntry[] = [
  {
    code: "S-A",
    kind: "season-poster",
    page: "sheet",
    title: "가로 띠 넷",
    summary: "지금 모양. 위에서 아래로 계절이 흐른다.",
    source: "⑦ 계절 구획(4띠) · K10 계절표, G8",
    availability: { status: "available", options: 'layout: "bands"' },
    orientations: ["portrait"],
    draw: () => {
      const [title, body] = split(contentBox("portrait"), "rows", [12, "*"], 4)
      return [
        ...posterTitle(title!),
        ...split(body!, "rows", ["*", "*", "*", "*"], 5).flatMap((band, i): Shape[] => {
          const [label, art] = split(band, "rows", [7, "*"], 1)
          return [smallLabel(label!, SEASON_NAMES[i]!, 4), { type: "line", tone: "faint", from: [label!.x + 12, label!.y + 3.5], to: [label!.x + label!.width, label!.y + 3.5] }, ...flow(art!, { count: 9, names: true })]
        }),
      ]
    },
  },
  {
    code: "S-B",
    kind: "season-poster",
    page: "sheet",
    title: "사분면(세로) / 네 열(가로)",
    summary: "계절 칸이 정사각에 가까워 그림이 커진다. 가로 용지는 계절을 열로 세운다.",
    source: "⑦ 계절 구획(블록) · G8, R11, R12. X자 대각선 G9도 같은 갈래",
    availability: { status: "available", options: 'layout: "quarters"(세로는 사분면, 가로는 네 열)' },
    orientations: ["portrait", "landscape"],
    draw: (orientation) => {
      const [title, body] = split(contentBox(orientation), "rows", [orientation === "portrait" ? 12 : 10, "*"], 4)
      if (orientation === "portrait")
        return [
          ...posterTitle(title!),
          ...monthGrid(body!, 2, 2, 5).flatMap((cell, i) => {
            const [label, art] = split(inset(cell, 3), "rows", [5, "*"], 2)
            return [frame(cell), smallLabel(label!, SEASON_NAMES[i]!), ...flow(art!, { count: 9, names: true })]
          }),
        ]
      return [
        ...posterTitle(title!),
        ...monthGrid(body!, 4, 1, 4).flatMap((cell, i) => {
          const [label, art] = split(inset(cell, 3), "rows", [5, "*"], 2)
          return [frame(cell), smallLabel(label!, SEASON_NAMES[i]!), ...flow(art!, { count: 9, names: true })]
        }),
      ]
    },
  },
  {
    code: "S-C",
    kind: "season-poster",
    page: "sheet",
    title: "사계절 원형 판",
    summary: "원을 네 조각으로 나눠 12시부터 봄·여름·가을·겨울이 돈다. 조각이 커서 그 계절 그림을 고리에 빽빽이 넣고 이름은 넣지 않는다. 계절 이름은 원 밖 모서리에 크게.",
    source: "⑧ 원형 휠 · R8(사분면 = 계절), R14",
    availability: { status: "available", options: 'layout: "wheel"' },
    orientations: ["portrait", "landscape"],
    draw: (orientation) => {
      // 지름은 판 폭(세로)·판 높이(가로)이고, 계절 이름은 원을 감싼 정사각형 모서리에 쓴다(season-poster.tsx의 SeasonWheel).
      const [title, body] = split(contentBox(orientation), "rows", [orientation === "portrait" ? 12 : 10, "*"], 4)
      const d = Math.min(body!.width, body!.height)
      const box = { x: body!.x + (body!.width - d) / 2, y: body!.y + (body!.height - d) / 2, width: d, height: d }
      const size = d * 0.05
      const corners: Shape[] = SEASON_NAMES.map((text, i) => {
        const left = i >= 2
        const top = i === 0 || i === 3
        return { type: "label", tone: "strong", anchor: left ? "start" : "end", x: left ? box.x : box.x + d, y: top ? box.y : box.y + d - size, size, text }
      })
      return [...posterTitle(title!), ...wheel(box, { sectors: 4, perSector: 9, labels: ["", "", "", ""] }), ...corners]
    },
  },
  {
    code: "S-D",
    kind: "season-poster",
    page: "sheet",
    title: "계절마다 한 장(4쪽)",
    summary: "계절 하나에 시트 한 장. 품종 그림이 네 배 커지고 계절마다 바꿔 건다. 결과 PDF가 1쪽에서 4쪽이 된다.",
    source: "⑦ 계절마다 한 장 · K9, R10",
    availability: { status: "available", options: 'layout: "per-season"' },
    orientations: ["portrait", "landscape"],
    draw: (orientation) => {
      const portrait = orientation === "portrait"
      const [header, rule, art, foot] = split(contentBox(orientation), "rows", [portrait ? 30 : 22, 3, "*", 6], portrait ? 6 : 4)
      const [season, months] = portrait ? ["여름", "6 · 7 · 8월"] : ["봄", "3 · 4 · 5월"]
      return [
        { type: "label", tone: "strong", x: header!.x, y: header!.y, size: portrait ? 26 : 20, text: season },
        { type: "label", tone: "small", anchor: "end", x: header!.x + header!.width, y: header!.y + 2, size: 3.4, text: months },
        { type: "bar", tone: "strong", box: { ...rule!, width: rule!.width * 0.5 } },
        ...flow(art!, { count: 16, names: true }),
        { type: "bar", tone: "text", box: { x: foot!.x, y: foot!.y + 2.5, width: foot!.width * 0.34, height: 1 } },
        { type: "bar", tone: "text", box: { x: foot!.x + foot!.width * 0.86, y: foot!.y + 2.5, width: foot!.width * 0.14, height: 1 } },
      ]
    },
  },
]

// ── 월별 포스터 ──

const monthPoster: WireframeEntry[] = [
  {
    code: "P-A",
    kind: "month-poster",
    page: "sheet",
    title: "열두 칸",
    summary: '지금 모양. "이 달에 뭐가 나지"를 칸 하나에서 바로 읽는다.',
    source: "⑥ 한 장 12칸 · G2, R6, R7 (국내 판매 사례 없음)",
    availability: { status: "available", options: 'layout: "cells", grid' },
    orientations: ["portrait", "landscape"],
    draw: (orientation) => {
      const [title, body] = split(contentBox(orientation), "rows", [orientation === "portrait" ? 12 : 10, "*"], 4)
      const [columns, rows] = orientation === "portrait" ? [3, 4] : [4, 3]
      return [
        ...posterTitle(title!),
        ...monthGrid(body!, columns, rows, 4).flatMap((cell, i) => {
          const [label, art] = split(inset(cell, 2.5), "rows", [5, "*"], 1.5)
          return [frame(cell), smallLabel(label!, String(MONTHS[i])), ...flow(art!, { count: 6, names: true })]
        }),
      ]
    },
  },
  {
    code: "P-B",
    kind: "month-poster",
    page: "sheet",
    title: "품종×달 막대표",
    summary: "행 하나가 품종 하나, 제철 달에 막대를 칠한다. 품종이 반복되지 않고 제철 길이가 보인다. 카테고리 띠로 묶는다. 달마다 대표 여섯(많아야 72개)을 세로 2단, 가로 3단에 나눠 이름이 A4 약 9pt다.",
    source: "⑨ 기간 표시 · G10, G7. 행 = 품종인 표 자체는 판매 사례로 확인 못 함",
    availability: { status: "available", options: 'layout: "chart"' },
    orientations: ["portrait", "landscape"],
    draw: (orientation) => {
      const [title, body] = split(contentBox(orientation), "rows", [orientation === "portrait" ? 12 : 10, "*"], 4)
      // 달마다 대표 품종을 세로 2단, 가로 3단에 나눈다(month-poster.tsx의 CHART).
      if (orientation === "portrait") {
        const [left, right] = split(body!, "cols", ["*", "*"], 8)
        return [...posterTitle(title!), ...periodChart(left!, { rows: 30, groups: ["채소", "과일"], seed: 41, label: 0.3 }), ...periodChart(right!, { rows: 30, groups: ["수산", "곡물·견과"], seed: 44, label: 0.3 })]
      }
      const columns = split(body!, "cols", ["*", "*", "*"], 8)
      return [...posterTitle(title!), ...columns.flatMap((column, i) => periodChart(column, { rows: 20, groups: [["채소"], ["과일", "수산"], ["수산", "곡물·견과"]][i], seed: 42 + i, label: 0.32 }))]
    },
  },
  {
    code: "P-C",
    kind: "month-poster",
    page: "sheet",
    title: "열두 달 원형 판",
    summary: "열두 조각 원에 달마다 그림 넷까지. 해가 바뀌어도 쓰는 포스터라 시계처럼 둥근 모양이 어울린다. 칸이 좁아 이름은 넣지 않는다.",
    source: "⑧ 원형 휠 · G6, R8",
    availability: { status: "available", options: 'layout: "wheel"' },
    orientations: ["portrait", "landscape"],
    draw: (orientation) => {
      // 지름은 판 폭(세로)·판 높이(가로)이고 가운데에 놓는다(month-poster.tsx의 MonthWheel).
      const [title, body] = split(contentBox(orientation), "rows", [orientation === "portrait" ? 12 : 10, "*"], 4)
      const d = Math.min(body!.width, body!.height)
      return [...posterTitle(title!), ...wheel({ x: body!.x + (body!.width - d) / 2, y: body!.y + (body!.height - d) / 2, width: d, height: d }, { sectors: 12, perSector: 4 })]
    },
  },
  {
    code: "P-D",
    kind: "month-poster",
    page: "sheet",
    title: "한 줄에 한 달, 장보기 체크",
    summary: "달마다 한 줄: 큰 달 표기, 그림(최대 여섯), 그 달 품종 전체의 이름 체크 칸(그림 없는 품종 포함). 냉장고에 붙여 두고 그 달 줄만 본다.",
    source: "④ + ⑥ · R6(그림 + 이름 목록), G2(장보기 목록용), K11(먹은 것 표시)",
    availability: { status: "available", options: 'layout: "rows-check"(세로 용지만)' },
    orientations: ["portrait"],
    draw: () => {
      const [title, body] = split(contentBox("portrait"), "rows", [12, "*"], 4)
      return [
        ...posterTitle(title!),
        ...split(body!, "rows", MONTHS.map(() => "*" as const), 0).flatMap((row, i): Shape[] => {
          const [number, pictures, names] = split(inset(row, 0, 1.5), "cols", [10, 74, "*"], 4)
          const size = Math.min(row.height * 0.5, 8)
          return [
            { type: "line", tone: "faint", from: [row.x, row.y], to: [row.x + row.width, row.y] },
            { type: "label", tone: "strong", anchor: "end", x: number!.x + number!.width, y: row.y + (row.height - size) / 2, size, text: String(MONTHS[i]) },
            ...flow(pictures!, { count: 5, align: "start" }),
            ...nameList(names!, { count: 6, columns: 3, check: true }),
          ]
        }),
      ]
    },
  },
]

export const WIREFRAMES: readonly WireframeEntry[] = [...monthly, ...yearSheet, ...seasonPoster, ...monthPoster]

export function wireframesOf(kind: PrintKind, page?: WireframeEntry["page"]): readonly WireframeEntry[] {
  return WIREFRAMES.filter((entry) => entry.kind === kind && (!page || entry.page === page))
}

export function wireframeOf(code: string): WireframeEntry | undefined {
  return WIREFRAMES.find((entry) => entry.code === code)
}
