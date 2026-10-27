import type { Verdict, VerdictBand } from "./types"

/** 품종별 구간을 정하기 전(judgment.md 2장)에 쓰는 구간: 평소가 ±10%. */
export const DEFAULT_BAND: VerdictBand = { lower: -10, upper: 10 }

/**
 * 가격을 평소가와 견준 판정. 목록 칩과 품종 상세, "내가 본 가격"이 모두 이 함수를 쓴다.
 * 차이는 반올림한 정수 %이고, 구간 비교도 반올림한 값으로 해서 화면의 %와 판정이 어긋나지 않는다.
 * 평소가가 없으면(또는 0 이하면) 판정 전이다.
 */
export function verdictOf(price: number, usual: number | null, band: VerdictBand): Verdict {
  if (usual == null || usual <= 0) return { kind: "none", pct: null }
  // -0을 0으로 맞춘다.
  const pct = Math.round((price / usual - 1) * 100) || 0
  const kind = pct < band.lower ? "cheap" : pct > band.upper ? "pricey" : "normal"
  return { kind, pct }
}
