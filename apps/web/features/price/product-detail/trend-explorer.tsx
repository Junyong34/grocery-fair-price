"use client"

import { useState } from "react"

import { cn } from "@workspace/ui/lib/utils"

import { priceAxis } from "@workspace/price/axis"
import { PRICE_COPY } from "@workspace/price/copy"
import { daysBetween, monthDay, won } from "@workspace/price/format"
import type { ProductDetail } from "@workspace/price/types"

import { nearestIndex, spacedIndexes } from "./trend-scale"

const COPY = PRICE_COPY.product
type Point = ProductDetail["trend"][number]

/** 가로축 날짜 표시 사이 최소 간격(그림 폭 %). 좁은 화면은 넓게 띄운다. */
const LABEL_GAP = { narrow: 18, wide: 9 }

/**
 * 최근 조사 가격의 값 읽기 줄과 추이 그림. 기본은 마지막 조사일을 강조하고,
 * 그림 위를 가리키거나(터치는 가로로 끌기) 키보드 ←→로 조사일을 고르면 위 숫자가 그 날 값으로 바뀐다.
 */
export function TrendExplorer({
  points,
  average,
  summary,
}: {
  points: readonly Point[]
  average: number
  summary: string
}) {
  const lastIndex = points.length - 1
  const [picked, setPicked] = useState<number | null>(null)
  const active = picked ?? lastIndex
  const point = points[active]
  if (!point) return null
  const isLatest = active === lastIndex

  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="text-[13px] leading-snug font-semibold text-stone tabular-nums">
          {isLatest ? "최근 조사" : "고른 조사일"} ·{" "}
          <time dateTime={point.date}>{monthDay(point.date)}</time>
        </p>
        <dl className="flex flex-wrap gap-x-8 gap-y-2">
          <Readout label={COPY.trendLegend.median} value={point.median} lead>
            <span aria-hidden className="w-4 border-t-2 border-gold-deep" />
          </Readout>
          <Readout label={COPY.trendLegend.min} value={point.min}>
            <span
              aria-hidden
              className="w-4 border-t-2 border-dashed border-olive"
            />
          </Readout>
        </dl>
      </div>
      {points.length > 1 && (
        <Plot
          points={points}
          average={average}
          summary={summary}
          active={active}
          onPick={setPicked}
        />
      )}
    </>
  )
}

function Readout({
  label,
  value,
  lead = false,
  children,
}: {
  label: string
  value: number
  lead?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="flex items-center gap-2 text-sm text-stone">
        {children}
        {label}
      </dt>
      <dd className="flex items-baseline gap-0.5 tabular-nums">
        <span
          className={cn(
            "font-number",
            lead ? "text-[1.75rem] sm:text-3xl" : "text-2xl",
            "leading-tight"
          )}
        >
          {won(value)}
        </span>
        <span className="text-base font-semibold">원</span>
      </dd>
    </div>
  )
}

