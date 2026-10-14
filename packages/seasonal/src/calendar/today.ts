import { TZDate } from "@date-fns/tz"

export const TIME_ZONE = "Asia/Seoul"

/** 서울 기준 지금. 서버(UTC)와 브라우저 어디서 불러도 같은 날짜가 나온다. */
export function seoulNow(): TZDate {
  return new TZDate(Date.now(), TIME_ZONE)
}

/** 서울 기준 이번 달(1~12). */
export function currentMonth(): number {
  return seoulNow().getMonth() + 1
}
