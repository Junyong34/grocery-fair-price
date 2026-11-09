import { priceAxis } from "@workspace/price/axis"
import { PRICE_COPY } from "@workspace/price/copy"
import { monthDay, won } from "@workspace/price/format"
import type { ProductDetail } from "@workspace/price/types"

const COPY = PRICE_COPY.product

// SVG 좌표(viewBox). 폭은 부모에 맞춰 늘고(preserveAspectRatio none), 글자는 SVG 밖 HTML로 둔다
const W = 320
const H = 96
const PAD = 6

/** 최근 조사일들의 전국 판매가(실선)와 가장 싼 곳(점선). 참가격은 2주마다 조사하니 점이 듬성하다. 조사일이 둘 이상일 때만 그린다. */
export function TrendSection({ product }: { product: ProductDetail }) {
  const points = product.trend
  if (points.length < 2) return null
  const axis = priceAxis(points.flatMap((p) => [p.median, p.min]), { pad: 0.1 })
  const x = (i: number) => PAD + (i / (points.length - 1)) * (W - PAD * 2)
  const y = (v: number) => PAD + (1 - axis.at(v)) * (H - PAD * 2)
  const line = (pick: (p: (typeof points)[number]) => number) => points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(pick(p))}`).join("")
  const first = points[0]!
  const last = points.at(-1)!
  return (
    <section aria-labelledby="trend-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id="trend-title" className="text-[17px] font-semibold text-ink">
          {COPY.trendTitle}
        </h2>
        <span className="flex items-center gap-1.5 text-xs text-caption">
          <span aria-hidden className="inline-block h-0.5 w-4 bg-ink" />
          {COPY.trendLegend.median}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-caption">
          <span aria-hidden className="inline-block w-4 border-t border-dashed border-stone" />
          {COPY.trendLegend.min}
        </span>
      </div>
      <div className="rounded-2xl bg-mat p-3">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-28 w-full" role="img" aria-label={`${COPY.trendTitle}: ${monthDay(first.date)} ${won(first.median)}원에서 ${monthDay(last.date)} ${won(last.median)}원`}>
          <path d={line((p) => p.min)} fill="none" className="stroke-stone" strokeWidth={1.5} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
          <path d={line((p) => p.median)} fill="none" className="stroke-ink" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="mt-1 flex justify-between text-xs text-caption tabular-nums">
          <span>
            {monthDay(first.date)} · {won(first.median)}원
          </span>
          <span>
            {monthDay(last.date)} · {won(last.median)}원
          </span>
        </div>
      </div>
    </section>
  )
}
