"use client"

import { cn } from "@workspace/ui/lib/utils"

import { PRICE_COPY } from "@workspace/price/copy"
import { won } from "@workspace/price/format"
import type { VarietyDetail } from "@workspace/price/types"
import { verdictOf } from "@workspace/price/verdict"

import { VERDICT_TONE } from "../components/verdict-tone"
import { useMyPrice } from "./my-price"

const COPY = PRICE_COPY.detail

/** 값 → 막대 위 자리(%). 양 끝 여백을 두고 범위를 넘으면 끝에 붙인다. */
function scale(values: readonly number[]) {
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const pad = (hi - lo) * 0.08 || lo * 0.1 || 1
  return (v: number) => Math.min(100, Math.max(0, ((v - (lo - pad)) / (hi - lo + 2 * pad)) * 100))
}

/** 핀 이름표는 막대 밖으로 나가지 않게 가장자리에서 안쪽으로 민다. */
const labelLeft = (x: number) => `clamp(2.5rem, ${x}%, calc(100% - 2.5rem))`

/**
 * P3 조사 범위 막대: 그날 조사한 곳들의 시세 범위(싼 곳 ~ 비싼 곳), 평소 범위 띠, 평소가 눈금, 시세 핀,
 * "내가 본 가격"을 적으면 그 핀. 평소가가 없으면 평소 범위 띠와 눈금을 그리지 않는다.
 */
export function RangeBar({ detail }: { detail: VarietyDetail }) {
  const mine = useMyPrice(detail.id)
  const { range, usual, band } = detail
  const usualLow = usual == null ? null : usual * (1 + band.lower / 100)
  const usualHigh = usual == null ? null : usual * (1 + band.upper / 100)
  const x = scale([range.min, range.max, detail.price, ...[usualLow, usualHigh, mine].filter((v): v is number => v != null)])
  const mineVerdict = mine == null ? null : verdictOf(mine, usual, band)

  return (
    <section aria-label={COPY.rangeTitle(detail.surveyedOn, range.n)} className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between text-[13px]">
        <span className="font-semibold text-ink">{COPY.rangeTitle(detail.surveyedOn, range.n)}</span>
        <span className="text-caption">{detail.baseUnit}</span>
      </div>
      <div className={cn("relative h-11", mine != null ? "mb-9" : "mb-1")}>
        {/* 바탕 줄 */}
        <div className="absolute inset-x-0 top-8 h-3 rounded-full bg-hairline" />
        {/* 평소 범위 띠와 평소가 눈금 */}
        {usualLow != null && usualHigh != null && usual != null && (
          <>
            <div
              className="absolute top-7 h-5 rounded-md border border-verdict-normal/40 bg-verdict-normal-wash"
              style={{ left: `${x(usualLow)}%`, width: `${x(usualHigh) - x(usualLow)}%` }}
            />
            <div className="absolute top-6 h-7 border-l-2 border-dashed border-stone" style={{ left: `${x(usual)}%` }} />
          </>
        )}
        {/* 조사 범위 */}
        <div
          className="absolute top-[34px] h-2 rounded-full bg-stone/45"
          style={{ left: `${x(range.min)}%`, width: `${x(range.max) - x(range.min)}%` }}
        />
        {/* 시세 핀 */}
        <Pin x={x(detail.price)} className={VERDICT_TONE[detail.verdict.kind].fill} label={COPY.rangePin(won(detail.price))} above />
        {mine != null && mineVerdict && (
          <Pin
            x={x(mine)}
            ring
            className={VERDICT_TONE[mineVerdict.kind].border}
            labelClassName={VERDICT_TONE[mineVerdict.kind].solid}
            label={COPY.rangeMine(won(mine))}
          />
        )}
      </div>
      <div className="flex justify-between gap-2 text-xs text-caption tabular-nums">
        <span>
          {COPY.rangeLow} <b className="font-semibold text-ink">{won(range.min)}</b>
        </span>
        {usual != null && <span className="text-center">┆ {COPY.rangeUsual(won(usual))}</span>}
        <span>
          {COPY.rangeHigh} <b className="font-semibold text-ink">{won(range.max)}</b>
        </span>
      </div>
    </section>
  )
}

function Pin({
  x,
  label,
  className,
  labelClassName,
  above,
  ring,
}: {
  x: number
  label: string
  className: string
  /** 이름표 색. 없으면 위 핀은 잉크, 아래 핀은 흰 바탕 */
  labelClassName?: string
  above?: boolean
  ring?: boolean
}) {
  return (
    <>
      <span
        aria-hidden
        className={cn(
          "absolute top-[38px] size-4 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-sm",
          ring ? "border-[3px] bg-surface" : "border-2 border-surface",
          className
        )}
        style={{ left: `${x}%` }}
      />
      <span
        className={cn(
          "absolute -translate-x-1/2 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap tabular-nums",
          above ? "top-0" : "top-[52px] shadow-sm",
          labelClassName ?? (above ? "bg-ink text-canvas" : "border border-silver bg-surface text-ink")
        )}
        style={{ left: labelLeft(x) }}
      >
        {label}
      </span>
    </>
  )
}
