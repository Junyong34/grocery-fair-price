import { CalendarClock, Info } from "lucide-react"
import Link from "next/link"

import { CHANNEL_NAME, PRICE_COPY } from "@workspace/price/copy"
import { won } from "@workspace/price/format"
import type { ProductDetail } from "@workspace/price/types"

import { routes } from "@/shared/routes"

import { ProductHeader, ProductHeaderBar } from "./product-header"
import { SellersSection } from "./sellers-section"
import { TrendSection } from "./trend-section"

const COPY = PRICE_COPY.product

/**
 * 참가격 상품 상세(catalog-scale/10). 판정이 없다: 지금이 비싼 시기인지가 아니라 어디서 싸게 파는지를 견준다.
 * 위는 전국 판매가 · 기준 단위당 가격 · 업태별, 오른쪽(모바일은 아래)은 판매처별, 아래 전체 폭에 최근 조사 추이.
 */
export function ProductView({ product }: { product: ProductDetail }) {
  const sub = [product.category, product.item, product.size].filter(Boolean).join(" · ")
  return (
    <article className="price-page flex flex-col gap-7 pt-3 lg:pt-8">
      <ProductHeader name={product.name} sub={sub} />
      <ProductHeaderBar name={product.name} />
      <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-x-10 lg:gap-y-8">
        <div className="flex min-w-0 flex-col gap-7">
          <PriceCard product={product} />
          {product.channels.length > 0 && (
            <section aria-labelledby="channels-title" className="flex flex-col gap-3">
              <h2 id="channels-title" className="text-[17px] font-semibold text-ink">
                {COPY.channelsTitle}
              </h2>
              <dl className="grid grid-cols-2 gap-2">
                {product.channels.map((c) => (
                  <div key={c.channel} className="flex flex-col gap-1 rounded-2xl bg-mat p-3">
                    <dt className="text-xs font-semibold text-stone">{CHANNEL_NAME[c.channel]}</dt>
                    <dd className="flex items-baseline gap-1.5">
                      <span className="font-number text-[22px] leading-none text-ink tabular-nums">{won(c.median)}원</span>
                      <span className="text-xs text-caption">{COPY.stores(c.stores)}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
        <div className="min-w-0">
          <SellersSection product={product} />
        </div>
        <div className="min-w-0 lg:col-span-2">
          <TrendSection product={product} />
        </div>
      </div>
      <footer className="flex flex-col gap-3 pb-6">
        {product.varietyId && (
          <Link
            href={routes.price.variety(product.varietyId)}
            className="inline-flex h-11 items-center justify-center rounded-full border border-silver text-sm font-semibold text-ink no-underline hover:border-stone"
          >
            {COPY.variety}
          </Link>
        )}
        <p className="text-xs text-caption">{COPY.basis(product.range.stores, product.surveyedOn)}</p>
      </footer>
    </article>
  )
}

function PriceCard({ product }: { product: ProductDetail }) {
  return (
    <section aria-label={COPY.nationalPrice} className="flex flex-col gap-3 rounded-3xl bg-mat p-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-stone">{COPY.nationalPrice}</span>
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-number text-[34px] leading-none text-ink tabular-nums">{won(product.price)}원</span>
          {product.perUnit && (
            <span className="rounded-full bg-canvas/80 px-2 py-0.5 text-[13px] font-semibold text-ink tabular-nums">
              {COPY.perUnit(product.perUnit.unit, product.perUnit.price)}
            </span>
          )}
        </span>
        <span className="text-xs text-caption">{COPY.nationalNote(product.surveyedOn, product.range.stores)}</span>
        <span className="text-xs text-caption tabular-nums">{COPY.range(product.range.min, product.range.max)}</span>
      </div>
      {product.status !== "active" && (
        <Notice
          icon={<CalendarClock aria-hidden size={16} />}
          title={product.status === "discontinued" ? COPY.discontinued : COPY.stale(product.surveyedOn)}
          body={COPY.staleNote}
        />
      )}
      <Notice icon={<Info aria-hidden size={16} />} title={COPY.noVerdict} />
    </section>
  )
}

function Notice({ icon, title, body }: { icon: React.ReactNode; title: string; body?: string }) {
  return (
    <div role="note" className="flex gap-2 rounded-2xl bg-canvas/80 px-3 py-2.5">
      <span className="mt-px shrink-0 text-stone">{icon}</span>
      <p className="flex flex-col gap-0.5">
        <span className="text-[13px] leading-snug font-semibold text-ink">{title}</span>
        {body && <span className="text-xs leading-relaxed text-caption">{body}</span>}
      </p>
    </div>
  )
}
