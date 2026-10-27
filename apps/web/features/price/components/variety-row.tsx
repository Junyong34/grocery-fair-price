import Link from "next/link"

import { cn } from "@workspace/ui/lib/utils"

import { PRICE_COPY } from "@workspace/price/copy"
import { won } from "@workspace/price/format"
import type { VarietySummary } from "@workspace/price/types"

import { routes } from "@/shared/routes"

import { VerdictChip } from "./verdict-chip"

/**
 * 목록 열 네 개: 품종 | 판정 칩 | 가격 두 줄 | 동작. P1 · P2 · P4의 모든 목록이 같은 폭을 쓴다.
 * 행은 subgrid라 열 제목(ROW_COLUMNS를 쓰는 줄)과도 맞는다.
 */
export const ROW_COLUMNS = "grid grid-cols-[minmax(0,1fr)_5.75rem_5.25rem_2.5rem] items-center gap-x-2"

/** 품종 이름 아래 작은 줄: "상품 · 1포기" */
export function varietySub(variety: Pick<VarietySummary, "spec" | "baseUnit">): string {
  return variety.spec ? `${variety.spec} · ${variety.baseUnit}` : variety.baseUnit
}

/** 가격 두 줄: 위는 시세, 아래는 평소가(없으면 "평소가 없음"). */
export function PricePair({ variety }: { variety: Pick<VarietySummary, "price" | "usual"> }) {
  return (
    <span className="flex flex-col items-end leading-tight tabular-nums">
      <span className="text-[15px] font-semibold text-ink">{won(variety.price)}원</span>
      <span className="text-xs text-caption">
        {variety.usual == null ? PRICE_COPY.row.noUsual : PRICE_COPY.row.usual(won(variety.usual))}
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
    <li className={cn(ROW_COLUMNS, "border-b border-hairline py-2.5 last:border-b-0", className)}>
      <Link
        href={routes.price.variety(variety.id)}
        className="col-span-3 grid grid-cols-subgrid items-center rounded-lg no-underline outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring"
      >
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-[15px] font-semibold text-ink">{name ?? variety.name}</span>
          <span className="truncate text-xs text-caption">{varietySub(variety)}</span>
        </span>
        <span className="justify-self-start">
          <VerdictChip verdict={variety.verdict} />
        </span>
        <span className="justify-self-end">
          <PricePair variety={variety} />
        </span>
      </Link>
      <span className="justify-self-end">{action}</span>
      {footer && <div className="col-span-4 pt-1.5">{footer}</div>}
    </li>
  )
}

/** 목록 위 설명 한 줄: "시세 오늘 조사한 곳들의 중간값 · 평소 이맘때 보통 가격" */
export function PriceHint({ className }: { className?: string }) {
  return (
    <p className={cn("flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-caption", className)}>
      {PRICE_COPY.hint.map(({ term, text }) => (
        <span key={term}>
          <b className="mr-1 font-semibold text-stone">{term}</b>
          {text}
        </span>
      ))}
    </p>
  )
}
