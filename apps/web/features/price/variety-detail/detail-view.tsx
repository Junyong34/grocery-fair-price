import Link from "next/link"

import { PRICE_COPY } from "@workspace/price/copy"
import type { ProductSummary, VarietyDetail, VarietySummary } from "@workspace/price/types"
import { comparesMyPrice } from "@workspace/price/detail-picture"
import { explainVerdict } from "@workspace/price/verdict-copy"
import { findFood } from "@workspace/seasonal/data/foods"
import { formatSeasonMonths } from "@workspace/seasonal/data/months"

import { routes } from "@/shared/routes"

import { ProductRow } from "../components/product-row"
import type { VarietySpecQuote } from "../data/price-source"

import { DetailHeader, DetailHeaderBar } from "./detail-header"
import { DotsCompare } from "./dots-compare"
import { MyPriceSection } from "./my-price"
import { PlacesSection } from "./places-section"
import { RangeBar } from "./range-bar"
import { SectionChips } from "./section-chips"
import { P3_SECTIONS } from "./section-ids"
import { SpecQuotesSection } from "./spec-quotes-section"
import { VerdictCard } from "./verdict-card"
import { WhySection } from "./why-section"

/**
 * 품종 상세는 내가 본 가격의 평소가 비교, 최근 시세 흐름, 조사 범위 순으로 보여 준다.
 * 비교할 평소가가 없거나 브랜드 편차가 큰 품종에서는 시세와 그 사유를 먼저 보여 준다.
 */
export function DetailView({
  detail,
  specQuotes,
  related = [],
  products = [],
  categoryPath = null,
}: {
  detail: VarietyDetail
  specQuotes: readonly VarietySpecQuote[]
  related?: readonly VarietySummary[]
  /** 이 품종의 시세로 쓰이는 참가격 상품. 없으면 묶음을 뺀다 */
  products?: readonly ProductSummary[]
  /** 이 품종 카테고리의 상품 카테고리 페이지. 상품이 없는 카테고리면 null */
  categoryPath?: string | null
}) {
  // 제철달력에 같은 id 품종이 있으면 제철 시기로 잇는다.
  const food = findFood(detail.id)
  const hasSpecQuotes = specQuotes.length > 1
  const sections = [
    { id: P3_SECTIONS.price, label: "시세" },
    ...(hasSpecQuotes ? [{ id: P3_SECTIONS.specs, label: "규격별" }] : []),
    { id: P3_SECTIONS.places, label: "어디서" },
    { id: P3_SECTIONS.why, label: "추이" },
  ]
  return (
    <article className="price-page flex flex-col gap-7 pt-3 lg:pt-8">
      <DetailHeader variety={detail} />
      <DetailHeaderBar variety={detail} />
      <div className="contents lg:hidden">
        <SectionChips sections={sections} />
      </div>
      <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-x-10 lg:gap-y-8">
        {/* 섹션 칩이 이 id로 이동한다. scroll-mt는 헤더(56) + 섹션 칩 줄(40) 아래로 맞춘다. */}
        <div
          id={P3_SECTIONS.price}
          className="flex min-w-0 scroll-mt-28 flex-col gap-7"
        >
          {comparesMyPrice(detail) && (
            <MyPriceSection detail={detail} id={P3_SECTIONS.myPrice} />
          )}
          <VerdictCard detail={detail} />
          <RangeBar detail={detail} />
          {hasSpecQuotes && <SpecQuotesSection quotes={specQuotes} unit={detail.baseUnit} />}
        </div>
        <div id={P3_SECTIONS.places} className="min-w-0 scroll-mt-28">
          <PlacesSection detail={detail} />
        </div>
        <div
          id={P3_SECTIONS.why}
          className="min-w-0 scroll-mt-28 lg:col-span-2"
        >
          <WhySection detail={detail} dots={<DotsCompare detail={detail} />} />
        </div>
      </div>
      {food && (
        <Link
          href={routes.seasonal.food(food.id)}
          className="flex items-center justify-between gap-3 rounded-xl border border-hairline px-4 py-3 text-ink no-underline hover:text-ink"
        >
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold">{PRICE_COPY.seasonLink(food.name)}</span>
            <span className="text-xs text-stone">{formatSeasonMonths(food.months)}</span>
          </span>
          <span aria-hidden className="text-stone">›</span>
        </Link>
      )}
      {/* 이 품종의 시세로 쓰이는 상품. 시세 상세에서 상품 상세로 가는 길이다(상품 상세의 "이 판매가가 쓰이는 시세"와 짝). */}
      {products.length > 0 && (
        <section aria-labelledby="variety-products-title" className="flex flex-col gap-2">
          <h2 id="variety-products-title" className="text-base font-semibold text-ink">
            {PRICE_COPY.catalog.varietyProducts(detail.name)}
          </h2>
          <p className="text-[13px] leading-relaxed text-caption">{PRICE_COPY.catalog.productsNote}</p>
          <ul className="rounded-3xl bg-pair-light px-4 lg:px-5">
            {products.map((product) => (
              <ProductRow key={product.id} product={product} hideItem />
            ))}
          </ul>
        </section>
      )}
      {/* 같은 카테고리의 다른 품종. 품종 알약은 메인 "최근 본 품종"과 같은 pair-light(DESIGN.md). 검색으로 상세에 바로 들어온 사람이 비교를 이어 가고, 크롤러가 상세끼리 오간다. */}
      {/* 같은 카테고리에 다른 품종이 없으면(유제품의 우유) 제목만 남지 않게 묶음을 뺀다. */}
      {related.length > 0 && (
        <section aria-labelledby="related-title" className="flex flex-col gap-1">
          <h2 id="related-title" className="text-base font-semibold text-ink">
            {PRICE_COPY.related.title(detail.category)}
          </h2>
          <ul className="flex flex-wrap gap-2 pt-2">
            {related.map((variety) => (
              <li key={variety.id}>
                <Link
                  href={routes.price.variety(variety.id)}
                  className="inline-flex h-9 items-center rounded-full border border-hairline bg-pair-light px-3.5 text-sm text-pair-light-foreground no-underline hover:border-stone"
                >
                  {variety.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {categoryPath && (
        <Link
          href={categoryPath}
          className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-hairline px-4 py-3 text-sm font-semibold text-ink no-underline hover:text-ink"
        >
          {PRICE_COPY.catalog.categoryLink(detail.category)}
          <span aria-hidden className="text-stone">›</span>
        </Link>
      )}
      {/*
        페이지 요약 한 문장(연도 포함 날짜·출처·표본·숫자). 검색 결과와 AI 답변이 인용하기 좋은 꼴로 둔다.
        판정 카드와 내용이 겹치므로 본문 섹션처럼 보이지 않게 가는 선 아래 각주로 둔다(크림 위 보조 글씨는 caption, DESIGN.md).
      */}
      <footer className="flex flex-col gap-2 border-t border-hairline pt-4 pb-4">
        <p className="max-w-prose text-[13px] leading-relaxed text-caption">{explainVerdict(detail, null).summary}</p>
        <Link
          href={routes.settings.sources}
          className="relative self-start text-xs text-caption underline underline-offset-2 after:absolute after:-inset-3 hover:text-ink"
        >
          {PRICE_COPY.detail.sourcesLink}
        </Link>
      </footer>
    </article>
  )
}
