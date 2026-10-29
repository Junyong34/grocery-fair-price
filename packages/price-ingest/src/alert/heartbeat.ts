// 주 1회 heartbeat (ingest-schedule/14, pipeline 5-3-1). 수집 워크플로가 매일 돌아도 커밋이 없으면 GitHub이 60일 뒤 예약 실행을 끈다.
//   1. 수집 워크플로가 꺼져 있으면 다시 켜고 알린다
//   2. 출처별 마지막 수집이 기대보다 오래 멈췄으면 알린다 (source_day)
//   3. Supabase가 일시정지됐는지 Storage 조회·DB 접속으로 본다 (04 Answer). 닿으면 열린 supabase 알림을 닫는다
//   pnpm --filter @workspace/price-ingest heartbeat
// 환경변수: GH_TOKEN(actions: write, issues: write), GH_REPO, INGEST_DATABASE_URL, SUPABASE_URL, SUPABASE_SECRET_KEY.
// .env를 스스로 읽지 않는다. heartbeat 자신도 60일 규칙으로 꺼질 수 있다: 사람이 확인할 날은 14 Answer에 적는다.
import { addDays } from "../ingest/collect.ts"
import { connectIngest, type Sql } from "../load/db.ts"
import { createObjectStore } from "../load/storage.ts"
import { kstDateOf } from "../load/window.ts"
import { actionsMaskCommands, SECRET_ENV } from "../secrets.ts"
import { ghCli, runUrlOf } from "./cli.ts"
import { raiseAlert, resolveAlerts, type Alert, type AlertSource, type Gh } from "./issues.ts"

export const INGEST_WORKFLOWS: readonly { file: string; source: AlertSource }[] = [
  { file: "ingest-kamis.yml", source: "kamis" },
  { file: "ingest-ekape.yml", source: "ekape" },
  { file: "ingest-chamga.yml", source: "chamga" },
]

// 꺼진 수집 워크플로를 켠다. 돌려주는 값: 켠 워크플로와 그 전 상태 (disabled_inactivity, disabled_manually …)
export async function enableWorkflows(gh: Gh): Promise<{ file: string; source: AlertSource; state: string }[]> {
  const out = await gh(["workflow", "list", "--all", "--json", "path,state"])
  const states = new Map((JSON.parse(out || "[]") as { path: string; state: string }[]).map((w) => [w.path.split("/").pop()!, w.state]))
  const enabled = []
  for (const w of INGEST_WORKFLOWS) {
    const state = states.get(w.file)
    if (state === undefined) throw new Error(`워크플로 ${w.file}가 저장소에 없다`)
    if (state === "active") continue
    await gh(["workflow", "enable", w.file])
    enabled.push({ ...w, state })
  }
  return enabled
}

export type SourceProgress = {
  source: "kamis" | "ekape" | "chamga"
  lastOk: string | null // 마지막으로 ok(또는 일부)인 날 (YYYY-MM-DD)
  lastChecked: string | null // 수집이 그 출처의 날 상태를 마지막으로 기록한 시각 (ISO)
}

// 기대값 (2026-10-29 운영 source_day로 정했다):
//   KAMIS·축평원: 주말에도 행이 와서 매일 ok다. 매일 수집이 어제까지 받으므로 마지막 ok는 어제. 그보다 2일 넘게 멈추면 알린다
//   참가격: 조사일이 2~3주 간격이고 등록이 조사일 뒤 10일까지 퍼진다. 그래서 두 가지를 본다
//     - 수집이 도나: 매일 실행이 감지 결과를 기록한다(last_checked_at). 3일 넘게 기록이 없으면 멈춘 것이다
//     - 데이터가 오나: 마지막 ok 조사일이 35일(가장 긴 간격 3주 + 등록 10일 + 여유)보다 오래면 알린다
export const DAILY_STALE_DAYS = 3
export const CHAMGA_CHECK_STALE_DAYS = 3
export const CHAMGA_SURVEY_STALE_DAYS = 35

