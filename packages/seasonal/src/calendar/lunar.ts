import { TZDate } from "@date-fns/tz"

import type { CalendarDate } from "./month-calendar"
import { TIME_ZONE } from "./today"

// 명절 날짜를 해마다 손으로 넣지 않으려고 계산한다. 음력은 Intl 중국력(한국 음력과 같은 규칙), 동지는 천문 계산이다.

const chineseDate = new Intl.DateTimeFormat("en-u-ca-chinese", {
  timeZone: "UTC",
  month: "numeric",
  day: "numeric",
})

/**
 * 그 양력 연도 안에서 음력 month월 day일(평달)에 해당하는 양력 날짜. 없으면 null이다.
 * 1월 1일부터 하루씩 음력으로 바꿔 보며 찾는다(연 366번, 명절 몇 개라 가볍다).
 */
export function lunarToSolar(
  year: number,
  lunarMonth: number,
  lunarDay: number
): CalendarDate | null {
  for (
    let time = Date.UTC(year, 0, 1);
    new Date(time).getUTCFullYear() === year;
    time += 86_400_000
  ) {
    const parts = chineseDate.formatToParts(time)
    // 윤달은 month가 "6bis"처럼 나와 숫자로 바뀌지 않으므로 건너뛴다.
    const month = Number(parts.find((part) => part.type === "month")?.value)
    const day = Number(parts.find((part) => part.type === "day")?.value)
    if (month === lunarMonth && day === lunarDay) {
      const date = new Date(time)
      return { year, month: date.getUTCMonth() + 1, day: date.getUTCDate() }
    }
  }
  return null
}

// 동지: Meeus, Astronomical Algorithms ch.27(태양 황경 270°의 시각).
const SOLSTICE_TERMS = [
  [485, 324.96, 1934.136],
  [203, 337.23, 32964.467],
  [199, 342.08, 20.186],
  [182, 27.85, 445267.112],
  [156, 73.14, 45036.886],
  [136, 171.52, 22518.443],
  [77, 222.54, 65928.934],
  [74, 296.72, 3034.906],
  [70, 243.58, 9037.513],
  [58, 119.81, 33718.147],
  [52, 297.17, 150.678],
  [50, 21.02, 2281.226],
  [45, 247.54, 29929.562],
  [44, 325.15, 31555.956],
  [29, 60.93, 4443.417],
  [18, 155.12, 67555.328],
  [17, 288.79, 4562.452],
  [16, 198.04, 62894.029],
  [14, 199.76, 31436.921],
  [12, 95.39, 14577.848],
  [12, 287.11, 31931.756],
  [12, 320.81, 34777.259],
  [9, 227.73, 1222.114],
  [8, 15.45, 16859.074],
] as const
const rad = (degrees: number) => (degrees * Math.PI) / 180

/** 그해 동지의 서울 기준 양력 날짜. 12월 21일 또는 22일이다. */
export function winterSolstice(year: number): CalendarDate {
  const y = (year - 2000) / 1000
  const jde0 =
    2451900.05952 +
    365242.74049 * y -
    0.06223 * y ** 2 -
    0.00823 * y ** 3 +
    0.00032 * y ** 4
  const t = (jde0 - 2451545) / 36525
  const w = 35999.373 * t - 2.47
  const dLambda = 1 + 0.0334 * Math.cos(rad(w)) + 0.0007 * Math.cos(rad(2 * w))
  const s = SOLSTICE_TERMS.reduce(
    (sum, [a, b, c]) => sum + a * Math.cos(rad(b + c * t)),
    0
  )
  const jde = jde0 + (0.00001 * s) / dLambda
  const seoul = new TZDate((jde - 2440587.5) * 86_400_000, TIME_ZONE)
  return {
    year: seoul.getFullYear(),
    month: seoul.getMonth() + 1,
    day: seoul.getDate(),
  }
}
