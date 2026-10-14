import { formatSeasonMonths, MONTHS } from "@workspace/seasonal/data/months"
import { cn } from "@workspace/ui/lib/utils"

/** 12칸 제철 기간 막대. 제철인 달은 gold, 나머지는 hairline. 읽는 사람에게는 "제철 9·10월" 문구로 전한다. */
export function SeasonMonthsBar({ months, className }: { months: readonly number[]; className?: string }) {
  return (
    <div role="img" aria-label={formatSeasonMonths(months)} className={cn("grid grid-cols-12 gap-0.5", className)}>
      {MONTHS.map((month) => (
        <span key={month} className={cn("h-1 rounded-full", months.includes(month) ? "bg-gold" : "bg-hairline")} />
      ))}
    </div>
  )
}
