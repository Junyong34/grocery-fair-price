// 가격 그림(범위 막대 · 점 비교 · 추이 · 장소 막대)이 함께 쓰는 가격 축.

export type PriceAxis = {
  min: number
  max: number
  /** 둥근 눈금 값. 눈금을 청하지 않았으면 비어 있다. */
  ticks: readonly number[]
  /** 값 → 축 위 자리(0 = min, 1 = max). 축 밖의 값은 끝에 붙인다. */
  at: (value: number) => number
}

/** 눈금 간격: 1 · 2 · 2.5 · 5 × 10^k 가운데 raw 이상인 가장 작은 값. */
function niceStep(raw: number): number {
  const power = 10 ** Math.floor(Math.log10(raw))
  return [1, 2, 2.5, 5, 10].map((m) => m * power).find((step) => step >= raw) ?? raw
}

/**
 * values를 모두 담는 가격 축. pad는 양 끝에 둘 여백(값 폭에 대한 비율),
 * ticks는 바라는 눈금 칸 수로, 주면 축 끝을 둥근 눈금 값까지 넓힌다.
 * 값이 모두 같으면 그 값을 가운데에 놓는다.
 */
export function priceAxis(values: readonly number[], { pad = 0, ticks }: { pad?: number; ticks?: number } = {}): PriceAxis {
  let lo = Math.min(...values)
  let hi = Math.max(...values)
  if (hi === lo) {
    const half = Math.abs(lo) * 0.1 || 1
    lo -= half
    hi += half
  } else {
    const space = (hi - lo) * pad
    lo -= space
    hi += space
  }
  const marks: number[] = []
  if (ticks) {
    const step = niceStep((hi - lo) / ticks)
    lo = Math.floor(lo / step) * step
    hi = Math.ceil(hi / step) * step
    for (let i = 0; i <= Math.round((hi - lo) / step); i++) marks.push(lo + i * step)
  }
  return { min: lo, max: hi, ticks: marks, at: (value) => Math.min(1, Math.max(0, (value - lo) / (hi - lo))) }
}
