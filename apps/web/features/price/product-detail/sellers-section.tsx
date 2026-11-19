import { gapAxis } from "@workspace/price/axis"
import { CHANNEL_NAME, PRICE_COPY } from "@workspace/price/copy"
import { won } from "@workspace/price/format"
import type { ProductDetail } from "@workspace/price/types"

import { GapAxisLabels, GapBar, GapDiff, GapReference } from "../components/gap-bar"

const COPY = PRICE_COPY.product

const ROW = "grid grid-cols-[minmax(0,1fr)_minmax(6.5rem,36%)] gap-x-3"

/**
 * 판매처별 중간값(싼 순)을 전국 판매가와 견준다. 기준 줄에 전국 판매가 금액을 쓰고,
 * 줄마다 차이(↓ 1,780원 낮음)와 기준에서 뻗는 차이 막대(gap-bar)를 둔다.
 */
export function SellersSection({ product }: { product: ProductDetail }) {
  if (product.sellers.length === 0) return null

  const axis = gapAxis(product.sellers.map((seller) => seller.price), product.price)

  return (
    <section
      aria-labelledby="sellers-title"
      className="flex min-w-0 flex-col gap-3"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h2
          id="sellers-title"
          className="text-xl leading-snug font-semibold text-ink sm:text-[22px]"
        >
          {COPY.sellersTitle}
        </h2>
        <p className="text-[13px] leading-relaxed text-caption tabular-nums">
          {COPY.sellersSub(product.surveyedOn)}
        </p>
      </div>
      <div className="rounded-3xl bg-pair-muted px-4 text-pair-muted-foreground">
        <div className={`${ROW} items-end border-b border-hairline py-2.5`}>
          <GapReference label={COPY.nationalPrice} price={product.price} />
          <GapAxisLabels className="mx-1 mb-0.5" />
        </div>
        <ul className="divide-y divide-hairline">
          {product.sellers.map((seller) => (
            <li key={seller.seller} className={`${ROW} items-start py-3`}>
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                  <p className="text-base leading-snug font-semibold [overflow-wrap:anywhere] break-keep">
                    {seller.seller}
                  </p>
                  {seller.promo && (
                    <span className="rounded-full bg-pair-gold px-2 py-0.5 text-xs font-semibold text-pair-gold-foreground">
                      {COPY.promo}
                    </span>
                  )}
                </div>
                <p className="text-[13px] leading-relaxed text-stone tabular-nums">
                  {CHANNEL_NAME[seller.channel]} · {COPY.stores(seller.stores)}
                </p>
                {seller.min !== seller.max && (
                  <p className="text-[13px] leading-relaxed [overflow-wrap:anywhere] text-stone tabular-nums">
                    {COPY.storesRange(seller.min, seller.max)}
                  </p>
                )}
              </div>
              <div className="flex min-w-0 flex-col items-end gap-1.5">
                <p className="text-base leading-snug font-semibold tabular-nums">
                  {won(seller.price)}원
                </p>
                <GapDiff axis={axis} value={seller.price} reference={product.price} />
                <GapBar axis={axis} value={seller.price} className="mt-0.5 w-[calc(100%-0.5rem)] self-center" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
