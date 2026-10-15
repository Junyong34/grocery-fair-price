import * as holidaysByYear from "@hyunbinseo/holidays-kr/all"

/** 한 달의 공휴일. 날짜(일) → 그날의 공휴일 이름(대체공휴일 포함). 공휴일이 아닌 날은 키가 없다. */
export type MonthHolidays = Readonly<Record<number, readonly string[]>>

const HOLIDAYS: Record<string, readonly string[]> = Object.assign({}, ...Object.values(holidaysByYear))

/**
 * 공휴일 데이터는 @hyunbinseo/holidays-kr(관보 기준)에서 온다. 데이터가 없는 연도는 공휴일이 없는 것으로 본다.
 * 모든 연도의 데이터를 품고 있으므로 서버에서 부르고, 클라이언트에는 결과(그 달 몇 줄)만 넘긴다.
 */
export function holidaysInMonth(year: number, month: number): MonthHolidays {
  const prefix = `${year}-${String(month).padStart(2, "0")}-`
  const days: Record<number, readonly string[]> = {}
  for (const [date, names] of Object.entries(HOLIDAYS)) {
    if (date.startsWith(prefix)) days[Number(date.slice(prefix.length))] = names
  }
  return days
}
