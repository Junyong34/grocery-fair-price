import { describe, expect, it } from "vitest"

import { boundsOf, calendar, contains, contentBox, dayColumn, flow, monthGrid, nameList, overlaps, periodChart, scatter, sheetOf, split, wheel, type Rect, type Shape } from "./wireframe-shapes"

const box: Rect = { x: 10, y: 20, width: 120, height: 80 }
const pictures = (shapes: readonly Shape[]) => shapes.filter((shape) => shape.type === "picture")
const inside = (shapes: readonly Shape[], rect: Rect) => shapes.every((shape) => contains(rect, boundsOf(shape)))

describe("sheetOf, contentBox", () => {
  it("A4 mm 크기에 방향을 반영하고, 안쪽 칸은 안전 여백 12mm를 뺀다", () => {
    expect(sheetOf("portrait")).toEqual({ width: 210, height: 297 })
    expect(sheetOf("landscape")).toEqual({ width: 297, height: 210 })
    expect(contentBox("portrait")).toEqual({ x: 12, y: 12, width: 186, height: 273 })
  })
})

describe("split", () => {
  it("고정 크기를 먼저 주고 남은 길이를 *끼리 나눈다", () => {
    const [top, middle, bottom] = split(box, "rows", [20, "*", "*"], 4)
    expect(top).toEqual({ x: 10, y: 20, width: 120, height: 20 })
    expect(middle!.height).toBeCloseTo(26)
    expect(bottom!.y + bottom!.height).toBeCloseTo(100)
  })

  it("열 방향은 폭을 나눈다", () => {
    const [left, right] = split(box, "cols", ["*", 40], 0)
    expect(left).toEqual({ x: 10, y: 20, width: 80, height: 80 })
    expect(right).toEqual({ x: 90, y: 20, width: 40, height: 80 })
  })
})

describe("monthGrid", () => {
  it("열×행 칸을 왼쪽 위부터 행 순서로 낸다", () => {
    const cells = monthGrid(box, 3, 4, 2)
    expect(cells).toHaveLength(12)
    expect(cells[1]!.x).toBeGreaterThan(cells[0]!.x)
    expect(cells[3]!.y).toBeGreaterThan(cells[0]!.y)
    expect(cells.every((cell) => contains(box, cell))).toBe(true)
  })
})

describe("calendar", () => {
  const days = (shapes: readonly Shape[]) => shapes.filter((shape) => shape.type === "bar" && (shape.tone === "day" || shape.tone === "holiday"))

  it("2027년 10월은 31일, 1일이 금요일 칸(일요일 시작 6번째)이다", () => {
    const shapes = calendar(box, { year: 2027, month: 10 })
    const marks = days(shapes)
    expect(marks).toHaveLength(31)
    const columnWidth = box.width / 7
    expect(Math.floor((boundsOf(marks[0]!).x - box.x) / columnWidth)).toBe(5)
    expect(inside(shapes, box)).toBe(true)
  })

  it("월요일 시작이면 1일이 한 칸 앞으로 온다", () => {
    const marks = days(calendar(box, { year: 2027, month: 10, weekStart: 1 }))
    expect(Math.floor((boundsOf(marks[0]!).x - box.x) / (box.width / 7))).toBe(4)
  })

  it("일요일과 지정한 공휴일은 빨간 날이다", () => {
    const marks = days(calendar(box, { year: 2027, month: 10, holidays: [9] }))
    const red = marks.map((mark, i) => (mark.type === "bar" && mark.tone === "holiday" ? i + 1 : 0)).filter(Boolean)
    expect(red).toEqual([3, 9, 10, 17, 24, 31])
  })

  it("빈 칸 채우기를 켜면 1일 앞·말일 뒤 칸마다 그림이 하나씩 들어간다", () => {
    // 2027년 11월: 월요일 시작, 30일 → 일요일 시작 5주 35칸 중 빈 칸 5
    const shapes = calendar(box, { year: 2027, month: 11, fillBlanks: true })
    expect(pictures(shapes)).toHaveLength(5)
    expect(inside(shapes, box)).toBe(true)
  })
})

describe("scatter", () => {
  it("요청한 개수만큼 겹치지 않게, 칸 안에 놓는다", () => {
    const shapes = scatter(box, { count: 9, seed: 3, names: true })
    const placed = pictures(shapes)
    expect(placed).toHaveLength(9)
    expect(inside(shapes, box)).toBe(true)
    placed.forEach((a, i) => placed.slice(i + 1).forEach((b) => expect(overlaps(boundsOf(a), boundsOf(b))).toBe(false)))
  })

  it("비울 칸(avoid)과는 겹치지 않는다", () => {
    const avoid = { x: 70, y: 60, width: 60, height: 40 }
    const shapes = scatter(box, { count: 12, seed: 5, avoid })
    expect(pictures(shapes)).toHaveLength(12)
    expect(shapes.some((shape) => overlaps(boundsOf(shape), avoid))).toBe(false)
  })

  it("같은 시드면 같은 배치다", () => {
    expect(scatter(box, { count: 6, seed: 9 })).toEqual(scatter(box, { count: 6, seed: 9 }))
  })
})

describe("flow", () => {
  it("개수가 많아져도 칸 안에 들어가도록 그림을 줄인다", () => {
    for (const count of [1, 5, 14, 30]) {
      const shapes = flow(box, { count, names: true })
      expect(pictures(shapes)).toHaveLength(count)
      expect(inside(shapes, box)).toBe(true)
    }
  })

  it("최대 크기를 넘지 않는다", () => {
    const [first] = pictures(flow(box, { count: 2, max: 10 }))
    expect(boundsOf(first!).width).toBeLessThanOrEqual(10)
  })
})

describe("nameList, dayColumn", () => {
  it("체크 칸을 켜면 항목마다 체크 칸이 하나다", () => {
    const shapes = nameList(box, { count: 8, columns: 2, check: true })
    expect(shapes.filter((shape) => shape.type === "check")).toHaveLength(8)
    expect(inside(shapes, box)).toBe(true)
  })

  it("날짜 한 열은 그 달 날수만큼 줄이 있다", () => {
    const shapes = dayColumn(box, { year: 2027, month: 2 })
    expect(shapes.filter((shape) => shape.type === "bar")).toHaveLength(28)
    expect(inside(shapes, box)).toBe(true)
  })
})

describe("periodChart", () => {
  it("품종 행마다 이름과 그림, 제철 막대가 있고 묶음 띠가 끼어든다", () => {
    const shapes = periodChart(box, { rows: 10, groups: ["채소", "과일"], seed: 1 })
    expect(pictures(shapes)).toHaveLength(10)
    expect(shapes.filter((shape) => shape.type === "bar" && shape.tone === "period").length).toBeGreaterThanOrEqual(10)
    expect(shapes.filter((shape) => shape.type === "label" && (shape.text === "채소" || shape.text === "과일"))).toHaveLength(2)
    expect(inside(shapes, box)).toBe(true)
  })
})

describe("wheel", () => {
  it("조각 수 × 조각당 그림 수만큼 그림이 원 안에 있다", () => {
    const square = { x: 0, y: 0, width: 100, height: 100 }
    const shapes = wheel(square, { sectors: 4, perSector: 9, labels: ["봄", "여름", "가을", "겨울"] })
    expect(pictures(shapes)).toHaveLength(36)
    expect(inside(shapes, square)).toBe(true)
    expect(pictures(wheel(square, { sectors: 12, perSector: 3 }))).toHaveLength(36)
  })
})
