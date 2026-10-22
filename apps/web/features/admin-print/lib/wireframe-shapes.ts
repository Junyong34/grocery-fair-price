import { daysInMonth, weekdayOf } from "@workspace/seasonal/calendar/date-utils"
import { monthCalendar } from "@workspace/seasonal/calendar/month-calendar"

// 인쇄물 와이어프레임의 도형. 좌표는 A4 용지 mm이고 A3는 같은 비율이라 따로 두지 않는다.
// 그림 = X 박스, 달력 = 칸 격자와 날짜 눈금, 글 = 막대. 숫자·계절 이름만 실제 글자(label)로 그린다.
// 렌더러(wireframes/wireframe.tsx)는 이 도형 목록을 SVG로 옮기기만 한다.

export type Orientation = "portrait" | "landscape"
export type Rect = { readonly x: number; readonly y: number; readonly width: number; readonly height: number }
type Point = readonly [number, number]

/** text: 글 줄, strong: 제목 줄, day·holiday: 날짜 눈금, period: 제철 기간 막대, faint: 쓰기 칸 밑줄 */
export type BarTone = "text" | "strong" | "day" | "holiday" | "period" | "faint"

export type Shape =
  | { readonly type: "picture"; readonly box: Rect; readonly round?: boolean }
  | { readonly type: "bar"; readonly box: Rect; readonly tone: BarTone }
  | { readonly type: "line"; readonly from: Point; readonly to: Point; readonly tone?: "faint" | "strong" }
  | { readonly type: "frame"; readonly box: Rect; readonly fill?: boolean }
  | { readonly type: "check"; readonly box: Rect }
  | { readonly type: "ring"; readonly cx: number; readonly cy: number; readonly r: number; readonly fill?: boolean }
  | {
      readonly type: "label"
      readonly x: number
      /** 글자 윗변 */
      readonly y: number
      readonly size: number
      readonly text: string
      readonly anchor?: "start" | "middle" | "end"
      /** strong: 큰 숫자·계절 이름(제목 서체), soft: 그림 위에 옅게 얹는 숫자, small: 작은 칸 이름 */
      readonly tone?: "strong" | "soft" | "small"
    }

const A4 = { width: 210, height: 297 }
/** 인쇄 CSS의 안전 여백(--safe = 용지 단위 12) */
export const SAFE = 12
const EPSILON = 1e-6

export function sheetOf(orientation: Orientation): { width: number; height: number } {
  return orientation === "portrait" ? { ...A4 } : { width: A4.height, height: A4.width }
}

/** 글자와 선을 둘 수 있는 안쪽 칸 */
export function contentBox(orientation: Orientation): Rect {
  const { width, height } = sheetOf(orientation)
  return { x: SAFE, y: SAFE, width: width - SAFE * 2, height: height - SAFE * 2 }
}

export function inset(rect: Rect, dx: number, dy = dx): Rect {
  return { x: rect.x + dx, y: rect.y + dy, width: rect.width - dx * 2, height: rect.height - dy * 2 }
}

/** 한 방향으로 나눈다. 숫자는 mm 고정, "*"는 남은 길이를 똑같이 나눠 갖는다. */
export function split(rect: Rect, direction: "rows" | "cols", sizes: readonly (number | "*")[], gap: number): Rect[] {
  const total = direction === "rows" ? rect.height : rect.width
  const fixed = sizes.reduce<number>((sum, size) => sum + (size === "*" ? 0 : size), 0)
  const stars = sizes.filter((size) => size === "*").length
  const share = stars ? (total - fixed - gap * (sizes.length - 1)) / stars : 0
  let at = 0
  return sizes.map((size) => {
    const length = size === "*" ? share : size
    const part = direction === "rows" ? { x: rect.x, y: rect.y + at, width: rect.width, height: length } : { x: rect.x + at, y: rect.y, width: length, height: rect.height }
    at += length + gap
    return part
  })
}

