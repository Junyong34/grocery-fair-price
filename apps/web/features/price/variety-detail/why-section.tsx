"use client"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@workspace/ui/components/collapsible"

import { PRICE_COPY } from "@workspace/price/copy"
import type { VarietyDetail } from "@workspace/price/types"

import { TrendChart } from "./trend-chart"

const COPY = PRICE_COPY.detail

/** "왜 이 판정일까?" 펼치기: 가격 추이 차트와 점 비교. 평소가가 없으면 "가격 흐름 보기". */
export function WhySection({ detail, dots }: { detail: VarietyDetail; dots: React.ReactNode }) {
  return (
    <Collapsible className="rounded-[20px] border border-hairline bg-surface/60 px-4">
      <CollapsibleTrigger className="w-full justify-between py-2 text-[17px] font-semibold text-ink">
        {detail.usual == null ? COPY.whyNoUsual : COPY.why}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-8 pt-1 pb-5">
          <section className="flex flex-col gap-3">
            <h3 className="flex items-baseline gap-2 text-[15px] font-semibold text-ink">
              {COPY.trendTitle}
              <small className="text-xs font-normal text-caption">{COPY.trendSub(detail.baseUnit)}</small>
            </h3>
            <TrendChart detail={detail} />
          </section>
          {dots}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
