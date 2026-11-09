import type { ProductDetail } from "@workspace/price/types"

type Point = ProductDetail["trend"][number]

export type TrendStats = {
  first: Point
  last: Point
  /** 전국 판매가(median)의 기간 최고. 같은 값이면 가장 최근 조사일 */
  high: { date: string; value: number }
  /** 전국 판매가의 기간 최저. 같은 값이면 가장 최근 조사일 */
  low: { date: string; value: number }
  /** 전국 판매가의 조사일 평균(원 단위 반올림) */
  average: number
  /** 마지막 조사 − 첫 조사(원) */
  change: number
}

/** 최근 조사 가격 요약: 기간 최고 · 최저 · 평균과 첫 조사 대비 변화. 기록이 없으면 null. */
export function trendStats(points: readonly Point[]): TrendStats | null {
  const first = points[0]
  const last = points.at(-1)
  if (!first || !last) return null
  let high = { date: first.date, value: first.median }
  let low = high
  let sum = 0
  for (const { date, median } of points) {
    if (median >= high.value) high = { date, value: median }
    if (median <= low.value) low = { date, value: median }
    sum += median
  }
  return {
    first,
    last,
    high,
    low,
    average: Math.round(sum / points.length),
    change: last.median - first.median,
  }
}

/**
 * 가로축 날짜 표시를 고른다. positions는 오름차순 자리(0~100).
 * 처음과 끝은 늘 두고, 사이 값은 앞에 둔 값과 끝 모두에서 minGap 이상 떨어질 때만 둔다.
 */
export function spacedIndexes(
  positions: readonly number[],
  minGap: number
): number[] {
  const end = positions.length - 1
  if (end < 0) return []
  const kept = [0]
  for (let i = 1; i < end; i++) {
    const position = positions[i]!
    if (
      position - positions[kept.at(-1)!]! >= minGap &&
      positions[end]! - position >= minGap
    )
      kept.push(i)
  }
  if (end > 0) kept.push(end)
  return kept
}

/** target에 가장 가까운 자리의 순번. 같은 거리면 뒤쪽(더 최근 조사)을 고른다. */
export function nearestIndex(
  positions: readonly number[],
  target: number
): number {
  let best = 0
  positions.forEach((position, index) => {
    if (Math.abs(position - target) <= Math.abs(positions[best]! - target))
      best = index
  })
  return best
}
