// 생성 시각은 UTC ISO 문자열로 기록된다(BuildRecord.generatedAt). 관리자는 한국에 있으므로 화면에는 서울 시간으로 보여 준다.
// 서버와 브라우저의 시간대가 달라도 같은 글자가 나오도록 timeZone을 고정한다.

const parts = (iso: string) =>
  Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date(iso))
      .map(({ type, value }) => [type, value]),
  ) as Record<"year" | "month" | "day" | "hour" | "minute", string>

/** "2026-10-16 22:11" (서울 시간) */
export function formatBuildTime(iso: string): string {
  const p = parts(iso)
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`
}

/** "2026-10-16" (서울 날짜) */
export function formatBuildDate(iso: string): string {
  const p = parts(iso)
  return `${p.year}-${p.month}-${p.day}`
}
