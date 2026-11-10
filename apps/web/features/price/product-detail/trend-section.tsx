import { ArrowDownRight, ArrowUpRight, ChevronDown, Minus } from "lucide-react"

import { PRICE_COPY } from "@workspace/price/copy"
import { monthDay, won } from "@workspace/price/format"
import type { ProductDetail } from "@workspace/price/types"

import { TrendExplorer } from "./trend-explorer"
import { trendStats } from "./trend-scale"

const COPY = PRICE_COPY.product

/**
 * 최근 조사 가격. 참가격이 조사한 날만 표시하고, 가로축은 실제 조사일 간격을 따른다.
 * 위는 고른 조사일(기본은 마지막)의 값, 가운데는 추이 그림과 기간 평균 기준선, 아래는 기간 최고 · 평균 · 최저와 조사일별 표.
 */
export function TrendSection({
  product,
}: {
  product: Pick<ProductDetail, "trend">
}) {
  const points = product.trend
  const stats = trendStats(points)
  if (!stats) return null
  const { first, last } = stats
  const several = points.length > 1
  const summary = COPY.trendSummary({
    from: first.date,
    to: last.date,
    count: points.length,
    first: first.median,
    last: last.median,
    high: stats.high.value,
    low: stats.low.value,
    average: stats.average,
    lastMin: last.min,
  })
  const ChangeIcon =
    stats.change < 0 ? ArrowDownRight : stats.change > 0 ? ArrowUpRight : Minus

  return (
    <section aria-labelledby="trend-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id="trend-title"
          className="text-xl leading-snug font-semibold text-ink sm:text-[22px]"
        >
          {COPY.trendTitle}
        </h2>
        <p className="text-[13px] leading-relaxed text-caption tabular-nums">
          <time dateTime={first.date}>{monthDay(first.date)}</time>
          {several && (
            <>
              –<time dateTime={last.date}>{monthDay(last.date)}</time>
            </>
          )}
          {" · "}
          {points.length}회 조사
        </p>
      </div>
      <div className="flex flex-col gap-5 rounded-3xl bg-pair-muted p-4 text-pair-muted-foreground sm:p-6">
        <TrendExplorer
          points={points}
          average={stats.average}
          summary={summary}
        />
        {several && (
          <>
            <div className="flex flex-col gap-3 border-t border-hairline pt-4">
              <h3 className="text-sm font-semibold">{COPY.trendStatsTitle}</h3>
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <ChangeIcon
                  aria-hidden
                  size={16}
                  strokeWidth={2.2}
                  className="shrink-0"
                />
                {COPY.trendChange(stats.change)}
              </p>
              <dl className="grid grid-cols-3 gap-x-3 text-[13px] leading-snug tabular-nums">
                <Stat
                  label={COPY.trendStats.high}
                  value={stats.high.value}
                  date={stats.high.date}
                />
                <Stat label={COPY.trendStats.average} value={stats.average}>
                  <span
                    aria-hidden
                    className="w-3.5 border-t-2 border-dotted border-stone"
                  />
                </Stat>
                <Stat
                  label={COPY.trendStats.low}
                  value={stats.low.value}
                  date={stats.low.date}
                />
              </dl>
            </div>
            <details className="group border-t border-hairline">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-sm text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
                조사일별 가격 보기
                <ChevronDown
                  aria-hidden
                  className="size-4 shrink-0 text-stone group-open:rotate-180"
                />
              </summary>
              <table className="mt-1 w-full border-collapse text-sm tabular-nums">
                <caption className="sr-only">최근 조사일별 판매가</caption>
                <thead className="text-stone">
                  <tr>
                    <th
                      scope="col"
                      className="py-2 pe-2 text-start font-medium"
                    >
                      조사일
                    </th>
                    <th scope="col" className="py-2 pe-2 text-end font-medium">
                      {COPY.trendLegend.median}
                    </th>
                    <th scope="col" className="py-2 text-end font-medium">
                      {COPY.trendLegend.min}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...points].reverse().map((point) => (
                    <tr key={point.date} className="border-t border-hairline">
                      <th
                        scope="row"
                        className="py-2 pe-2 text-start font-medium"
                      >
                        <time dateTime={point.date}>{point.date}</time>
                      </th>
                      <td className="py-2 pe-2 text-end">
                        {won(point.median)}원
                      </td>
                      <td className="py-2 text-end">{won(point.min)}원</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        )}
      </div>
    </section>
  )
}

function Stat({
  label,
  value,
  date,
  children,
}: {
  label: string
  value: number
  date?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="flex items-center gap-1.5 text-stone">
        {children}
        {label}
      </dt>
      <dd className="flex flex-col gap-0.5">
        <span className="font-number text-lg leading-tight">
          {won(value)}원
        </span>
        {date && (
          <time dateTime={date} className="text-xs text-stone">
            {monthDay(date)}
          </time>
        )}
      </dd>
    </div>
  )
}
