const parts = (iso: string) =>
  Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date(iso))
      .map(({ type, value }) => [type, value]),
  ) as Record<"year" | "month" | "day" | "hour" | "minute", string>

export function formatBuildTime(iso: string): string {
  const p = parts(iso)
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`
}

export function formatBuildDate(iso: string): string {
  const p = parts(iso)
  return `${p.year}-${p.month}-${p.day}`
}
