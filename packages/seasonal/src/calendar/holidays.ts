import * as holidaysByYear from "@hyunbinseo/holidays-kr/all"

/** 한 달의 공휴일. 날짜(일) → 그날의 공휴일 이름(대체공휴일 포함). 공휴일이 아닌 날은 키가 없다. */
export type MonthHolidays = Readonly<Record<number, readonly string[]>>

const HOLIDAYS: Record<string, readonly string[]> = Object.assign({}, ...Object.values(holidaysByYear))

/** 관보의 법정 이름 → 화면에 적는 이름. 대체공휴일 괄호 안 이름도 함께 바뀐다. */
const DISPLAY_NAMES: Readonly<Record<string, string>> = { 기독탄신일: "크리스마스" }

function displayName(name: string): string {
  return Object.entries(DISPLAY_NAMES).reduce((text, [legal, shown]) => text.replace(legal, shown), name)
}

/**
 * 공휴일 데이터는 @hyunbinseo/holidays-kr(관보 기준)에서 온다. 이름은 DISPLAY_NAMES로 익숙한 말로 바꿔 적는다. 데이터가 없는 연도는 공휴일이 없는 것으로 본다.
 * 모든 연도의 데이터를 품고 있으므로 서버에서 부르고, 클라이언트에는 결과(그 달 몇 줄)만 넘긴다.
 */
export function holidaysInMonth(year: number, month: number): MonthHolidays {
  const prefix = `${year}-${String(month).padStart(2, "0")}-`
  const days: Record<number, readonly string[]> = {}
  for (const [date, names] of Object.entries(HOLIDAYS)) {
    if (date.startsWith(prefix)) days[Number(date.slice(prefix.length))] = names.map(displayName)
  }
  return days
}
