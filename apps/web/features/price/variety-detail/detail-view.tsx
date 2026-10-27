import { basisLine } from "@workspace/price/copy"
import type { VarietyDetail } from "@workspace/price/types"

import { DetailHeader } from "./detail-header"
import { DotsCompare } from "./dots-compare"
import { MyPriceBar } from "./my-price"
import { PlacesSection } from "./places-section"
import { RangeBar } from "./range-bar"
import { VerdictCard } from "./verdict-card"
import { WhySection } from "./why-section"

/**
 * P3 품종 상세. 위는 판정(지금이 비싼 시기인가: 시세 대 평소가), 아래 "어디서 얼마에 팔까"는 장소 비교(이 가게가 비싸게 파나).
 * 판정 전(평소가 없음)이면 "내가 본 가격 적기"를 뺀다. today는 서울 기준 오늘(데이터가 오래됐는지 "2주 전"을 쓴다).
 */
export function DetailView({ detail, today }: { detail: VarietyDetail; today: string }) {
  return (
    <article className="mx-auto flex max-w-[640px] flex-col gap-7 px-[18px] pt-3 lg:pt-8">
      <DetailHeader variety={detail} />
      <VerdictCard detail={detail} today={today} />
      <RangeBar detail={detail} />
      <PlacesSection detail={detail} />
      <WhySection detail={detail} dots={<DotsCompare detail={detail} />} />
      <p className="text-xs text-caption">{basisLine(detail.basis, detail.surveyedOn, detail.sampleSize)}</p>
      {detail.usual != null && <MyPriceBar detail={detail} />}
    </article>
  )
}
