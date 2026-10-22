// 행 묶음 하나를 초안으로 바꾼다. 거부된 행은 초안에서 빼고 몇 번째 행인지와 사유를 남긴다.
// 거부된 행은 원본에만 남고 raw_object.rejected_rows로 센다 (3-12 #26). 사유에 값은 넣지 않는다.
export type RejectedRow = { index: number; reason: string }

export type AdaptOutcome<D> = { drafts: D[]; rejected: RejectedRow[] }

export function adaptRows<Row, D>(
  rows: readonly Row[],
  reject: (row: Row) => string | null,
  adapt: (row: Row) => D,
): AdaptOutcome<D> {
  const drafts: D[] = []
  const rejected: RejectedRow[] = []
  rows.forEach((row, index) => {
    const reason = reject(row)
    if (reason === null) drafts.push(adapt(row))
    else rejected.push({ index, reason })
  })
  return { drafts, rejected }
}
