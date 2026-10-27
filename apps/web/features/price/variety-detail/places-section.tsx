"use client"

import { useState } from "react"

import { MARKET_TYPE_NAME, PRICE_COPY } from "@workspace/price/copy"
import { won } from "@workspace/price/format"
import { placesByType, sameEverywhere } from "@workspace/price/places"
import type { PlaceQuote, VarietyDetail } from "@workspace/price/types"

const COPY = PRICE_COPY.detail

/** 전통시장은 이만큼만 먼저 보이고 "모두 보기"로 편다. */
const MARKETS_SHOWN = 5

const PLACE_COLUMNS = "grid grid-cols-[minmax(0,1fr)_minmax(4.5rem,7rem)_5.25rem] items-center gap-x-3"

/**
 * P3 "어디서 얼마에 팔까": 업태별 중간값 두 칸, 대형마트 체인별 · 전통시장별 시세(싼 순).
 * 이 가게가 비싸게 파는지(judgment.md 0장 ①)를 사용자가 직접 견주게 하는 자리라 판정 색을 쓰지 않는다.
 * 각 행의 위치 막대: 점 = 이 곳 가격, 점선 = 전국 중간값(시세).
 */
export function PlacesSection({ detail }: { detail: VarietyDetail }) {
  const [allMarkets, setAllMarkets] = useState(false)
  const { large_retail: marts, traditional: markets } = placesByType(detail.places)
  const prices = detail.places.map((place) => place.price)
  const lo = Math.min(...prices, detail.price)
  const hi = Math.max(...prices, detail.price)
  const x = (v: number) => (hi === lo ? 50 : ((v - lo) / (hi - lo)) * 100)
  const national = x(detail.price)
  const shownMarkets = allMarkets ? markets : markets.slice(0, MARKETS_SHOWN)

  const row = (place: PlaceQuote) => (
    <li key={`${place.name}-${place.region}`} className={PLACE_COLUMNS + " border-b border-hairline py-2.5 last:border-b-0"}>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-[15px] font-semibold text-ink">{place.name}</span>
        <span className="truncate text-xs text-caption">
          {place.region ?? COPY.places(place.samples.length)}
          {sameEverywhere(place) && ` · ${COPY.samePrice}`}
        </span>
      </span>
      <span aria-hidden className="relative h-2 rounded-full bg-hairline">
        <span className="absolute -top-1 -bottom-1 border-l border-dashed border-stone" style={{ left: `${national}%` }} />
        <span className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink" style={{ left: `${x(place.price)}%` }} />
      </span>
      <span className="justify-self-end text-[15px] font-semibold text-ink tabular-nums">{won(place.price)}원</span>
    </li>
  )

  return (
    <section aria-labelledby="places-title" className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <h2 id="places-title" className="text-[17px] font-semibold text-ink">
          {COPY.placesTitle}
        </h2>
        <span className="text-xs text-caption">{COPY.placesSub(detail.surveyedOn)}</span>
      </div>
      <dl className="grid grid-cols-2 gap-2">
        {detail.marketTypes.map((quote) => (
          <div key={quote.type} className="flex flex-col gap-1 rounded-2xl bg-surface p-3">
            <dt className="text-xs font-semibold text-stone">{COPY.typeMedian(MARKET_TYPE_NAME[quote.type])}</dt>
            <dd className="flex items-baseline gap-1.5">
              <span className="font-number text-[22px] leading-none text-ink tabular-nums">{won(quote.median)}원</span>
              <span className="text-xs text-caption">{COPY.places(quote.n)}</span>
            </dd>
          </div>
        ))}
      </dl>
      {marts.length > 0 && <PlaceGroup title={COPY.martsTitle}>{marts.map(row)}</PlaceGroup>}
      {markets.length > 0 && (
        <PlaceGroup title={COPY.marketsTitle}>
          {shownMarkets.map(row)}
          {markets.length > MARKETS_SHOWN && (
            <li className="pt-2">
              <button
                type="button"
                aria-expanded={allMarkets}
                onClick={() => setAllMarkets((open) => !open)}
                className="h-10 w-full rounded-full border border-silver text-sm font-semibold text-stone hover:border-stone hover:text-ink"
              >
                {allMarkets ? COPY.showFewerMarkets : COPY.showAllMarkets(markets.length)}
              </button>
            </li>
          )}
        </PlaceGroup>
      )}
      <p className="text-xs text-caption">{COPY.placesNote(won(detail.price))}</p>
    </section>
  )
}

function PlaceGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <h3 className="flex items-baseline gap-1.5 border-b border-hairline pb-1.5 text-[13px] font-semibold text-stone">
        {title}
        <small className="font-normal text-caption">{COPY.cheapFirst}</small>
      </h3>
      <ul>{children}</ul>
    </div>
  )
}
