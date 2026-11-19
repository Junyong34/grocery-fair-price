"use client"

import { useState } from "react"

import { gapAxis } from "@workspace/price/axis"
import { MARKET_TYPE_NAME, PRICE_COPY } from "@workspace/price/copy"
import { won } from "@workspace/price/format"
import { placesByType, sameEverywhere } from "@workspace/price/places"
import type { PlaceQuote, VarietyDetail } from "@workspace/price/types"

import { GapAxisLabels, GapBar, GapDiff, GapReference } from "../components/gap-bar"

const COPY = PRICE_COPY.detail

/** 전통시장은 이만큼만 먼저 보이고 "모두 보기"로 편다. */
const MARKETS_SHOWN = 5

const PLACE_COLUMNS = "grid grid-cols-[minmax(0,1fr)_minmax(4.5rem,7rem)_6rem] items-center gap-x-3"

/**
 * P3 "어디서 얼마에 팔까": 업태별 중간값 두 칸, 대형마트 체인별 · 전통시장별 시세(싼 순).
 * 이 가게가 비싸게 파는지(judgment.md 0장 ①)를 사용자가 직접 견주게 하는 자리라 판정 색을 쓰지 않는다.
 * 기준 줄에 전국 중간값(시세) 금액을 쓰고, 행마다 기준에서 뻗는 차이 막대와 차이 글(↓ 120원 낮음)을 둔다(gap-bar).
 */
export function PlacesSection({ detail }: { detail: VarietyDetail }) {
  const [allMarkets, setAllMarkets] = useState(false)
  const { large_retail: marts, traditional: markets } = placesByType(detail.places)
  const axis = gapAxis(detail.places.map((place) => place.price), detail.price)
  const shownMarkets = allMarkets ? markets : markets.slice(0, MARKETS_SHOWN)

  const row = (place: PlaceQuote) => (
    <li key={`${place.name}-${place.region}`} className={PLACE_COLUMNS + " border-b border-hairline py-2.5 last:border-b-0"}>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-[15px] font-semibold text-ink">{place.name}</span>
        <span className="truncate text-xs text-caption">
          {sameEverywhere(place)
            ? [place.region, COPY.samePrice(place.samples.length)].filter(Boolean).join(" · ")
            : place.region ?? COPY.places(place.samples.length)}
        </span>
      </span>
      <GapBar axis={axis} value={place.price} />
      <span className="flex flex-col items-end justify-self-end">
        <span className="text-[15px] font-semibold text-ink tabular-nums">{won(place.price)}원</span>
        <GapDiff axis={axis} value={place.price} reference={detail.price} />
      </span>
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
          <div key={quote.type} className="flex flex-col gap-1 rounded-2xl bg-mat p-3">
            <dt className="text-xs font-semibold text-stone">{COPY.typeMedian(MARKET_TYPE_NAME[quote.type])}</dt>
            <dd className="flex items-baseline gap-1.5">
              <span className="font-number text-[22px] leading-none text-ink tabular-nums">{won(quote.median)}원</span>
              <span className="text-xs text-caption">{COPY.places(quote.n)}</span>
            </dd>
          </div>
        ))}
      </dl>
      {detail.places.length > 0 && <GapReference label={COPY.placesReference(detail.basis)} price={detail.price} />}
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
      {detail.places.length > 0 && <p className="text-xs text-caption">{COPY.placesNote}</p>}
    </section>
  )
}

function PlaceGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-1.5 border-b border-hairline pb-1.5">
        <h3 className="flex items-baseline gap-1.5 text-[13px] font-semibold text-stone">
          {title}
          <small className="font-normal text-caption">{COPY.cheapFirst}</small>
        </h3>
        {/* 막대 칸 위 눈금(낮음 · 기준 · 높음). 그룹 제목이 375 폭 이름 칸에 안 들어가 줄을 따로 둔다. */}
        <div className={PLACE_COLUMNS}>
          <span />
          <GapAxisLabels />
        </div>
      </div>
      <ul>{children}</ul>
    </div>
  )
}