/** 열×행 칸. 왼쪽 위부터 행 순서. */
export function monthGrid(rect: Rect, columns: number, rows: number, gap: number): Rect[] {
  const width = (rect.width - gap * (columns - 1)) / columns
  const height = (rect.height - gap * (rows - 1)) / rows
  return Array.from({ length: columns * rows }, (_, i) => ({
    x: rect.x + (i % columns) * (width + gap),
    y: rect.y + Math.floor(i / columns) * (height + gap),
    width,
    height,
  }))
}

// ── 판정 ──

const charWidth = (char: string) => (/[가-힣]/.test(char) ? 1 : 0.62)

export function boundsOf(shape: Shape): Rect {
  switch (shape.type) {
    case "picture":
    case "bar":
    case "frame":
    case "check":
      return shape.box
    case "line": {
      const [x1, y1] = shape.from
      const [x2, y2] = shape.to
      return { x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1) }
    }
    case "ring":
      return { x: shape.cx - shape.r, y: shape.cy - shape.r, width: shape.r * 2, height: shape.r * 2 }
    case "label": {
      const width = [...shape.text].reduce((sum, char) => sum + charWidth(char), 0) * shape.size
      const x = shape.anchor === "middle" ? shape.x - width / 2 : shape.anchor === "end" ? shape.x - width : shape.x
      return { x, y: shape.y, width, height: shape.size }
    }
  }
}

export function contains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x - EPSILON &&
    inner.y >= outer.y - EPSILON &&
    inner.x + inner.width <= outer.x + outer.width + EPSILON &&
    inner.y + inner.height <= outer.y + outer.height + EPSILON
  )
}

/** 변이 닿기만 하는 것은 겹침이 아니다. */
export function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width - EPSILON && b.x < a.x + a.width - EPSILON && a.y < b.y + b.height - EPSILON && b.y < a.y + a.height - EPSILON
}

