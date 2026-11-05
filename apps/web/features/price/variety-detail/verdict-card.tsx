import { CalendarClock, Info } from "lucide-react"
import { Suspense } from "react"

import { cn } from "@workspace/ui/lib/utils"

import {
  PRICE_COPY,
  VERDICT_WORD,
  verdictTrendDiff,
} from "@workspace/price/copy"
import { agoLabel, daysBetween, isoDate, won } from "@workspace/price/format"
import type { VarietyDetail } from "@workspace/price/types"

import { getSeoulToday } from "@/shared/today"

import { VERDICT_TONE } from "../components/verdict-tone"

const COPY = PRICE_COPY.detail

/**
 * P3 판정 카드(판정 색 배경): 큰 판정, 평소보다 몇 %, 판정 주의, 지금 시세 · 평소가 두 칸.
 * 판정 전이면 회색 "판정 전"과 평소가 "자료 없음".
 * 판정 주의(데이터 오래됨 · 표본 적음)는 판정 바로 아래 Notice로 모은다. 기호("?")·점선만으로는 뜻이 전해지지 않아 제목 + 설명 글로 쓴다.
 * 오래됐으면 판정도 흐리게 한다.
 *
 * 글씨는 세 층이다. 판정(44 · 17 · 13px, 판정 색) / 주의(13px semibold ink · 12px caption) / 금액 칸(12 · 22 · 12px).
 * 주의와 금액 칸은 같은 크림 면(bg-canvas/80)을 써서 판정 색 위의 글씨 색을 판정 블록 하나로 줄인다.
 */
export function VerdictCard({ detail }: { detail: VarietyDetail }) {
  const { verdict } = detail
  const tone = VERDICT_TONE[verdict.kind]
  const none = verdict.kind === "none"
  const few = detail.meetsMinN === false
  return (
    <section
      aria-label="판정"
      className={cn(
        "flex flex-col gap-4 rounded-[24px] px-5 pt-5 pb-4",
        tone.wash
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-1",
          detail.stale && "opacity-45"
        )}
      >
        <p
          className={cn(
            "flex items-center gap-2.5 font-heading leading-none font-bold",
            none ? "text-[34px]" : "text-[44px]",
            tone.ink
          )}
        >
          <span aria-hidden className={cn("size-4 rounded-full", tone.fill)} />
          {VERDICT_WORD[verdict.kind]}
        </p>
        <p className={cn("text-[17px] font-semibold", tone.ink)}>
          {verdict.pct == null ? COPY.noUsual : verdictTrendDiff(verdict.pct)}
        </p>
        {!none && (
          <p className={cn("mt-1 text-[13px] leading-relaxed", tone.ink)}>
            {COPY.verdictBasis}
          </p>
        )}
      </div>
      {(detail.stale || few) && (
        <div className="flex flex-col gap-2">
          {detail.stale && (
            <Notice
              icon={<CalendarClock aria-hidden size={16} />}
              title={
                // "N주 전"은 오늘(서울)에 달려 요청 때 채운다. 그 전에는 조사일만 보인다. 이 줄 말고는 P3에 동적인 곳이 없다.
                <Suspense fallback={COPY.staleOn(detail.surveyedOn)}>
                  <StaleAgo surveyedOn={detail.surveyedOn} />
                </Suspense>
              }
              body={COPY.staleNote}
            />
          )}
          {few && <Notice icon={<Info aria-hidden size={16} />} title={COPY.fewSamples(detail.sampleSize)} body={COPY.fewSamplesNote(!none)} />}
        </div>
      )}
      <dl className="grid grid-cols-2 gap-2">
        <PriceCell
          term={COPY.nowPrice}
          value={`${won(detail.price)}원`}
          unit={detail.baseUnit}
          note={COPY.nowPriceNote(detail.surveyedOn, detail.sampleSize, detail.basis)}
        />
        {detail.usual == null ? (
          <PriceCell
            term={COPY.usual}
            value={COPY.usualPending}
            muted
            note={COPY.usualPendingNote}
          />
        ) : (
          <PriceCell
            term={COPY.usual}
            value={`${won(detail.usual)}원`}
            unit={detail.baseUnit}
            note={COPY.usualNote}
          />
        )}
      </dl>
    </section>
  )
}

/** 판정 주의 한 줄: 아이콘 · 제목(무슨 일인지) · 설명(그래서 어떻게 보면 되는지). 금액 칸과 같은 크림 면이다. */
function Notice({ icon, title, body }: { icon: React.ReactNode; title: React.ReactNode; body: string }) {
  return (
    <div role="note" className="flex gap-2 rounded-2xl bg-canvas/80 px-3 py-2.5">
      <span className="mt-px shrink-0 text-stone">{icon}</span>
      <p className="flex flex-col gap-0.5">
        <span className="text-[13px] leading-snug font-semibold text-ink">{title}</span>
        <span className="text-xs leading-relaxed text-caption">{body}</span>
      </p>
    </div>
  )
}

function PriceCell({
  term,
  value,
  unit,
  note,
  muted,
}: {
  term: string
  value: string
  unit?: string
  note: string
  muted?: boolean
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-canvas/80 p-3">
      <dt className="text-xs font-semibold text-stone">{term}</dt>
      <dd className="flex flex-col gap-1">
        <span
          className={cn(
            "font-number text-[22px] leading-none tabular-nums",
            muted ? "text-caption" : "text-ink"
          )}
        >
          {value}
          {unit && (
            <small className="ml-1 font-sans text-xs text-caption">
              ({unit})
            </small>
          )}
        </span>
        <span className="text-xs leading-snug text-caption">{note}</span>
      </dd>
    </div>
  )
}

async function StaleAgo({ surveyedOn }: { surveyedOn: string }) {
  const today = await getSeoulToday()
  return COPY.stale(surveyedOn, agoLabel(daysBetween(surveyedOn, isoDate(today))))
}
