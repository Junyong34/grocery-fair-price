import { PAIRINGS, type PairingRow } from "./data"

const SHEET_COUNT = 3
const COLUMNS_PER_SHEET = 3

// A4 세로에서 좌우 9mm, 열 사이 4mm, O·X 칸 안쪽 여백을 뺀 폭이다.
const CELL_WIDTH_MM = (210 - 18 - 8) / COLUMNS_PER_SHEET / 2 - 1.4

function estimatedLines(names: readonly string[]) {
  let width = 0
  let lines = 1
  for (const name of names) {
    // 그림 5.4mm와 간격, 한글 글자당 약 3.9mm(11pt).
    const itemWidth = 6.9 + name.length * 3.9
    if (width > 0 && width + itemWidth > CELL_WIDTH_MM) {
      lines += 1
      width = 0
    }
    width += itemWidth
  }
  return lines
}

/** 표가 긴 재료부터 내용이 가장 적은 열에 배치한다. 실제 용지 넘침은 PDF 생성 직전에 검사한다. */
export function paginatePairings(rows: readonly PairingRow[]) {
  const columns = Array.from(
    { length: SHEET_COUNT * COLUMNS_PER_SHEET },
    (): { height: number; entries: { row: PairingRow; order: number }[] } => ({
      height: 0,
      entries: [],
    })
  )
  const byHeight = rows
    .map((row, order) => ({
      row,
      order,
      height:
        14 + 6 * Math.max(estimatedLines(row.good), estimatedLines(row.bad)),
    }))
    .sort((a, b) => b.height - a.height)

  for (const entry of byHeight) {
    const column = columns.reduce((shortest, current) =>
      current.height < shortest.height ? current : shortest
    )
    column.entries.push(entry)
    column.height += entry.height
  }

  // 첫 세 열에 배치한 긴 표를 서로 다른 장에 둔다.
  return Array.from({ length: SHEET_COUNT }, (_, sheet) =>
    columns
      .filter((_, index) => index % SHEET_COUNT === sheet)
      .map(({ entries }) =>
        entries.sort((a, b) => a.order - b.order).map(({ row }) => row)
      )
  )
}

export const PAIRING_PRINT_SHEETS = paginatePairings(PAIRINGS)
