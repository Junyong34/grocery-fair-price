import { ChevronDown } from "lucide-react"

import { priceAxis } from "@workspace/price/axis"
import { PRICE_COPY } from "@workspace/price/copy"
import { daysBetween, monthDay, won } from "@workspace/price/format"
import type { ProductDetail } from "@workspace/price/types"

const COPY = PRICE_COPY.product
type Point = ProductDetail["trend"][number]

/** 참가격이 조사한 날만 표시하고, 가로축은 실제 조사일 간격을 따른다. */
export function TrendSection({
  product,
}: {
  product: Pick<ProductDetail, "trend">
}) {
  const points = product.trend
  const first = points[0]
  const last = points.at(-1)
  if (!first || !last) return null

  const elapsedDays = daysBetween(first.date, last.date)

  return (
    <section aria-labelledby="trend-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id="trend-title"
          className="text-xl leading-tight font-semibold text-ink sm:text-[22px]"
        >
          {COPY.trendTitle}
        </h2>
        <p className="text-sm text-caption tabular-nums">
          <time dateTime={first.date}>{monthDay(first.date)}</time>
          {elapsedDays > 0 && (
            <>
              –<time dateTime={last.date}>{monthDay(last.date)}</time>
            </>
          )}
          {" · "}
          {points.length}회 조사
        </p>
      </div>
      <div className="flex flex-col gap-5 rounded-3xl bg-pair-muted p-4 text-pair-muted-foreground sm:gap-6 sm:p-6">
        <div>
          <p className="mb-2 text-xs font-medium text-stone">최근 조사값</p>
          <dl className="flex flex-wrap gap-x-8 gap-y-2">
            <div className="flex flex-col gap-0.5">
              <dt className="flex items-center gap-2 text-sm text-stone">
                <span aria-hidden className="w-4 border-t-2 border-gold-deep" />
                {COPY.trendLegend.median}
              </dt>
              <dd className="font-number text-2xl leading-tight tabular-nums">
                {won(last.median)}원
              </dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="flex items-center gap-2 text-sm text-stone">
                <span
                  aria-hidden
                  className="w-4 border-t-2 border-dashed border-olive"
                />
                {COPY.trendLegend.min}
              </dt>
              <dd className="font-number text-2xl leading-tight tabular-nums">
                {won(last.min)}원
              </dd>
            </div>
          </dl>
        </div>
        {elapsedDays > 0 && (
          <>
            <SurveyPlot
              points={points}
              first={first}
              last={last}
              elapsedDays={elapsedDays}
            />
            <details className="group border-t border-hairline">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-sm text-sm font-semibold hover:text-gold-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-deep [&::-webkit-details-marker]:hidden">
                조사일별 가격 보기
                <ChevronDown
                  aria-hidden
                  className="size-4 shrink-0 group-open:rotate-180"
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

function SurveyPlot({
  points,
  first,
  last,
  elapsedDays,
}: {
  points: readonly Point[]
  first: Point
  last: Point
  elapsedDays: number
}) {
  const axis = priceAxis(
    points.flatMap(({ median, min }) => [median, min]),
    { pad: 0.08, ticks: 3 }
  )
  const base = axis.at(0)
  const x = (date: string) =>
    (100 * daysBetween(first.date, date)) / elapsedDays
  const y = (value: number) => (100 * (1 - axis.at(value))) / (1 - base)
  const ticks = axis.ticks.filter((tick) => tick >= 0 && Number.isInteger(tick))
  const line = (key: "median" | "min") =>
    points
      .map(
        (point, index) =>
          `${index ? "L" : "M"}${x(point.date)},${y(point[key])}`
      )
      .join("")

  return (
    <div
      role="img"
      aria-label="조사일별 전국 판매가와 최저가 추이"
      dir="ltr"
      className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-2 text-xs text-stone tabular-nums"
    >
      <span aria-hidden className="col-span-2">
        단위: 원
      </span>
      <div aria-hidden className="relative self-stretch text-end">
        <span className="invisible">{won(axis.max)}</span>
        {ticks.map((tick) => (
          <span
            key={tick}
            className="absolute end-0 -translate-y-1/2"
            style={{ top: `${y(tick)}%` }}
          >
            {won(tick)}
          </span>
        ))}
      </div>
      <div aria-hidden className="relative">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="block h-36 w-full overflow-visible sm:h-48"
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
          <path
            d={line("median")}
            fill="none"
            className="stroke-gold-deep"
            strokeWidth="2.5"
            strokeLinejoin="round"
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
        </svg>
        {points.map((point) => (
          <span
            key={point.date}
            className="absolute inset-y-0"
            style={{ left: `${x(point.date)}%` }}
          >
            <span
              className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-olive bg-pair-muted"
              style={{ top: `${y(point.min)}%` }}
            />
            <span
              className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-deep"
              style={{ top: `${y(point.median)}%` }}
            />
          </span>
        ))}
      </div>
      <div aria-hidden className="col-start-2 flex justify-between gap-2">
        <time dateTime={first.date}>{monthDay(first.date)}</time>
        <time dateTime={last.date}>{monthDay(last.date)}</time>
      </div>
    </div>
  )
}
