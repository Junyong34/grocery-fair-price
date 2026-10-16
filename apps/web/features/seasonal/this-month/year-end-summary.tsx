"use client"

import { FOODS } from "@workspace/seasonal/data/foods"
import { AnimatedNumber } from "@workspace/ui/components/animated-number"

import { useEatenIds } from "@/shared/eaten-store"

const TOTAL = FOODS.length

/** 올해 먹음 기록 요약(숫자와 진행 막대). 기록은 기기에 있어 하이드레이션 전에는 0이다. */
export function YearEndSummary({ year }: { year: number }) {
  const count = useEatenIds(year).size
  return (
    <>
      <p className="flex items-baseline gap-2">
        <AnimatedNumber
          value={count}
          // 올라가는 동안에도 정수만 보인다(기본 형식은 소수 셋째 자리까지 그려 폭이 흔들린다).
          format={{ maximumFractionDigits: 0 }}
          className="font-number text-[56px] leading-none tabular-nums"
        />
        <span className="text-sm text-stone">가지 제철을 먹었어요 / {TOTAL}</span>
      </p>
      <div
        role="progressbar"
        aria-label="올해 먹은 제철 비율"
        aria-valuemin={0}
        aria-valuemax={TOTAL}
        aria-valuenow={count}
        className="h-[5px] overflow-hidden rounded-full bg-canvas"
      >
        <div
          className="h-full rounded-full bg-gold transition-[width] duration-400"
          style={{ width: `${(count / TOTAL) * 100}%` }}
        />
      </div>
    </>
  )
}
