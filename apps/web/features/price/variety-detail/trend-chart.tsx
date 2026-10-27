"use client"

import { useEffect, useId, useRef, useState } from "react"

import { Segmented } from "@workspace/ui/components/segmented"
import { cn } from "@workspace/ui/lib/utils"

import { priceAxis } from "@workspace/price/axis"
import { PRICE_COPY } from "@workspace/price/copy"
import { daysBetween, monthDay, won } from "@workspace/price/format"
import { spikesOf, trendWindow, type Spike } from "@workspace/price/trend"
import type { VarietyDetail } from "@workspace/price/types"
import { usualRange } from "@workspace/price/verdict"

import { VERDICT_TONE } from "../components/verdict-tone"

const COPY = PRICE_COPY.detail
type Range = (typeof COPY.trendTabs)[number]["value"]

const H = 240
const M = { l: 44, r: 12, t: 30, b: 24 }

/** 그릴 폭(px). 서버와 첫 렌더는 기본값, 마운트 뒤 실제 폭으로 다시 그린다. */
function useWidth(initial: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(initial)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => entry && setWidth(Math.round(entry.contentRect.width)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

/**
 * P3 가격 추이(1 · 3 · 6개월): 시세 선, 평소 범위 띠, 평소가 점선, 조사일 표시, 급등 · 급락 점,
 * 평년 흐름으로 본 예상(빗금). 평소가가 없으면 시세 선과 조사일만 그린다.
 */
export function TrendChart({ detail }: { detail: VarietyDetail }) {
  const [range, setRange] = useState<Range>("1m")
  const [ref, W] = useWidth(343)
  const [picked, setPicked] = useState<Spike | null>(null)
  const hatch = useId()

  const days = COPY.trendTabs.find((tab) => tab.value === range)!.days
  const past = trendWindow(detail.trend, days)
  const last = past.at(-1)
  if (!last || last.price == null) return null
  const hasUsual = detail.usual != null
  const forecast = hasUsual ? detail.forecast : []
  const spikes = hasUsual ? spikesOf(past, detail.band) : []
  // 평소가가 0 이하인 날은 띠 없이 평소가 한 점으로 둔다.
  const bandOf = (usual: number) => usualRange(usual, detail.band) ?? { low: usual, high: usual }

  const start = past[0]!.date
  const t1 = daysBetween(start, forecast.at(-1)?.date ?? last.date) + (forecast.length ? 0 : 3)
  const values = [
    ...past.flatMap((p) => [p.price, ...(hasUsual && p.usual != null ? [bandOf(p.usual).low, bandOf(p.usual).high] : [])]),
    ...forecast.flatMap((f) => [f.low, f.high]),
  ].filter((v): v is number => v != null)
  const axis = priceAxis(values, { ticks: 4 })
  const x = (date: string) => M.l + (daysBetween(start, date) / t1) * (W - M.l - M.r)
  const y = (v: number) => M.t + (1 - axis.at(v)) * (H - M.t - M.b)

  // 시세 선: 시세가 없는 날에서 끊는다
  const priceLine = past
    .map((p, i) => (p.price == null ? "" : `${i && past[i - 1]!.price != null ? "L" : "M"}${x(p.date)},${y(p.price)}`))
    .join("")
  const withUsual = past.filter((p) => p.usual != null)
  const bandPath = withUsual.length
    ? "M" +
      withUsual.map((p) => `${x(p.date)},${y(bandOf(p.usual!).high)}`).join("L") +
      "L" +
      [...withUsual].reverse().map((p) => `${x(p.date)},${y(bandOf(p.usual!).low)}`).join("L") +
      "Z"
    : ""
  const usualLine = withUsual.length ? "M" + withUsual.map((p) => `${x(p.date)},${y(p.usual!)}`).join("L") : ""
  const fore = forecast.length ? [{ date: last.date, price: last.price, low: last.price, high: last.price }, ...forecast] : []
  const forePath = fore.length
    ? "M" + fore.map((f) => `${x(f.date)},${y(f.high)}`).join("L") + "L" + [...fore].reverse().map((f) => `${x(f.date)},${y(f.low)}`).join("L") + "Z"
    : ""
  const foreLine = fore.length ? "M" + fore.map((f) => `${x(f.date)},${y(f.price)}`).join("L") : ""

  // 날짜 눈금: 1개월은 주마다, 그보다 길면 매달 1일. 이름표가 겹치면(36px 안) 뒤 것을 뺀다.
  const dateTicks = [...past.map((p) => p.date), ...forecast.map((f) => f.date)]
    .filter((date) => {
      const day = Number(date.slice(8))
      return range === "1m" ? [1, 8, 15, 22].includes(day) : day === 1
    })
    .reduce<string[]>((kept, date) => (kept.length && x(date) - x(kept.at(-1)!) < 36 ? kept : [...kept, date]), [])
  const lastTone = VERDICT_TONE[detail.verdict.kind]

  return (
    <div className="flex flex-col gap-3">
      <Segmented
        aria-label="기간"
        options={COPY.trendTabs.map(({ value, label }) => ({ value, label }))}
        value={range}
        onValueChange={(next) => {
          setRange(next)
          setPicked(null)
        }}
        className="w-fit"
      />
      <div ref={ref} className="w-full">
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`${COPY.trendTitle} ${COPY.trendTabs.find((tab) => tab.value === range)!.label}`}
          className="block overflow-visible text-[10.5px] tabular-nums"
        >
          <defs>
            <pattern id={hatch} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="5" className="stroke-ash/50" strokeWidth="1.4" />
            </pattern>
          </defs>
          {axis.ticks.map((v) => (
            <g key={v}>
              <line x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} className="stroke-hairline" />
              <text x={M.l - 6} y={y(v) + 3.5} textAnchor="end" className="fill-caption">
                {won(v)}
              </text>
            </g>
          ))}
          {bandPath && <path d={bandPath} className="fill-verdict-normal-wash" />}
          {usualLine && <path d={usualLine} fill="none" className="stroke-ash" strokeWidth="1.3" strokeDasharray="4 3" />}
          {forePath && (
            <>
              <path d={forePath} fill={`url(#${hatch})`} className="stroke-ash" strokeWidth="1" strokeDasharray="3 2" />
              <path d={foreLine} fill="none" className="stroke-stone" strokeWidth="1.2" strokeDasharray="2 3" opacity="0.7" />
              <text x={W - M.r - 2} y={y(fore.at(-1)!.high) - 6} textAnchor="end" className="fill-stone">
                {COPY.legend.forecast}
              </text>
            </>
          )}
          <path d={priceLine} fill="none" className="stroke-ink" strokeWidth="2" strokeLinejoin="round" />
          {spikes.map((spike) => (
            <g key={spike.date} onClick={() => setPicked(spike)} className="cursor-pointer">
              <circle cx={x(spike.date)} cy={y(spike.price)} r="13" fill="transparent" />
              <circle
                cx={x(spike.date)}
                cy={y(spike.price)}
                r="4.5"
                className={cn(spike.kind === "pricey" ? "fill-verdict-pricey" : "fill-verdict-cheap", "stroke-surface")}
                strokeWidth="1.5"
              />
            </g>
          ))}
          <line x1={x(last.date)} x2={x(last.date)} y1={M.t - 6} y2={H - M.b} className="stroke-ink" />
          <rect x={x(last.date) - 29} y={M.t - 24} width="58" height="16" rx="8" className="fill-ink" />
          <text x={x(last.date)} y={M.t - 12.5} textAnchor="middle" className="fill-canvas font-bold">
            {monthDay(last.date)} 조사
          </text>
          <circle
            cx={x(last.date)}
            cy={y(last.price)}
            r="6.5"
            className={cn(hasUsual ? lastTone.svg : "fill-ink", "stroke-surface")}
            strokeWidth="2.5"
          />
          {dateTicks.map((date) => (
            <text key={date} x={x(date)} y={H - 6} textAnchor="middle" className="fill-caption">
              {monthDay(date)}
            </text>
          ))}
        </svg>
      </div>
      <p aria-live="polite" className="min-h-5 text-sm text-ink">
        {picked && (
          <>
            <b className="font-semibold">
              {monthDay(picked.date)} {won(picked.price)}원
            </b>{" "}
            · 평소보다 {Math.abs(picked.pct)}% {picked.kind === "pricey" ? "비쌌던" : "쌌던"} 날
          </>
        )}
      </p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-stone">
        <Legend swatch={<i className="block h-0.5 w-4 bg-ink" />}>{COPY.legend.price}</Legend>
        {hasUsual && (
          <>
            <Legend swatch={<i className="block h-2.5 w-4 rounded-sm bg-verdict-normal-wash" />}>{COPY.legend.band}</Legend>
            <Legend swatch={<i className="block w-4 border-t-[1.5px] border-dashed border-ash" />}>{COPY.legend.usual}</Legend>
            <Legend swatch={<i className="block h-2.5 w-4 rounded-sm border border-dashed border-ash bg-[repeating-linear-gradient(45deg,var(--color-ash)_0_1px,transparent_1px_4px)]" />}>
              {COPY.legend.forecast}
            </Legend>
            <Legend swatch={<i className="block size-2.5 rounded-full bg-verdict-pricey" />}>{COPY.legend.pricey}</Legend>
            <Legend swatch={<i className="block size-2.5 rounded-full bg-verdict-cheap" />}>{COPY.legend.cheap}</Legend>
          </>
        )}
      </ul>
      <p className="text-xs leading-relaxed text-caption">{hasUsual ? COPY.forecastNote : COPY.noUsualTrendNote}</p>
    </div>
  )
}

function Legend({ swatch, children }: { swatch: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <span aria-hidden>{swatch}</span>
      {children}
    </li>
  )
}
