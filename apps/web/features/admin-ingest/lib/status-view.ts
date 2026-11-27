// 수집 상태 화면의 모양 (ingest-foundation/05, pipeline 5-3). DB를 모르는 순수 함수다. 읽기는 server/status.ts.

export const SOURCES = ["kamis", "ekape", "chamga"] as const
export type Source = (typeof SOURCES)[number]

export const SOURCE_LABEL: Record<Source, string> = { kamis: "KAMIS", ekape: "축평원", chamga: "참가격" }

export type DayStatus = "pending" | "ok" | "partial" | "empty_expected" | "empty_unexpected" | "failed"

// source_day의 상태 뜻 (pipeline 3-5)
export const DAY_STATUS_LABEL: Record<DayStatus | "none", string> = {
  ok: "받음",
  partial: "일부만 옴",
  pending: "아직 안 옴",
  failed: "호출 실패",
  empty_expected: "휴일·빈 조사일",
  empty_unexpected: "와야 하는데 빔",
  none: "기록 없음",
}

export type DayRow = { source: Source; day: string; status: DayStatus; rowCount: number; attempts: number; correctionCount: number }

export type RunRow = {
  id: number
  source: Source | "all"
  job: string
  startedAt: string
  status: "running" | "ok" | "partial" | "failed"
  errorCode: string | null
  callsUsed: number
}

export type PartRow = { source: Source; day: string; item: string; rows: number; baseline: number | null; status: "partial" | "missing" }

const addDays = (day: string, n: number) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)

// 출처 × 날짜 칸. today 전날까지 days일, 오래된 날부터
export function dayGrid(rows: readonly DayRow[], today: string, days: number) {
  const dates = Array.from({ length: days }, (_, i) => addDays(today, i - days))
  const by = new Map(rows.map((r) => [`${r.source}|${r.day}`, r]))
  return {
    days: dates,
    rows: SOURCES.map((source) => ({
      source,
      cells: dates.map((d) => {
        const r = by.get(`${source}|${d}`)
        return { day: d, status: (r?.status ?? "none") as DayStatus | "none", rowCount: r?.rowCount ?? 0, attempts: r?.attempts ?? 0 }
      }),
    })),
  }
}

// 끝나지 않은 날: 다시 받거나 사람이 봐야 하는 날 (빈 날 메우기가 다시 받는 상태 + 닫힌 빈 날)
const UNSETTLED: ReadonlySet<DayStatus> = new Set(["pending", "partial", "failed", "empty_unexpected"])

export function summarizeSources(rows: readonly DayRow[], lastOk: ReadonlyMap<string, string | null>) {
  return SOURCES.map((source) => {
    const mine = rows.filter((r) => r.source === source)
    return {
      source,
      lastOk: lastOk.get(source) ?? null,
      unsettled: mine.filter((r) => UNSETTLED.has(r.status)).length,
      corrections: mine.reduce((sum, r) => sum + r.correctionCount, 0),
    }
  })
}
