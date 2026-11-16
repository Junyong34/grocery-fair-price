// 시세 상세 그림: P3 품종 상세의 범위 막대 · "내가 본 가격" · 점 비교가 그리는 값을 한 곳에서 낸다.
// 화면은 여기서 받은 자리(0~1)와 판정을 마크업 · CSS로 옮기기만 한다.
import { priceAxis, type PriceAxis } from "./axis"
import type { VarietyDetail, Verdict, VerdictKind } from "./types"
import { usualRange, verdictOf } from "./verdict"

/** 축 위 구간. from · to는 축 위 자리(0 = min, 1 = max). */
export type AxisSpan = { from: number; to: number }

/** 평소가 표시: 평소가 눈금 자리와 평소 범위 띠. 평소가가 없으면(또는 0 이하면) 둘 다 null. */
export type UsualMarks = { usualAt: number | null; band: AxisSpan | null }

/** "내가 본 가격" 핀: 적은 가격, 견준 평소가, 그 판정(핀 색), 축 위 자리. */
export type MyPricePin = { price: number; usual: number; verdict: Verdict; at: number }

export type DetailPicture = UsualMarks & {
  /** "내가 본 가격"을 이 시세의 평소가와 견줄 수 있는가. false면 입력 섹션과 핀을 뺀다. */
  comparesMyPrice: boolean
  /** 범위 막대의 가격 축: 조사 범위 · 시세 · 평소 범위 띠 · 내가 본 가격을 모두 담는다 */
  axis: PriceAxis
  /** 조사 범위(싼 곳 ~ 비싼 곳) */
  survey: AxisSpan
  /** 시세 핀. 색은 시세 판정 */
  quote: { at: number; tone: VerdictKind }
  /** 내가 본 가격 핀. 적지 않았거나 견줄 수 없으면 null */
  mine: MyPricePin | null
}

/**
 * "내가 본 가격"을 이 시세의 평소가와 견줄 수 있는가. 평소가가 있어야 하고(0 이하는 판정 전과 같이 없는 것으로 본다),
 * 품종 · 브랜드 편차가 큰 품종(쌀 등, judgment.md 5-3)은 견주지 않는다. 브랜드 값을 일반 시세에 대면 늘 한쪽으로 나온다.
 */
export function comparesMyPrice(variety: Pick<VarietyDetail, "usual" | "priceSpread">): boolean {
  return variety.usual != null && variety.usual > 0 && variety.priceSpread !== "brand"
}

/** values와 평소 범위 띠를 모두 담는 축, 그 축 위 평소가 표시. */
function usualScale(detail: Pick<VarietyDetail, "usual" | "band">, values: readonly number[], pad: number): UsualMarks & { axis: PriceAxis } {
  const range = usualRange(detail.usual, detail.band)
  const axis = priceAxis([...values, ...(range ? [range.low, range.high] : [])], { pad })
  return {
    axis,
    usualAt: range && detail.usual != null ? axis.at(detail.usual) : null,
    band: range ? { from: axis.at(range.low), to: axis.at(range.high) } : null,
  }
}

/**
 * 범위 막대와 "내가 본 가격"의 그림. myPrice는 사용자가 적은 가격(없으면 null)으로,
 * 견줄 수 없는 품종이면 버린다(축에도 핀에도 넣지 않는다).
 */
export function detailPicture(detail: VarietyDetail, myPrice: number | null = null): DetailPicture {
  const compares = comparesMyPrice(detail)
  const mine = compares ? myPrice : null
  const { range } = detail
  const scale = usualScale(detail, [range.min, range.max, detail.price, ...(mine != null ? [mine] : [])], 0.08)
  const { axis } = scale
  return {
    ...scale,
    comparesMyPrice: compares,
    survey: { from: axis.at(range.min), to: axis.at(range.max) },
    quote: { at: axis.at(detail.price), tone: detail.verdict.kind },
    // compares가 참이면 평소가가 0보다 크다
    mine: mine == null ? null : { price: mine, usual: detail.usual!, verdict: verdictOf(mine, detail.usual, detail.band), at: axis.at(mine) },
  }
}

/** "왜 이 판정일까?" 점 비교의 축: 점 값과 평소 범위 띠를 모두 담는다(여백 6%). */
export function dotsPicture(detail: Pick<VarietyDetail, "usual" | "band">, values: readonly number[]): UsualMarks & { axis: PriceAxis } {
  return usualScale(detail, values, 0.06)
}
