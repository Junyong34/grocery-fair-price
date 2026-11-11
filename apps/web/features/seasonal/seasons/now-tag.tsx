import { SEASON_MONTHS, type Season } from "@workspace/seasonal/data/seasons"

import { TodayShow, todayKey } from "@/shared/today-mark"

/** 지금(서울 기준 오늘) 계절이면 "지금 계절" 태그. 정적 HTML에 숨겨 두고 브라우저가 첫 그리기 전에 켠다. */
export function NowTag({ season }: { season: Season }) {
  return (
    <TodayShow when={SEASON_MONTHS[season].map(todayKey.month)}>
      <span className="shrink-0 rounded-[3px] border border-gold bg-gold-wash px-2 py-0.5 text-[11px] tracking-normal text-gold-deep">
        지금<span className="hidden @[300px]:inline"> 계절</span>
      </span>
    </TodayShow>
  )
}
