import { TodayShow, todayKey } from "@/shared/today-mark"

/** 이번 달(서울 기준 오늘)이면 "이번 달" 태그. 정적 HTML에 숨겨 두고 브라우저가 첫 그리기 전에 켠다. */
export function ThisMonthTag({ month }: { month: number }) {
  return (
    <TodayShow when={todayKey.month(month)}>
      <span className="shrink-0 rounded-[3px] border border-gold bg-gold-wash px-1.5 py-0.5 text-[11px] text-gold-deep">
        이번 달
      </span>
    </TodayShow>
  )
}
