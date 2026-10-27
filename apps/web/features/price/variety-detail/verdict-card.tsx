import { CalendarClock } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

import { PRICE_COPY, VERDICT_WORD, verdictDiff } from "@workspace/price/copy"
import { agoLabel, daysBetween, won } from "@workspace/price/format"
import type { VarietyDetail } from "@workspace/price/types"

import { VERDICT_TONE } from "../components/verdict-tone"

const COPY = PRICE_COPY.detail

/**
 * P3 판정 카드(판정 색 배경): 큰 판정, 평소보다 몇 %, 지금 시세 · 평소가 두 칸.
 * 판정 전이면 회색 "판정 전"과 평소가 "계산 중". 데이터가 오래됐으면 조사일 배지와 흐린 판정,
 * 표본이 적으면 점선 상자와 "?".
 */
export function VerdictCard({ detail, today }: { detail: VarietyDetail; today: string }) {
  const { verdict } = detail
  const tone = VERDICT_TONE[verdict.kind]
  const none = verdict.kind === "none"
  const few = detail.meetsMinN === false
  return (
    <section aria-label="판정" className={cn("flex flex-col gap-4 rounded-[24px] px-5 pt-5 pb-4", tone.wash)}>
      {detail.stale && (
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-surface/80 px-2.5 py-1 text-xs font-semibold text-stone">
          <CalendarClock aria-hidden size={14} />
          {COPY.stale(detail.surveyedOn, agoLabel(daysBetween(detail.surveyedOn, today)))}
        </span>
      )}
      <div
        className={cn(
          "flex flex-col gap-1",
          detail.stale && "opacity-45",
          few && !none && cn("w-fit rounded-2xl border-2 border-dashed px-4 py-2.5", tone.border)
        )}
      >
        <p className={cn("flex items-center gap-2.5 font-heading font-bold leading-none", none ? "text-[34px]" : "text-[44px]", tone.ink)}>
          <span aria-hidden className={cn("size-4 rounded-full", tone.fill)} />
          {VERDICT_WORD[verdict.kind]}
          {few && !none && "?"}
        </p>
        <p className={cn("text-[17px] font-semibold", tone.ink)}>
          {verdict.pct == null ? COPY.noUsual : verdictDiff(verdict.pct)}
        </p>
      </div>
      {detail.stale && <p className="text-sm text-stone">{COPY.staleNote}</p>}
      {few && <p className="text-sm text-stone">{COPY.fewSamples(detail.sampleSize)}</p>}
      <dl className="grid grid-cols-2 gap-2">
        <PriceCell
          term={COPY.nowPrice}
          value={`${won(detail.price)}원`}
          unit={detail.baseUnit}
          note={COPY.nowPriceNote(detail.surveyedOn, detail.sampleSize)}
        />
        {detail.usual == null ? (
          <PriceCell term={COPY.usual} value={COPY.usualPending} muted note={COPY.usualPendingNote} />
        ) : (
          <PriceCell term={COPY.usual} value={`${won(detail.usual)}원`} unit={detail.baseUnit} note={COPY.usualNote} />
        )}
      </dl>
    </section>
  )
}

function PriceCell({ term, value, unit, note, muted }: { term: string; value: string; unit?: string; note: string; muted?: boolean }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-surface/75 p-3">
      <dt className="text-xs font-semibold text-stone">{term}</dt>
      <dd className="flex flex-col gap-1">
        <span className={cn("font-number text-[22px] leading-none tabular-nums", muted ? "text-caption" : "text-ink")}>
          {value}
          {unit && <small className="ml-1 font-sans text-xs text-caption">({unit})</small>}
        </span>
        <span className="text-xs leading-snug text-caption">{note}</span>
      </dd>
    </div>
  )
}