export function staleSources(progress: readonly SourceProgress[], now: Date): { source: SourceProgress["source"]; summary: string }[] {
  const today = kstDateOf(now.toISOString())
  const stale = []
  for (const p of progress) {
    if (p.source === "chamga") {
      const checkedDays = p.lastChecked === null ? null : (now.getTime() - Date.parse(p.lastChecked)) / 86_400_000
      if (checkedDays === null || checkedDays > CHAMGA_CHECK_STALE_DAYS) {
        stale.push({ source: p.source, summary: `조사일 감지 기록이 ${CHAMGA_CHECK_STALE_DAYS}일 넘게 없다 (마지막 ${p.lastChecked ?? "없음"})` })
      } else if (p.lastOk === null || p.lastOk < addDays(today, -CHAMGA_SURVEY_STALE_DAYS)) {
        stale.push({ source: p.source, summary: `받은 조사일이 ${CHAMGA_SURVEY_STALE_DAYS}일 넘게 없다 (마지막 ${p.lastOk ?? "없음"})` })
      }
    } else if (p.lastOk === null || p.lastOk < addDays(today, -DAILY_STALE_DAYS)) {
      stale.push({ source: p.source, summary: `마지막으로 받은 날이 ${p.lastOk ?? "없음"}이다 (오늘 ${today}, 기대 어제)` })
    }
  }
  return stale
}

async function readProgress(sql: Sql): Promise<SourceProgress[]> {
  const rows = await sql<{ source: SourceProgress["source"]; last_ok: string | null; last_checked: string | null }[]>`
    select s.source,
           (select max(d.target_date)::text from price.source_day d where d.source = s.source and d.status in ('ok', 'partial')) as last_ok,
           (select max(d.last_checked_at) from price.source_day d where d.source = s.source) as last_checked
      from (values ('kamis'), ('ekape'), ('chamga')) s (source)`
  return rows.map((r) => ({ source: r.source, lastOk: r.last_ok, lastChecked: r.last_checked === null ? null : new Date(r.last_checked).toISOString() }))
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`환경변수 ${name}가 없다`)
  return value
}

// 오류에서 상태 코드·종류만 남긴다 (주소·키를 알림에 넣지 않는다)
function reasonOf(error: unknown): string {
  if (error instanceof Error && "status" in error) return `HTTP ${String((error as { status: unknown }).status)}`
  if (error instanceof Error && "code" in error) return String((error as { code: unknown }).code)
  return error instanceof Error ? error.name : "알 수 없는 오류"
}

export async function runHeartbeat(gh: Gh, now = new Date()): Promise<string[]> {
  const log: string[] = []
  const alert = (a: Omit<Alert, "runUrl" | "at">) => raiseAlert(gh, { ...a, runUrl: runUrlOf(process.env), at: now.toISOString() })

  for (const w of await enableWorkflows(gh)) {
    log.push(`다시 켬: ${w.file} (${w.state})`)
    await alert({ source: w.source, cause: "workflow_disabled", summary: `${w.file}가 ${w.state} 상태였다. heartbeat가 다시 켰다` })
  }
  if (log.length === 0) log.push("수집 워크플로: 모두 켜져 있다")

  let supabaseOk = true
  try {
    const store = createObjectStore({ url: required("SUPABASE_URL"), secretKey: required("SUPABASE_SECRET_KEY") })
    await store.list("chamga/")
  } catch (error) {
    supabaseOk = false
    log.push(`Storage 조회 실패: ${reasonOf(error)}`)
    await alert({ source: "supabase", cause: "storage_failed", summary: `heartbeat의 Storage 조회가 실패했다 (${reasonOf(error)}). 일시정지면 HTTP 540` })
  }

  const sql = connectIngest(required("INGEST_DATABASE_URL"))
  try {
    const progress = await readProgress(sql)
    for (const p of progress) log.push(`${p.source}: 마지막 ok ${p.lastOk ?? "없음"}, 마지막 기록 ${p.lastChecked ?? "없음"}`)
    for (const s of staleSources(progress, now)) {
      log.push(`멈춤: ${s.source} ${s.summary}`)
      await alert({ source: s.source, cause: "stale", summary: s.summary })
    }
  } catch (error) {
    supabaseOk = false
    log.push(`DB 접속 실패: ${reasonOf(error)}`)
    await alert({ source: "supabase", cause: "db_unreachable", summary: `heartbeat의 DB 접속이 실패했다 (${reasonOf(error)})` })
  } finally {
    await sql.end({ timeout: 5 })
  }

  if (supabaseOk) {
    const closed = await resolveAlerts(gh, "supabase", "heartbeat에서 Storage·DB에 닿아 닫는다.")
    if (closed.length > 0) log.push(`supabase 알림 ${closed.map((n) => `#${n}`).join(", ")}를 닫았다`)
  }
  return log
}

if (import.meta.main) {
  if (process.env.GITHUB_ACTIONS === "true") {
    for (const line of actionsMaskCommands(SECRET_ENV.map((name) => process.env[name]))) console.log(line)
  }
  runHeartbeat(ghCli)
    .then((log) => {
      for (const line of log) console.log(line)
    })
    .catch((error: unknown) => {
      console.error(`heartbeat 실패: ${reasonOf(error)}`)
      process.exitCode = 1
    })
}
