import type { PrintGrid } from "@workspace/seasonal/print/spec"

/** "열x행" 배열 이름을 열·행 수로. */
export function gridSize(grid: PrintGrid): { columns: number; rows: number } {
  const [columns, rows] = grid.split("x").map(Number) as [number, number]
  return { columns, rows }
}
