// KAMIS·축평원 source_day 읽기·쓰기 (pipeline 3-5, ingest-schedule/08). 규칙은 ingest/fill-gaps.ts.
// 행이 온 날의 ok는 적재(observation.ts settleSourceDays)가 먼저 정한다. 여기서는 실행이 확인한 모든 날에 행을 만들고
// 행이 없는 날의 상태(pending·failed·empty_unexpected)와 확인 횟수를 남긴다.
import { addDays } from "../ingest/collect.ts"
import { nextDayState, type DayState, type SourceDayStatus } from "../ingest/fill-gaps.ts"
import { baselineOf, judgeItems, SAME_WEEKDAY_WEEKS, type PartHistory } from "../ingest/partial.ts"
import type { Sql, Tx } from "./db.ts"

type DailySource = "kamis" | "ekape"

export async function readDayStates(sql: Sql | Tx, source: DailySource, days: readonly string[]): Promise<Map<string, DayState>> {
  if (days.length === 0) return new Map()
  const rows = await sql<{ day: string; status: SourceDayStatus; attempts: number; row_count: number }[]>`
    select target_date::text as day, status, attempts, row_count
      from price.source_day
     where source = ${source} and target_date in (select (jsonb_array_elements_text(${sql.json([...days])}))::date)`
  return new Map(rows.map((r) => [r.day, { status: r.status, attempts: r.attempts, rowCount: r.row_count }]))
}

export type SettledDay = { day: string; status: SourceDayStatus; attempts: number }

// 실행이 확인한 날마다 상태를 정해 쓴다. errorCode: 깨끗하지 않았던 실행의 사유 (failed인 날의 last_error_code)
export async function settleCheckedDays(
  sql: Sql | Tx,
  source: DailySource,
  days: readonly string[],
  input: { today: string; clean: boolean; errorCode: string | null },
): Promise<SettledDay[]> {
  const states = await readDayStates(sql, source, days)
  const settled = days.map((day) => {
    const current = states.get(day) ?? null
    return { day, ...nextDayState({ day, today: input.today, rowCount: current?.rowCount ?? 0, clean: input.clean, current }) }
  })
  if (settled.length === 0) return settled
  await sql`
    insert into price.source_day as d (source, target_date, status, attempts, last_checked_at, last_error_code)
    select ${source}, x.day, x.status, x.attempts, now(), case when x.status = 'failed' then ${input.errorCode}::text end
      from jsonb_to_recordset(${sql.json(settled)}) as x (day date, status text, attempts smallint)
    on conflict (source, target_date) do update
      set status = excluded.status, attempts = excluded.attempts, last_checked_at = now(),
          last_error_code = case when excluded.status = 'failed' then excluded.last_error_code else d.last_error_code end`
  return settled
}

// 출처별 마지막 정상 날짜 (source_day만 본다). 수집 상태 화면과 heartbeat가 같은 뜻으로 쓴다
export async function lastOkDays(sql: Sql | Tx): Promise<Map<string, string | null>> {
  const rows = await sql<{ source: string; last_ok: string | null }[]>`
    select s.source, (select max(d.target_date)::text from price.source_day d where d.source = s.source and d.status = 'ok') as last_ok
      from (values ('kamis'), ('ekape'), ('chamga')) s (source)`
  return new Map(rows.map((r) => [r.source, r.last_ok]))
}

// KAMIS 일부만 옴 (ingest-foundation/05, pipeline 5-2): 확인한 날마다 품목별 건수를 source_day_part(item)에 남기고,
// 행이 온 날(ok·partial)의 상태를 판정대로 ok·partial로 맞춘다. 규칙은 ingest/partial.ts
export async function judgeKamisItemParts(sql: Sql | Tx, days: readonly string[]): Promise<{ day: string; holiday: boolean; short: string[] }[]> {
  if (days.length === 0) return []
  const [param] = await sql<{ value: unknown }[]>`select value from price.calc_param where key = 'kamis.partial.item_ratio'`
  const ratio = Number(param?.value)
  if (!(ratio > 0)) throw new Error("calc_param kamis.partial.item_ratio가 없거나 양수가 아니다")
  const dayList = sql.json([...days])
  const history = days.flatMap((d) => Array.from({ length: SAME_WEEKDAY_WEEKS }, (_, i) => addDays(d, -7 * (i + 1))))
  const counts = await sql<{ day: string; item: string; livestock: boolean; rows: number }[]>`
    select o.obs_date::text as day, si.key_parts->>'item_cd' as item, (si.key_parts->>'ctgry_cd') = '500' as livestock, count(*)::int as rows
      from price.observation o
      join price.source_item si on si.id = o.source_item_id and si.source = 'kamis'
     where o.obs_date in (select (jsonb_array_elements_text(${dayList}))::date)
     group by 1, 2, 3`
  const past = await sql<PartHistory[]>`
    select target_date::text as day, part_key as item, row_count as rows, status from price.source_day_part
     where source = 'kamis' and part_kind = 'item'
       and target_date in (select (jsonb_array_elements_text(${sql.json(history)}))::date)`
  const states = await readDayStates(sql, "kamis", days)
  const out = []
  for (const day of days) {
    const state = states.get(day)
    if (state === undefined || (state.status !== "ok" && state.status !== "partial")) continue
    const result = judgeItems(
      counts.filter((c) => c.day === day),
      baselineOf(past, day),
      ratio,
    )
    await sql`delete from price.source_day_part where source = 'kamis' and target_date = ${day} and part_kind = 'item'`
    if (result.parts.length > 0) {
      await sql`
        insert into price.source_day_part (source, target_date, part_kind, part_key, row_count, baseline, status)
        select 'kamis', ${day}::date, 'item', x.item, x.rows, round(x.baseline)::int, x.status
          from jsonb_to_recordset(${sql.json(result.parts)}) as x (item text, rows int, baseline numeric, status text)`
    }
    await sql`
      update price.source_day set status = ${result.partial ? "partial" : "ok"}
       where source = 'kamis' and target_date = ${day} and status in ('ok', 'partial')`
    out.push({ day, holiday: result.holiday, short: result.parts.filter((p) => p.status !== "ok").map((p) => p.item) })
  }
  return out
}
