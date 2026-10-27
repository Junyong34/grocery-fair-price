// 가격 추이 차트(P3 "왜 이 판정일까?")의 순수 계산.

import { daysBetween } from "./format"
import type { TrendPoint, VerdictBand } from "./types"
import { verdictOf } from "./verdict"

/** 마지막 날에서 days일 전까지의 추이(1 · 3 · 6개월 탭). */
export function trendWindow(trend: readonly TrendPoint[], days: number): TrendPoint[] {
  const last = trend.at(-1)
  if (!last) return []
  return trend.filter((point) => daysBetween(point.date, last.date) <= days)
}

/** 급등 · 급락 점: 시세가 평소 범위를 벗어난 날. */
export type Spike = { date: string; price: number; usual: number; kind: "cheap" | "pricey"; pct: number }

/**
 * 시세가 평소 범위 밖으로 나간 구간마다 가장 많이 벗어난 날 하나를 고른다.
 * 같은 쪽(비싸요 · 싸요)으로 이어진 날을 한 구간으로 보고, 시세나 평소가가 없는 날에서 끊는다.
 */
export function spikesOf(trend: readonly TrendPoint[], band: VerdictBand): Spike[] {
  const spikes: Spike[] = []
  let run: Spike | undefined
  for (const { date, price, usual } of trend) {
    const verdict = price == null || usual == null ? null : verdictOf(price, usual, band)
    const spike: Spike | undefined =
      price != null && usual != null && verdict?.pct != null && (verdict.kind === "cheap" || verdict.kind === "pricey")
        ? { date, price, usual, kind: verdict.kind, pct: verdict.pct }
        : undefined
    if (spike && run && run.kind === spike.kind) {
      if (Math.abs(spike.pct) > Math.abs(run.pct)) run = spike
      continue
    }
    if (run) spikes.push(run)
    run = spike
  }
  if (run) spikes.push(run)
  return spikes
}