/** 시드 고정 난수(mulberry32). 같은 시드면 같은 배치다. */
function random(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── 부품 ──

const NAME_GAP = 0.8
const NAME_HEIGHT = 1
const nameBlock = (names: boolean) => (names ? NAME_GAP + NAME_HEIGHT : 0)

function food(box: Rect, names: boolean): Shape[] {
  const picture: Shape = { type: "picture", box }
  if (!names) return [picture]
  return [picture, { type: "bar", tone: "text", box: { x: box.x + box.width * 0.15, y: box.y + box.height + NAME_GAP, width: box.width * 0.7, height: NAME_HEIGHT } }]
}

export type CalendarStyle = "plain" | "grid" | "mini"

/** 한 달 달력. 요일 머리 눈금 + 날짜 눈금. grid는 칸 선, write는 칸 안 쓰기 줄, fillBlanks는 1일 앞·말일 뒤 빈 칸에 그림. */
export function calendar(
  rect: Rect,
  {
    year,
    month,
    weekStart = 0,
    style = "plain",
    write = false,
    fillBlanks = false,
    holidays = [],
  }: { year: number; month: number; weekStart?: 0 | 1; style?: CalendarStyle; write?: boolean; fillBlanks?: boolean; holidays?: readonly number[] },
): Shape[] {
  const weeks = monthCalendar({ year, month, weekStart, today: { year: 0, month: 0, day: 0 }, holidays: Object.fromEntries(holidays.map((day) => [day, ["공휴일"]])) })
  const head = style === "mini" ? rect.height * 0.12 : Math.min(rect.height * 0.08, 6)
  const cellWidth = rect.width / 7
  const cellHeight = (rect.height - head) / weeks.length
  const shapes: Shape[] = []

  for (let column = 0; column < 7; column++) {
    const width = cellWidth * 0.3
    shapes.push({ type: "bar", tone: "text", box: { x: rect.x + column * cellWidth + (cellWidth - width) / 2, y: rect.y + head * 0.4, width, height: Math.min(head * 0.25, 0.8) } })
  }
  if (style === "grid") {
    const top = rect.y + head
    for (let week = 0; week <= weeks.length; week++) {
      const y = top + week * cellHeight
      shapes.push({ type: "line", from: [rect.x, y], to: [rect.x + rect.width, y] })
    }
    for (let column = 0; column <= 7; column++) {
      const x = rect.x + column * cellWidth
      shapes.push({ type: "line", from: [x, top], to: [x, rect.y + rect.height] })
    }
  }

  weeks.forEach((week, row) =>
    week.forEach((cell, column) => {
      const box = { x: rect.x + column * cellWidth, y: rect.y + head + row * cellHeight, width: cellWidth, height: cellHeight }
      if (!cell) {
        if (!fillBlanks) return
        const size = Math.min(cellWidth, cellHeight) * 0.74
        shapes.push({ type: "picture", round: true, box: { x: box.x + (cellWidth - size) / 2, y: box.y + (cellHeight - size) / 2, width: size, height: size } })
        return
      }
      const tone = cell.weekday === 0 || cell.holidays.length > 0 ? "holiday" : "day"
      const height = Math.max(0.35, Math.min(cellHeight * 0.1, 1.2))
      const width = cellWidth * (style === "mini" ? 0.5 : 0.28)
      const x = style === "grid" ? box.x + cellWidth * 0.1 : box.x + (cellWidth - width) / 2
      const y = box.y + cellHeight * (style === "grid" ? 0.12 : 0.22)
      shapes.push({ type: "bar", tone, box: { x, y, width, height } })
      if (write) shapes.push({ type: "bar", tone: "faint", box: { x: box.x + cellWidth * 0.1, y: box.y + cellHeight * 0.8, width: cellWidth * 0.7, height: 0.3 } })
    }),
  )
  return shapes
}

/** 흩뿌림: 칸을 나누고 칸마다 그림 하나를 조금씩 흔들어 놓는다. 칸 하나에 그림 하나라 서로 겹치지 않는다. avoid와 겹치는 칸은 건너뛴다. */
export function scatter(rect: Rect, { count, seed = 1, names = false, avoid }: { count: number; seed?: number; names?: boolean; avoid?: Rect }): Shape[] {
  const nameHeight = nameBlock(names)
  for (let slots = count; slots <= count * 20; slots++) {
    const columns = Math.max(1, Math.round(Math.sqrt((slots * rect.width) / rect.height)))
    const rows = Math.ceil(slots / columns)
    const cellWidth = rect.width / columns
    const cellHeight = rect.height / rows
    const base = Math.max(0, Math.min(cellWidth, cellHeight - nameHeight) * 0.66)
    const next = random(seed)
    const shapes: Shape[] = []
    let placed = 0
    for (let i = 0; i < columns * rows && placed < count; i++) {
      const size = base * (0.78 + next() * 0.22)
      const x = rect.x + (i % columns) * cellWidth + (cellWidth - size) * (0.15 + next() * 0.7)
      const y = rect.y + Math.floor(i / columns) * cellHeight + (cellHeight - nameHeight - size) * (0.15 + next() * 0.7)
      if (avoid && overlaps({ x, y, width: size, height: size + nameHeight }, avoid)) continue
      shapes.push(...food({ x, y, width: size, height: size }, names))
      placed++
    }
    if (placed === count) return shapes
  }
  return []
}

/** 줄 맞춘 그림. 칸에 들어가는 가장 큰 크기(최대 max)로 줄을 나눠 놓는다. */
export function flow(
  rect: Rect,
  { count, names = false, max = Infinity, gap, align = "center" }: { count: number; names?: boolean; max?: number; gap?: number; align?: "center" | "start" },
): Shape[] {
  const nameHeight = nameBlock(names)
  const space = gap ?? Math.min(3, Math.min(rect.width, rect.height) * 0.05)
  let best = { columns: 1, size: 0 }
  for (let columns = 1; columns <= count; columns++) {
    const rows = Math.ceil(count / columns)
    const size = Math.min((rect.width - space * (columns - 1)) / columns, (rect.height - space * (rows - 1)) / rows - nameHeight)
    if (size > best.size) best = { columns, size }
  }
  const size = Math.max(0, Math.min(best.size, max))
  const rows = Math.ceil(count / best.columns)
  const total = rows * (size + nameHeight) + space * (rows - 1)
  const top = rect.y + (rect.height - total) / 2
  const shapes: Shape[] = []
  for (let row = 0; row < rows; row++) {
    const inRow = Math.min(best.columns, count - row * best.columns)
    const width = inRow * size + space * (inRow - 1)
    const left = align === "center" ? rect.x + (rect.width - width) / 2 : rect.x
    for (let i = 0; i < inRow; i++) shapes.push(...food({ x: left + i * (size + space), y: top + row * (size + nameHeight + space), width: size, height: size }, names))
  }
  return shapes
}

/** 품종 이름 목록. check면 이름 앞에 손으로 체크하는 칸. */
export function nameList(rect: Rect, { count, columns = 1, check = false, seed = count }: { count: number; columns?: number; check?: boolean; seed?: number }): Shape[] {
  const gap = 2
  const perColumn = Math.ceil(count / columns)
  const columnWidth = (rect.width - gap * (columns - 1)) / columns
  const rowHeight = Math.min(rect.height / perColumn, 5)
  const next = random(seed)
  const shapes: Shape[] = []
  for (let i = 0; i < count; i++) {
    const x = rect.x + Math.floor(i / perColumn) * (columnWidth + gap)
    const middle = rect.y + (i % perColumn) * rowHeight + rowHeight / 2
    const box = Math.min(rowHeight * 0.55, 2.2)
    if (check) shapes.push({ type: "check", box: { x, y: middle - box / 2, width: box, height: box } })
    const start = x + (check ? box + 1 : 0)
    const height = Math.min(0.9, rowHeight * 0.25)
    shapes.push({ type: "bar", tone: "text", box: { x: start, y: middle - height / 2, width: (columnWidth - (start - x)) * (0.4 + next() * 0.45), height } })
  }
  return shapes
}

/** 날짜 한 열: 1일부터 말일까지 세로 줄. */
export function dayColumn(rect: Rect, { year, month }: { year: number; month: number }): Shape[] {
  const days = daysInMonth(year, month)
  const rowHeight = rect.height / days
  return Array.from({ length: days }, (_, i): Shape[] => {
    const y = rect.y + i * rowHeight
    const tone = weekdayOf({ year, month, day: i + 1 }) === 0 ? "holiday" : "day"
    const tick = { x: rect.x, y: y + rowHeight * 0.35, width: Math.min(2, rect.width * 0.2), height: Math.max(0.3, rowHeight * 0.3) }
    return [
      { type: "bar", tone, box: tick },
      { type: "line", tone: "faint", from: [rect.x + tick.width + 1, y + rowHeight * 0.75], to: [rect.x + rect.width, y + rowHeight * 0.75] },
    ]
  }).flat()
}

/** 품종×달 막대표: 행 = 품종(그림·이름), 열 = 1~12월, 제철 달에 막대. groups는 행 묶음(카테고리) 띠. */
export function periodChart(
  rect: Rect,
  { rows, groups = [], seed = 1, pictures = true, label = 0.26 }: { rows: number; groups?: readonly string[]; seed?: number; pictures?: boolean; label?: number },
): Shape[] {
  const head = Math.min(rect.height * 0.05, 4)
  const rowHeight = (rect.height - head) / (rows + groups.length)
  const labelWidth = rect.width * label
  const columnWidth = (rect.width - labelWidth) / 12
  const columnX = (month: number) => rect.x + labelWidth + month * columnWidth
  const right = rect.x + rect.width
  const next = random(seed)
  const shapes: Shape[] = []

  const monthSize = Math.min(columnWidth * 0.6, head * 0.8, 2.6)
  for (let month = 0; month < 12; month++) shapes.push({ type: "label", tone: "small", anchor: "middle", x: columnX(month) + columnWidth / 2, y: rect.y + (head - monthSize) / 2, size: monthSize, text: String(month + 1) })
  for (let month = 0; month <= 12; month++) shapes.push({ type: "line", tone: "faint", from: [columnX(month), rect.y + head], to: [columnX(month), rect.y + rect.height] })

  const perGroup = Math.ceil(rows / Math.max(groups.length, 1))
  let y = rect.y + head
  for (let row = 0; row < rows; row++) {
    if (groups.length && row % perGroup === 0) {
      const size = Math.min(rowHeight * 0.6, 2.6)
      shapes.push({ type: "line", tone: "strong", from: [rect.x, y], to: [right, y] })
      shapes.push({ type: "label", tone: "small", x: rect.x, y: y + (rowHeight - size) / 2, size, text: groups[row / perGroup]! })
      y += rowHeight
    }
    shapes.push({ type: "line", tone: "faint", from: [rect.x, y], to: [right, y] })
    const picture = pictures ? rowHeight * 0.66 : 0
    if (pictures) shapes.push({ type: "picture", round: true, box: { x: rect.x + 0.5, y: y + (rowHeight - picture) / 2, width: picture, height: picture } })
    const start = rect.x + (pictures ? picture + 1.5 : 0)
    const nameHeight = Math.min(0.8, rowHeight * 0.2)
    shapes.push({ type: "bar", tone: "text", box: { x: start, y: y + (rowHeight - nameHeight) / 2, width: (labelWidth - (start - rect.x) - 1) * (0.45 + next() * 0.4), height: nameHeight } })

    // 제철 1~4달. 12월에서 1월로 넘어가면 막대 두 개로 나눈다.
    const length = 1 + Math.floor(next() * 4)
    const from = Math.floor(next() * 12)
    const runs = from + length > 12 ? [[from, 11], [0, from + length - 13]] : [[from, from + length - 1]]
    const barHeight = rowHeight * 0.46
    for (const [first, last] of runs) shapes.push({ type: "bar", tone: "period", box: { x: columnX(first!) + columnWidth * 0.12, y: y + (rowHeight - barHeight) / 2, width: (last! - first! + 1) * columnWidth - columnWidth * 0.24, height: barHeight } })
    y += rowHeight
  }
  return shapes
}

/** 원형 판: 조각마다 그림. 4조각은 계절, 12조각은 달. */
export function wheel(rect: Rect, { sectors, perSector, labels = [] }: { sectors: number; perSector: number; labels?: readonly string[] }): Shape[] {
  const radius = Math.min(rect.width, rect.height) / 2 - 0.5
  const cx = rect.x + rect.width / 2
  const cy = rect.y + rect.height / 2
  const at = (angle: number, r: number): Point => [cx + r * Math.sin(angle), cy - r * Math.cos(angle)]
  const spread = (Math.PI * 2) / sectors
  const across = sectors === 4 ? 3 : 1
  const rings = Math.ceil(perSector / across)
  const core = radius * 0.29
  const pictureRadius = radius * (sectors === 12 ? 0.062 : 0.075)
  const shapes: Shape[] = [{ type: "ring", cx, cy, r: radius }]

  for (let sector = 0; sector < sectors; sector++) {
    const angle = sector * spread
    shapes.push({ type: "line", from: at(angle, core), to: at(angle, radius) })
    const [lx, ly] = at(angle + spread / 2, radius * 0.93)
    const size = radius * 0.06
    shapes.push({ type: "label", tone: "small", anchor: "middle", x: lx, y: ly - size / 2, size, text: labels[sector] ?? String(sector + 1) })
    for (let i = 0; i < perSector; i++) {
      const ring = Math.floor(i / across)
      const r = rings === 1 ? radius * 0.62 : radius * 0.44 + (ring * radius * 0.35) / (rings - 1)
      const [px, py] = at(angle + (spread * ((i % across) + 0.5)) / across, r)
      shapes.push({ type: "picture", round: true, box: { x: px - pictureRadius, y: py - pictureRadius, width: pictureRadius * 2, height: pictureRadius * 2 } })
    }
  }
  shapes.push({ type: "ring", cx, cy, r: core, fill: true })
  shapes.push({ type: "bar", tone: "strong", box: { x: cx - core * 0.6, y: cy - core * 0.18, width: core * 1.2, height: core * 0.14 } })
  shapes.push({ type: "bar", tone: "text", box: { x: cx - core * 0.4, y: cy + core * 0.12, width: core * 0.8, height: core * 0.08 } })
  return shapes
}
