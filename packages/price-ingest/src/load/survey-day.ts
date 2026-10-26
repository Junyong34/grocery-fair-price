// 참가격 조사일 상태 읽기·쓰기 (source_day, pipeline 3-5). 규칙은 ingest/chamga-schedule.ts.
import type { SurveyDayState } from "../ingest/chamga-schedule.ts"
import type { Sql, Tx } from "./db.ts"

export async function readSurveyDays(sql: Sql | Tx, days: readonly string[]): Promise<Map<string, SurveyDayState>> {
  const rows = await sql<
    { day: string; status: string; closed_at: Date | null; stable_checks: number; row_count: number; max_reg: Date | null }[]
  >`
    select target_date::text as day, status, closed_at, stable_checks, row_count, max_source_registered_at as max_reg
      from price.source_day
     where source = 'chamga' and target_date in (select (jsonb_array_elements_text(${sql.json([...days])}))::date)`
  return new Map(
    rows.map((row) => [
      row.day,
      {
        status: row.status,
        closedAt: row.closed_at?.toISOString() ?? null,
        stableChecks: row.stable_checks,
        rowCount: row.row_count,
        maxRegisteredAt: row.max_reg?.toISOString() ?? null,
      },
    ]),
  )
}

// 감지했는데 아직 없다: 아직 안 옴(pending)으로 두고 본 시각만 남긴다
export async function markNotYet(sql: Sql | Tx, day: string): Promise<void> {
  await sql`
    insert into price.source_day as d (source, target_date, status, attempts, last_checked_at)
    values ('chamga', ${day}, 'pending', 1, now())
    on conflict (source, target_date) do update set attempts = d.attempts + 1, last_checked_at = now()`
}

// 금요일 뒤 10일이 지나도 없다: 빈 조사일(empty_expected)로 닫는다 (chamgagyeok.md 5-4)
export async function closeEmpty(sql: Sql | Tx, day: string): Promise<void> {
  await sql`
    insert into price.source_day as d (source, target_date, status, attempts, last_checked_at, closed_at)
    values ('chamga', ${day}, 'empty_expected', 1, now(), now())
    on conflict (source, target_date) do update
      set status = 'empty_expected', attempts = d.attempts + 1, last_checked_at = now(), closed_at = now()`
}

export async function rowCountOf(sql: Sql | Tx, day: string): Promise<number> {
  const [row] = await sql<{ row_count: number }[]>`
    select row_count from price.source_day where source = 'chamga' and target_date = ${day}`
  return row?.row_count ?? 0
}

// 전체를 받은 뒤: 행 수가 연속으로 같았던 횟수를 남기고, 마지막 받기였으면 닫는다
export async function recordFetch(
  sql: Sql | Tx,
  day: string,
  input: { stableChecks: number | null; close: boolean },
): Promise<void> {
  await sql`
    update price.source_day
       set attempts = attempts + 1, last_checked_at = now(),
           stable_checks = coalesce(${input.stableChecks}::smallint, stable_checks),
           closed_at = case when ${input.close} then now() else closed_at end
     where source = 'chamga' and target_date = ${day}`
}
