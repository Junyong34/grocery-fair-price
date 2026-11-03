import Link from "next/link"

import { cn } from "@workspace/ui/lib/utils"

import { PRICE_COPY } from "@workspace/price/copy"
import { monthDay, won } from "@workspace/price/format"
import type { VarietySummary } from "@workspace/price/types"

import { routes } from "@/shared/routes"

import { VerdictChip } from "./verdict-chip"

/**
 * 모바일은 품종·판정과 시세를 묶고, 넓은 화면은 네 열로 정렬한다. P1 · P2 · P4 공통.
 */
export const ROW_COLUMNS =
  "grid grid-cols-[minmax(0,1fr)_2.75rem] items-center gap-x-3 sm:grid-cols-[minmax(0,1fr)_4.5rem_7rem_2.75rem]"

/** 품종 이름 아래 작은 줄: "상품 · 1포기" */
export function varietySub(
  variety: Pick<VarietySummary, "spec" | "baseUnit">
): string {
  return variety.spec
    ? `${variety.spec} · ${variety.baseUnit}`
    : variety.baseUnit
}

/** 가격 두 줄: 위는 시세, 아래는 평소가(없으면 "평소가 없음"). */
export function PricePair({
  variety,
}: {
  variety: Pick<VarietySummary, "price" | "usual">
}) {
  return (
    <span className="flex flex-col items-end leading-tight tabular-nums">
      <span className="text-lg leading-tight font-semibold text-ink">
        {won(variety.price)}원
      </span>
      <span className="mt-1 text-[13px] whitespace-nowrap text-caption">
        {variety.usual == null
          ? PRICE_COPY.row.noUsual
          : PRICE_COPY.row.usual(won(variety.usual))}
      </span>
    </span>
  )
}

/**
 * 품종 행. 이름 · 칩 · 가격을 누르면 P3 상세로, action(+ 담기, × 빼기)은 따로 누른다.
 * name은 검색어를 표시한 이름처럼 이름 자리를 바꿀 때 넘긴다. footer는 행 아래 한 줄(P4 "판정이 바뀐 품종").
 */
export function VarietyRow({
  variety,
  name,
  action,
  footer,
  className,
}: {
  variety: VarietySummary
  name?: React.ReactNode
  action?: React.ReactNode
  footer?: React.ReactNode
  className?: string
}) {
  return (
    <li
      className={cn(
        ROW_COLUMNS,
        "border-b border-hairline last:border-b-0",
        className
      )}
    >
      <Link
        href={routes.price.variety(variety.id)}
        className="grid min-h-20 min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 rounded-lg py-2.5 no-underline outline-offset-2 hover:bg-mat focus-visible:outline-2 focus-visible:outline-ring active:bg-mat sm:col-span-3 sm:grid-cols-subgrid"
      >
        <span className="flex min-w-0 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-base leading-snug font-semibold [overflow-wrap:anywhere] break-keep text-ink">
              {name ?? variety.name}
            </span>
            <span className="sm:hidden">
              <VerdictChip verdict={variety.verdict} />
            </span>
          </span>
          <span className="text-[13px] leading-snug [overflow-wrap:anywhere] break-keep text-caption">
            {varietySub(variety)}
          </span>
        </span>
        <span className="hidden justify-self-start sm:inline-flex">
          <VerdictChip verdict={variety.verdict} />
        </span>
        <span className="flex flex-col items-end gap-0.5 justify-self-end">
          <PricePair variety={variety} />
          <span className="text-xs text-caption">
            <time dateTime={variety.surveyedOn}>
              {monthDay(variety.surveyedOn)}
            </time>{" "}
            조사
            {variety.stale && (
              <span className="ml-1 font-semibold text-stone">
                {PRICE_COPY.row.stale}
              </span>
            )}
          </span>
        </span>
      </Link>
      <span className="justify-self-end">{action}</span>
      {footer && <div className="col-span-full pb-3">{footer}</div>}
    </li>
  )
}

/** 최근 시세·평소가·판정이 서로 다른 기준이라는 안내. */
export function PriceHint({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 text-[13px] leading-relaxed text-caption",
        className
      )}
    >
      <p className="flex flex-wrap gap-x-3 gap-y-0.5">
        {PRICE_COPY.hint.map(({ term, text }) => (
          <span key={term}>
            <b className="mr-1 font-semibold text-stone">{term}</b>
            {text}
          </span>
        ))}
      </p>
      <p>{PRICE_COPY.judgmentHint}</p>
    </div>
  )
}
