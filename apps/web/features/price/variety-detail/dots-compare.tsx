import { cn } from "@workspace/ui/lib/utils"

import { priceAxis } from "@workspace/price/axis"
import { MARKET_TYPE_NAME, PRICE_COPY } from "@workspace/price/copy"
import { daysBetween, won } from "@workspace/price/format"
import { placesByType } from "@workspace/price/places"
import type { VarietyDetail } from "@workspace/price/types"
import { usualRange } from "@workspace/price/verdict"

const COPY = PRICE_COPY.detail

type DotRow = { key: string; label: string; sub?: string; values: readonly number[]; value: number; shelf?: boolean; promo?: boolean }
type DotGroup = { title: string; rows: readonly DotRow[] }

const median = (values: readonly number[]) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[sorted.length >> 1]!
}

/**
 * "왜 이 판정일까?" 안의 점 비교. 판매가가 있는 품종은 업태별 시세와 판매처별 판매가(참가격)를,
 * 없는 품종은 조사 시장별 시세 점을 평소 범위 띠 위에 놓는다. 점은 판정 색을 쓰지 않는다(장소 비교, judgment.md 0장 ①).
 */
export function DotsCompare({ detail }: { detail: VarietyDetail }) {
  const groups: DotGroup[] = detail.shelf
    ? [
        {
          title: COPY.shelfGroupQuote(detail.surveyedOn),
          rows: detail.marketTypes.map((q) => ({
            key: q.type,
            label: MARKET_TYPE_NAME[q.type],
            sub: COPY.places(q.n),
            values: [q.median],
            value: q.median,
          })),
        },
        {
          title: COPY.shelfGroupShelf(detail.shelf.surveyedOn),
          rows: detail.shelf.prices.map((s) => ({ key: s.seller, label: s.seller, values: [s.price], value: s.price, shelf: true, promo: s.promo != null })),
        },
      ]
    : (() => {
        const { large_retail, traditional } = placesByType(detail.places)
        const row = (key: string, label: string, values: readonly number[]): DotRow => ({ key, label, sub: COPY.places(values.length), values, value: median(values) })
        return [
          { title: COPY.martsTitle, rows: large_retail.map((p) => row(p.name, p.name, p.samples)) },
          { title: COPY.marketsTitle, rows: traditional.length ? [row("traditional", COPY.marketsTitle, traditional.map((p) => p.price))] : [] },
        ].filter((group) => group.rows.length)
      })()

  const usual = detail.usual
  const usualBand = usualRange(usual, detail.band)
  const axis = priceAxis([...groups.flatMap((g) => g.rows.flatMap((r) => r.values)), ...(usualBand ? [usualBand.low, usualBand.high] : [])], { pad: 0.06 })
  const x = (v: number) => axis.at(v) * 100

  return (
    <div className="flex flex-col gap-3">
      <h3 className="flex items-baseline gap-2 text-[15px] font-semibold text-ink">
        {detail.shelf ? COPY.shelfTitle : COPY.marketDotsTitle}
        <small className="text-xs font-normal text-caption">
          {detail.shelf ? COPY.shelfSub(detail.baseUnit) : COPY.marketDotsSub(detail.surveyedOn, detail.baseUnit)}
        </small>
      </h3>
      <div className="flex flex-col gap-3">
        {groups.map((group) => (
          <div key={group.title} className="flex flex-col">
            <p className="pb-1 text-xs font-semibold text-stone">{group.title}</p>
            {group.rows.map((row) => (
              <div key={row.key} className="grid h-8 grid-cols-[5.5rem_minmax(0,1fr)_4.5rem] items-center gap-x-2 text-[13px]">
                <span className="truncate text-ink">
                  {row.label}
                  {row.sub && <small className="ml-1 text-[11px] text-caption">{row.sub}</small>}
                </span>
                <span aria-hidden className="relative h-full">
                  {usualBand && (
                    <span
                      className="absolute inset-y-0 bg-verdict-normal-wash"
                      style={{ left: `${x(usualBand.low)}%`, width: `${x(usualBand.high) - x(usualBand.low)}%` }}
                    />
                  )}
                  {usual != null && <span className="absolute inset-y-0 border-l border-dashed border-ash" style={{ left: `${x(usual)}%` }} />}
                  <span className="absolute inset-x-0 top-1/2 border-t border-hairline" />
                  {row.values.map((v, i) => (
                    <span
                      key={i}
                      className={cn(
                        "absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2",
                        row.shelf ? "rounded-[3px] border-2 border-ink bg-surface" : "rounded-full bg-ink/70"
                      )}
                      style={{ left: `${x(v)}%` }}
                    />
                  ))}
                </span>
                <span className="justify-self-end font-semibold text-ink tabular-nums">
                  {won(row.value)}
                  {row.promo && <small className="ml-1 rounded bg-gold-wash px-1 text-[10px] font-semibold text-gold-deep">{COPY.promo}</small>}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone">
        <li className="inline-flex items-center gap-1.5">
          <i aria-hidden className="block size-2.5 rounded-full bg-ink/70" />
          {detail.shelf ? COPY.dotLegend.quote : COPY.dotLegend.market}
        </li>
        {detail.shelf && (
          <li className="inline-flex items-center gap-1.5">
            <i aria-hidden className="block size-2.5 rounded-[3px] border-2 border-ink bg-surface" />
            {COPY.dotLegend.shelf}
          </li>
        )}
        {usual != null && (
          <li className="inline-flex items-center gap-1.5">
            <i aria-hidden className="block h-2.5 w-4 rounded-sm bg-verdict-normal-wash" />
            {COPY.dotLegend.band}
          </li>
        )}
      </ul>
      <p className="text-xs leading-relaxed text-caption">
        {detail.shelf
          ? COPY.shelfLag(detail.shelf.surveyedOn, detail.surveyedOn, daysBetween(detail.shelf.surveyedOn, detail.surveyedOn))
          : COPY.marketDotsNote}
      </p>
    </div>
  )
}
