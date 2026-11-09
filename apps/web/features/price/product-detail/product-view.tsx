import { CalendarClock, ChevronRight, Info } from "lucide-react"
import Link from "next/link"

import { CHANNEL_NAME, PRICE_COPY } from "@workspace/price/copy"
import { won } from "@workspace/price/format"
import type { ProductDetail } from "@workspace/price/types"

import { routes } from "@/shared/routes"

import { ProductHeader, ProductHeaderBar } from "./product-header"
import { SellersSection } from "./sellers-section"
import { TrendSection } from "./trend-section"

const COPY = PRICE_COPY.product

/** 전국 · 업태별 판매가와 판매처별 비교를 두 열로 두고, 최근 조사 가격은 아래 전체 폭에 둔다. */
export function ProductView({ product }: { product: ProductDetail }) {
  const sub = [product.category, product.item, product.size]
    .filter(Boolean)
    .join(" · ")
  return (
    <article className="price-page flex flex-col gap-7 pt-3 pb-6 lg:gap-9 lg:pt-8">
      <ProductHeader name={product.name} sub={sub} />
      <ProductHeaderBar name={product.name} />
      <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-x-8 lg:gap-y-9">
        <div className="flex min-w-0 flex-col gap-7 lg:gap-8">
          <PriceCard product={product} />
          {product.channels.length > 0 && (
            <ChannelsSection channels={product.channels} />
          )}
        </div>
        <SellersSection product={product} />
        {product.trend.length > 0 && (
          <div className="contents lg:col-span-2 lg:block lg:min-w-0">
            <TrendSection product={product} />
          </div>
        )}
      </div>
      <RelatedLinks item={product.item} varietyId={product.varietyId} />
      <footer className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1 border-t border-hairline pt-3">
        <p className="text-[13px] leading-relaxed text-caption">
          {COPY.basis(product.range.stores, product.surveyedOn)}
        </p>
        <Link
          href={routes.settings.sources}
          className="inline-flex min-h-11 items-center text-sm text-stone underline underline-offset-3 hover:text-ink"
        >
          {PRICE_COPY.detail.sourcesLink}
        </Link>
      </footer>
    </article>
  )
}

function PriceCard({ product }: { product: ProductDetail }) {
  return (
    <section
      aria-labelledby="national-price-title"
      className="flex flex-col gap-4 rounded-3xl bg-pair-muted p-4 text-pair-muted-foreground lg:p-5"
    >
      <div className="flex flex-col gap-1.5">
        <h2 id="national-price-title" className="text-base font-semibold">
          {COPY.nationalPrice}
        </h2>
        <p className="flex items-baseline gap-1 tabular-nums">
          <span className="font-number text-[2.75rem] leading-[1.1] lg:text-5xl">
            {won(product.price)}
          </span>
          <span className="text-lg font-semibold">원</span>
        </p>
        {product.perUnit && (
          <p className="text-sm font-semibold tabular-nums">
            {COPY.perUnit(product.perUnit.unit, product.perUnit.price)}
          </p>
        )}
        <p className="text-[13px] leading-relaxed text-stone tabular-nums">
          {COPY.nationalNote(product.surveyedOn, product.range.stores)}
        </p>
      </div>

      <div className="rounded-lg bg-pair-base px-3 py-2.5 text-pair-base-foreground">
        <p className="text-[13px] font-semibold text-stone">조사 가격 범위</p>
        <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm leading-relaxed tabular-nums">
          <div className="flex items-baseline gap-1.5">
            <dt className="text-caption">최저</dt>
            <dd className="font-semibold">{won(product.range.min)}원</dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="text-caption">최고</dt>
            <dd className="font-semibold">{won(product.range.max)}원</dd>
          </div>
        </dl>
      </div>

      {product.status !== "active" && (
        <div
          role="note"
          className="flex gap-2 rounded-lg bg-pair-gold px-3 py-2.5 text-pair-gold-foreground"
        >
          <CalendarClock aria-hidden size={16} className="mt-0.5 shrink-0" />
          <div className="text-[13px] leading-relaxed">
            <p className="font-semibold">
              {product.status === "discontinued"
                ? COPY.discontinued
                : COPY.stale(product.surveyedOn)}
            </p>
            <p>{COPY.staleNote}</p>
          </div>
        </div>
      )}
      <p className="flex gap-2 text-[13px] leading-relaxed text-stone">
        <Info aria-hidden size={16} className="mt-0.5 shrink-0" />
        {COPY.noVerdict}
      </p>
    </section>
  )
}

function ChannelsSection({
  channels,
}: {
  channels: ProductDetail["channels"]
}) {
  return (
    <section aria-labelledby="channels-title" className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h2
          id="channels-title"
          className="text-xl leading-snug font-semibold text-ink sm:text-[22px]"
        >
          {COPY.channelsTitle}
        </h2>
        <p className="text-[13px] leading-relaxed text-caption">
          조사 점포의 중간값
        </p>
      </div>
      <dl className="divide-y divide-hairline border-y border-hairline">
        {channels.map((channel) => (
          <div
            key={channel.channel}
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-baseline gap-x-3 py-2.5"
          >
            <dt className="text-sm leading-relaxed font-semibold text-ink">
              {CHANNEL_NAME[channel.channel]}{" "}
              <span className="inline-block text-[13px] font-normal text-caption tabular-nums">
                {COPY.stores(channel.stores)}
              </span>
            </dt>
            <dd className="flex min-w-0 flex-col text-end tabular-nums">
              <span className="text-base font-semibold text-ink">
                {won(channel.median)}원
              </span>
              {channel.min !== channel.max && (
                <span className="text-[13px] leading-relaxed [overflow-wrap:anywhere] text-caption">
                  {COPY.range(channel.min, channel.max)}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function RelatedLinks({
  item,
  varietyId,
}: Pick<ProductDetail, "item" | "varietyId">) {
  if (!item && !varietyId) return null
  return (
    <nav
      aria-labelledby="related-product-title"
      className="flex flex-col gap-3"
    >
      <h2
        id="related-product-title"
        className="text-xl leading-snug font-semibold text-ink sm:text-[22px]"
      >
        관련 가격 더 보기
      </h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {item && (
          <RelatedLink
            href={routes.price.searchFor(item)}
            label={`‘${item}’ 검색 결과`}
          />
        )}
        {varietyId && (
          <RelatedLink
            href={routes.price.variety(varietyId)}
            label={COPY.variety}
          />
        )}
      </div>
    </nav>
  )
}

function RelatedLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-hairline bg-pair-light py-2.5 ps-3.5 pe-3 text-sm leading-relaxed font-semibold text-pair-light-foreground no-underline hover:border-stone"
    >
      <span className="[overflow-wrap:anywhere] break-keep">{label}</span>
      <ChevronRight aria-hidden size={17} className="shrink-0 rtl:rotate-180" />
    </Link>
  )
}
