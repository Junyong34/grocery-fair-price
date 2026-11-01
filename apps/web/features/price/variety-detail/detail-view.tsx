import { basisLine } from "@workspace/price/copy"
import type { VarietyDetail } from "@workspace/price/types"

import { DetailHeader, DetailHeaderBar } from "./detail-header"
import { DotsCompare } from "./dots-compare"
import { MyPriceBar } from "./my-price"
import { PlacesSection } from "./places-section"
import { RangeBar } from "./range-bar"
import { SectionChips } from "./section-chips"
import { P3_SECTIONS } from "./section-ids"
import { VerdictCard } from "./verdict-card"
import { WhySection } from "./why-section"

const SECTIONS = [
  { id: P3_SECTIONS.price, label: "시세" },
  { id: P3_SECTIONS.places, label: "어디서" },
  { id: P3_SECTIONS.why, label: "왜" },
] as const

/**
 * P3 품종 상세. 위는 판정(지금이 비싼 시기인가: 시세 대 평소가), 아래 "어디서 얼마에 팔까"는 장소 비교(이 가게가 비싸게 파나).
 * 판정 전(평소가 없음)이면 "내가 본 가격 적기"를 뺀다. today는 서울 기준 오늘(데이터가 오래됐는지 "2주 전"을 쓴다).
 */
export function DetailView({ detail, today }: { detail: VarietyDetail; today: string }) {
  return (
    <article className="mx-auto flex max-w-[640px] flex-col gap-7 px-[18px] pt-3 lg:pt-8">
      <DetailHeader variety={detail} />
      <DetailHeaderBar variety={detail} />
      <SectionChips sections={SECTIONS} />
      {/* 섹션 칩이 이 id로 이동한다. scroll-mt는 헤더(56) + 섹션 칩 줄(40) 아래로 맞춘다. */}
      <div id={P3_SECTIONS.price} className="flex scroll-mt-28 flex-col gap-7">
        <VerdictCard detail={detail} today={today} />
        <RangeBar detail={detail} />
      </div>
      <div id={P3_SECTIONS.places} className="scroll-mt-28">
        <PlacesSection detail={detail} />
      </div>
      <div id={P3_SECTIONS.why} className="scroll-mt-28">
        <WhySection detail={detail} dots={<DotsCompare detail={detail} />} />
      </div>
      <p className="text-xs text-caption">{basisLine(detail.basis, detail.surveyedOn, detail.sampleSize)}</p>
      {detail.usual != null && <MyPriceBar detail={detail} />}
    </article>
  )
}
