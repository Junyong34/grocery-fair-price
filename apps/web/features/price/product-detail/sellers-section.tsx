import { priceAxis } from "@workspace/price/axis"
import { CHANNEL_NAME, PRICE_COPY } from "@workspace/price/copy"
import { won } from "@workspace/price/format"
import type { ProductDetail } from "@workspace/price/types"

const COPY = PRICE_COPY.product

/** 판매처별 중간값(싼 순). 점은 판매처 중간값, 점선은 전국 판매가다. */
export function SellersSection({ product }: { product: ProductDetail }) {
  if (product.sellers.length === 0) return null

  const axis = priceAxis(
    [...product.sellers.map((seller) => seller.price), product.price],
    { pad: 0.08 }
  )
  const reference = `${axis.at(product.price) * 100}%`

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
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-b border-hairline py-2.5 text-[13px] leading-relaxed text-stone">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-2 rounded-full bg-ink" />
            판매처 중간값
          </span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="h-3 border-s border-dashed border-stone"
            />
            {COPY.nationalPrice}
          </span>
        </div>
        <ul className="divide-y divide-hairline">
          {product.sellers.map((seller) => (
            <li
              key={seller.seller}
              className="grid grid-cols-[minmax(0,1fr)_minmax(5rem,32%)] items-start gap-x-3 py-3"
            >
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
              <div className="flex min-w-0 flex-col gap-2">
                <p className="text-end text-base leading-snug font-semibold tabular-nums">
                  {won(seller.price)}원
                </p>
                <div
                  aria-hidden
                  className="relative mx-1 h-1.5 rounded-full bg-hairline"
                >
                  <span
                    className="absolute -inset-y-0.5 border-s border-dashed border-stone"
                    style={{ insetInlineStart: reference }}
                  />
                  <span
                    className="absolute top-1/2 -ms-1 size-2 -translate-y-1/2 rounded-full bg-ink"
                    style={{
                      insetInlineStart: `${axis.at(seller.price) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
