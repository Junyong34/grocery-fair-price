import { CalendarClock, ChevronRight, Info } from "lucide-react"
import Link from "next/link"

import { CHANNEL_NAME, PRICE_COPY } from "@workspace/price/copy"
import { monthDay, won } from "@workspace/price/format"
import type { ProductDetail, VarietySummary } from "@workspace/price/types"
import { findFood } from "@workspace/seasonal/data/foods"
import { formatSeasonMonths } from "@workspace/seasonal/data/months"

import { routes } from "@/shared/routes"

import { AddButton } from "../components/add-button"
import { VarietyRow } from "../components/variety-row"

import { ProductHeader, ProductHeaderBar } from "./product-header"
import type { relatedProducts } from "./related-products"
import { SellersSection } from "./sellers-section"
import { TrendSection } from "./trend-section"

const COPY = PRICE_COPY.product
type RelatedProductList = ReturnType<typeof relatedProducts>

/** 전국 · 업태별 판매가와 판매처별 비교를 두 열로 두고, 최근 조사 가격은 아래 전체 폭에 둔다. */
export function ProductView({
  product,
  variety = null,
  related = { items: [], total: 0 },
  categoryPath = null,
}: {
  /** 이 상품 카테고리의 페이지. 카테고리 목록에 없으면 null */
  categoryPath?: string | null
  product: ProductDetail
  /** 이 상품 판매가가 시세로 쓰이는 품종. 판정 목록에 없으면 null(링크가 404로 가지 않게) */
  variety?: VarietySummary | null
  related?: RelatedProductList
}) {
  const sub = [product.category, product.item, product.size]
    .filter(Boolean)
    .join(" · ")
  return (
    <article className="price-page flex flex-col gap-7 pt-3 pb-6 lg:gap-9 lg:pt-8">
      <ProductHeader id={product.id} name={product.name} sub={sub} />
      <ProductHeaderBar name={product.name} />
      <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-x-8 lg:gap-y-9">
        <div className="flex min-w-0 flex-col gap-7 lg:gap-8">
          <PriceCard product={product} variety={variety} />
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
      <VarietySection variety={variety} foodId={product.varietyId} />
      <RelatedProducts
        item={product.item}
        unit={product.perUnit?.unit ?? null}
        related={related}
      />
      {categoryPath && (
        <RelatedLink
          href={categoryPath}
          label={COPY.categoryLink(product.category)}
        />
      )}
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

function PriceCard({
  product,
  variety,
}: {
  product: ProductDetail
  variety: VarietySummary | null
}) {
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
        <p className="text-[13px] font-semibold text-caption">조사 가격 범위</p>
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
        {/* 시세로 쓰이는 상품(정육 · 수산 등)은 가공식품이 아니다: 판정이 있는 시세로 안내한다. */}
        {variety
          ? COPY.verdictOnVariety(variety.name)
          : product.varietyId
            ? COPY.noVerdictYet
            : COPY.noVerdict}
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
            className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 py-2.5"
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
                <span className="text-[13px] leading-relaxed text-balance break-keep text-caption">
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

/**
 * 이 상품 판매가가 시세로 쓰이는 품종 한 행(+ 담기)과, 같은 id의 제철 품종이 있으면 제철 시기 링크.
 * 품종이 아직 판정 목록에 없으면(시세 화면 없음) 행은 빼고 제철 링크만 남긴다.
 */
function VarietySection({
  variety,
  foodId,
}: {
  variety: VarietySummary | null
  foodId: string | null
}) {
  const food = foodId ? findFood(foodId) : undefined
  if (!variety && !food) return null
  const seasonLink = food && (
    <RelatedLink
      href={routes.seasonal.food(food.id)}
      label={PRICE_COPY.seasonLink(food.name)}
      sub={formatSeasonMonths(food.months)}
    />
  )
  if (!variety) return <div className="flex flex-col">{seasonLink}</div>
  return (
    <section aria-labelledby="variety-title" className="flex flex-col gap-2">
      <h2
        id="variety-title"
        className="text-xl leading-snug font-semibold text-ink sm:text-[22px]"
      >
        {COPY.varietyTitle}
      </h2>
      <ul className="border-y border-hairline">
        <VarietyRow
          variety={variety}
          action={<AddButton variety={variety} />}
        />
      </ul>
      {seasonLink}
    </section>
  )
}

/** 같은 품목의 다른 상품. 기준 단위가 같으면 단위당 가격 싼 순이다(related-products.ts). */
function RelatedProducts({
  item,
  unit,
  related,
}: {
  item: string
  unit: string | null
  related: RelatedProductList
}) {
  if (related.items.length === 0) return null
  return (
    <nav
      aria-labelledby="related-product-title"
      className="flex flex-col gap-2"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h2
          id="related-product-title"
          className="text-xl leading-snug font-semibold text-ink sm:text-[22px]"
        >
          {COPY.relatedTitle(item)}
        </h2>
        <p className="text-[13px] leading-relaxed text-caption">
          {COPY.relatedNote(unit)}
        </p>
      </div>
      <ul className="grid border-y border-hairline lg:grid-cols-2 lg:gap-x-8">
        {related.items.map((product) => (
          <li
            key={product.id}
            className="border-b border-hairline last:border-b-0 lg:[&:nth-last-child(2):nth-child(odd)]:border-b-0"
          >
            <Link
              href={routes.price.product(product.id)}
              className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 rounded-lg py-2.5 text-ink no-underline outline-offset-2 hover:bg-mat focus-visible:outline-2 focus-visible:outline-ring active:bg-mat"
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[15px] leading-snug font-semibold [overflow-wrap:anywhere] break-keep">
                  {product.name}
                </span>
                <span className="text-[13px] leading-snug text-caption tabular-nums">
                  {product.status === "discontinued"
                    ? COPY.discontinuedShort
                    : product.status === "stale"
                      ? COPY.stale(product.surveyedOn)
                      : `${monthDay(product.surveyedOn)} 조사`}
                </span>
              </span>
              <span className="flex flex-col items-end gap-0.5 tabular-nums">
                <span className="text-base leading-tight font-semibold">
                  {won(product.price)}원
                </span>
                {product.perUnit && (
                  <span className="text-[13px] whitespace-nowrap text-caption">
                    {COPY.perUnit(product.perUnit.unit, product.perUnit.price)}
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {related.total > related.items.length && (
        <RelatedLink
          href={routes.price.searchFor(item)}
          label={COPY.relatedAll(item)}
        />
      )}
    </nav>
  )
}

function RelatedLink({
  href,
  label,
  sub,
}: {
  href: string
  label: string
  sub?: string
}) {
  return (
    <Link
      href={href}
      className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-hairline bg-pair-light py-2.5 ps-3.5 pe-3 text-pair-light-foreground no-underline hover:border-stone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm leading-relaxed font-semibold [overflow-wrap:anywhere] break-keep">
          {label}
        </span>
        {sub && (
          <span className="text-[13px] leading-snug text-caption">{sub}</span>
        )}
      </span>
      <ChevronRight aria-hidden size={17} className="shrink-0 rtl:rotate-180" />
    </Link>
  )
}