function Plot({
  points,
  average,
  summary,
  active,
  onPick,
}: {
  points: readonly Point[]
  average: number
  summary: string
  active: number
  onPick: (index: number | null) => void
}) {
  const first = points[0]!
  const elapsed = Math.max(1, daysBetween(first.date, points.at(-1)!.date))
  const axis = priceAxis(
    [...points.flatMap(({ median, min }) => [median, min]), average],
    { pad: 0.08, ticks: 3 }
  )
  // 0원은 늘 바닥에 둔다(축이 0 아래로 넓어져도 음수 영역은 그리지 않는다).
  const base = axis.at(0)
  const x = (date: string) => (100 * daysBetween(first.date, date)) / elapsed
  const y = (value: number) => (100 * (1 - axis.at(value))) / (1 - base)
  const ticks = axis.ticks.filter((tick) => tick >= 0 && Number.isInteger(tick))
  const xs = points.map((point) => x(point.date))
  const wide = spacedIndexes(xs, LABEL_GAP.wide)
  const narrow = new Set(spacedIndexes(xs, LABEL_GAP.narrow))
  const line = (key: "median" | "min") =>
    points
      .map(
        (point, index) => `${index ? "L" : "M"}${xs[index]},${y(point[key])}`
      )
      .join("")
  const current = points[active]!
  const lastIndex = points.length - 1

  const pickAt = (event: React.PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    if (box.width === 0) return
    onPick(nearestIndex(xs, (100 * (event.clientX - box.left)) / box.width))
  }
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const next =
      event.key === "ArrowLeft" || event.key === "ArrowDown"
        ? active - 1
        : event.key === "ArrowRight" || event.key === "ArrowUp"
          ? active + 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? lastIndex
              : null
    if (next == null) return
    event.preventDefault()
    onPick(Math.min(lastIndex, Math.max(0, next)))
  }

  return (
    <figure className="m-0 flex flex-col gap-2">
      <figcaption className="sr-only">{summary}</figcaption>
      <div
        dir="ltr"
        className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2.5 gap-y-1.5 text-xs text-stone tabular-nums"
      >
        <span aria-hidden className="text-end">
          원
        </span>
        <span aria-hidden />
        <div aria-hidden className="relative self-stretch text-end">
          {/* 가장 긴 눈금 값으로 열 폭을 잡는다 */}
          <span className="invisible">{won(axis.max)}</span>
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute end-0 -translate-y-1/2 leading-none"
              style={{ top: `${y(tick)}%` }}
            >
              {won(tick)}
            </span>
          ))}
        </div>
        <div
          role="slider"
          tabIndex={0}
          aria-label="조사일 고르기"
          aria-valuemin={1}
          aria-valuemax={points.length}
          aria-valuenow={active + 1}
          aria-valuetext={`${monthDay(current.date)} ${COPY.trendLegend.median} ${won(current.median)}원, ${COPY.trendLegend.min} ${won(current.min)}원`}
          onPointerDown={pickAt}
          onPointerMove={pickAt}
          onPointerLeave={(event) => {
            if (event.pointerType === "mouse") onPick(null)
          }}
          onKeyDown={onKeyDown}
          onBlur={() => onPick(null)}
          className="relative h-40 touch-pan-y rounded-sm outline-offset-4 select-none focus-visible:outline-2 focus-visible:outline-ring sm:h-52"
        >
          <svg
            aria-hidden
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 block size-full overflow-visible"
          >
            {ticks.map((tick) => (
              <line
                key={tick}
                x1="0"
                x2="100"
                y1={y(tick)}
                y2={y(tick)}
                className="stroke-hairline"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {/* 기간 평균(전국 판매가) 기준선 */}
            <line
              x1="0"
              x2="100"
              y1={y(average)}
              y2={y(average)}
              className="stroke-stone"
              strokeWidth="1"
              strokeDasharray="1 3"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            {/* 고른 조사일 세로선 */}
            <line
              x1={xs[active]}
              x2={xs[active]}
              y1="0"
              y2="100"
              className="stroke-stone"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={line("min")}
              fill="none"
              className="stroke-olive"
              strokeWidth="2"
              strokeDasharray="4 4"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={line("median")}
              fill="none"
              className="stroke-gold-deep"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {points.map((point, index) => {
            const on = index === active
            return (
              <span
                key={point.date}
                aria-hidden
                className="absolute inset-y-0"
                style={{ left: `${xs[index]}%` }}
              >
                <span
                  className={cn(
                    "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-mat bg-olive",
                    on ? "size-3" : "size-2"
                  )}
                  style={{ top: `${y(point.min)}%` }}
                />
                <span
                  className={cn(
                    "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-mat bg-gold-deep",
                    on ? "size-4 border-[3px]" : "size-2.5 border-2"
                  )}
                  style={{ top: `${y(point.median)}%` }}
                />
              </span>
            )
          })}
        </div>
        <span aria-hidden />
        <div aria-hidden className="relative h-4">
          {wide.map((index) => (
            <time
              key={points[index]!.date}
              dateTime={points[index]!.date}
              className={cn(
                "absolute top-0 leading-none whitespace-nowrap",
                index === 0
                  ? "translate-x-0"
                  : index === lastIndex
                    ? "-translate-x-full"
                    : "-translate-x-1/2",
                index === active && "font-semibold text-ink",
                !narrow.has(index) && "max-sm:hidden"
              )}
              style={{ left: `${xs[index]}%` }}
            >
              {monthDay(points[index]!.date)}
            </time>
          ))}
        </div>
      </div>
    </figure>
  )
}
