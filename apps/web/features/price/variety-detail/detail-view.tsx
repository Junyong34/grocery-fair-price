import Link from "next/link"

import { basisLine, PRICE_COPY, summaryLine } from "@workspace/price/copy"
import type { VarietyDetail } from "@workspace/price/types"
import { findFood } from "@workspace/seasonal/data/foods"
import { formatSeasonMonths } from "@workspace/seasonal/data/months"

import { routes } from "@/shared/routes"

import { DetailHeader, DetailHeaderBar } from "./detail-header"
import { DotsCompare } from "./dots-compare"
import { MyPriceSection } from "./my-price"
import { PlacesSection } from "./places-section"
import { RangeBar } from "./range-bar"
import { SectionChips } from "./section-chips"
import { P3_SECTIONS } from "./section-ids"
import { VerdictCard } from "./verdict-card"
import { WhySection } from "./why-section"

const SECTIONS = [
  { id: P3_SECTIONS.price, label: "시세" },
  { id: P3_SECTIONS.places, label: "어디서" },
  { id: P3_SECTIONS.why, label: "추이" },
] as const

/**
 * P3 품종 상세. 위는 판정(지금이 비싼 시기인가: 시세 대 평소가), 아래 "어디서 얼마에 팔까"는 장소 비교(이 가게가 비싸게 파나).
 * "내가 본 가격 적기"는 범위 막대 바로 아래(시세 구간 안)에 둔다. 매장에서 가격표를 보고 비교하는 게 이 화면의 핵심이라 첫 화면에 닿게 하고,
 * 적으면 바로 위 범위 막대에 "내가 본" 핀이 꽂혀 입력과 결과가 한 화면에 보인다. 판정 전(평소가 없음)이면 뺀다. today는 서울 기준 오늘(데이터가 오래됐는지 "2주 전"을 쓴다).
 */
export function DetailView({
  detail,
  today,
}: {
  detail: VarietyDetail
  today: string
}) {
  // 제철달력에 같은 id 품종이 있으면 제철 시기로 잇는다(제철 품종 상세의 "오늘 시세 보기"와 짝).
  const food = findFood(detail.id)
  return (
    <article className="price-page flex flex-col gap-7 pt-3 lg:pt-8">
      <DetailHeader variety={detail} />
      <DetailHeaderBar variety={detail} />
      <div className="contents lg:hidden">
        <SectionChips sections={SECTIONS} />
      </div>
      <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-x-10 lg:gap-y-8">
        {/* 섹션 칩이 이 id로 이동한다. scroll-mt는 헤더(56) + 섹션 칩 줄(40) 아래로 맞춘다. */}
        <div
          id={P3_SECTIONS.price}
          className="flex min-w-0 scroll-mt-28 flex-col gap-7"
        >
          <VerdictCard detail={detail} today={today} />
          <RangeBar detail={detail} />
          {detail.usual != null && (
            <MyPriceSection detail={detail} id={P3_SECTIONS.myPrice} />
          )}
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
      {/* 페이지 요약 한 문장(날짜·출처·숫자). 검색 결과와 AI 답변이 인용하기 좋은 꼴로 둔다. */}
      <p className="max-w-prose text-sm leading-relaxed text-stone">{summaryLine(detail)}</p>
      <p className="-mt-5 pb-4 text-xs text-caption">
        {basisLine(detail.basis, detail.surveyedOn, detail.sampleSize)}
      </p>
    </article>
  )
}
