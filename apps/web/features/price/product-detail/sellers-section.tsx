import { priceAxis } from "@workspace/price/axis"
import { CHANNEL_NAME, PRICE_COPY } from "@workspace/price/copy"
import { won } from "@workspace/price/format"
import type { ProductDetail } from "@workspace/price/types"

const COPY = PRICE_COPY.product

const ROW = "grid grid-cols-[minmax(0,1fr)_minmax(4.5rem,7rem)_5.25rem] items-center gap-x-3"

/**
 * 상품 "어디서 얼마에 팔까": 판매처별 중간값(싼 순). 판정 색을 쓰지 않는다.
 * 위치 막대: 점 = 이 판매처 중간값, 점선 = 전국 판매가. 같은 판매처도 점포마다 값이 다르면 그 범위를 적는다.
 */
export function SellersSection({ product }: { product: ProductDetail }) {
  if (product.sellers.length === 0) return null
  const axis = priceAxis([...product.sellers.map((s) => s.price), product.price])
  const x = (v: number) => axis.at(v) * 100
  return (
    <section aria-labelledby="sellers-title" className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <h2 id="sellers-title" className="text-[17px] font-semibold text-ink">
          {COPY.sellersTitle}
        </h2>
        <span className="text-xs text-caption">{COPY.sellersSub(product.surveyedOn)}</span>
      </div>
      <ul className="border-t border-hairline">
        {product.sellers.map((seller) => (
          <li key={seller.seller} className={ROW + " border-b border-hairline py-2.5"}>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-[15px] font-semibold text-ink">{seller.seller}</span>
                {seller.promo && (
                  <span className="shrink-0 rounded-full bg-gold-wash px-1.5 py-0.5 text-[11px] font-semibold text-espresso">{COPY.promo}</span>
                )}
              </span>
              <span className="truncate text-xs text-caption">
                {CHANNEL_NAME[seller.channel]} · {COPY.stores(seller.stores)}
                {seller.min !== seller.max && ` · ${COPY.storesRange(seller.min, seller.max)}`}
              </span>
            </span>
            <span aria-hidden className="relative h-2 rounded-full bg-hairline">
              <span className="absolute -top-1 -bottom-1 border-l border-dashed border-stone" style={{ left: `${x(product.price)}%` }} />
              <span
                className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink"
                style={{ left: `${x(seller.price)}%` }}
              />
            </span>
            <span className="justify-self-end text-[15px] font-semibold text-ink tabular-nums">{won(seller.price)}원</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-caption">{COPY.sellersNote}</p>
    </section>
  )
}
