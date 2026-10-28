// KAMIS 소매 백필 실행 한 번 (ingest-foundation/04, pipeline 3-9 보관 1).
// 묶음(품목 × 해)마다: 호출 → 원본 Storage 업로드 → raw_object(pending_load) → 적재 한 트랜잭션 → 90일 안의 날 재계산 → backfill_task.
// 적재는 정기 수집과 같은 loadRawFile이다. 헤더 job = backfill이라 90일 밖의 날은 관측값에 넣지 않고 임시 표에서 바로 시세 요약으로 낸다.
// 묶음 진행은 backfill_task에 남아 중간에 끊겨도 다음 실행이 done이 아닌 묶음부터 이어 받는다.
// 같은 키의 일일 한도(10,000)를 정기 수집과 함께 쓴다. 정기 수집이 끝난 뒤에 돌리고 실행마다 예산을 둔다.
import { ADAPTER_VERSION } from "../adapt/draft.ts"
import { contractBaselineVersion } from "../contract/probes.ts"
import type { FetchLike } from "../http.ts"
import { CallBudget, realSleep, type Sleep, type StopReason } from "../ingest/calls.ts"
import { collectKamisRange, type CollectContext } from "../ingest/collect.ts"
import { EXIT, type IngestEnv } from "../ingest/run.ts"
import { datesOfRawObjects, recomputeDailyQuote } from "../load/daily-quote.ts"
import { connectIngest, transaction, type Sql } from "../load/db.ts"
import { finishRun, registerPending, registerRun } from "../load/ledger.ts"
import { loadRawFile } from "../load/load-file.ts"
import { buildRawFile, callKeyOf, rawObjectKey, storagePathOf } from "../load/raw-file.ts"
import { createObjectStore, type ObjectStore } from "../load/storage.ts"
import { kstDateOf } from "../load/window.ts"
import { createRedactor, errorSummary } from "../secrets.ts"
import { backfillTasks, taskRange, type BackfillTask } from "./plan.ts"

// 실행 한 번의 기본 호출 예산. 일일 한도 10,000에서 정기 수집 몫(KAMIS 약 150~300, 참가격 최대 1,500, 축평원 21)을 뺀다
export const BACKFILL_BUDGET = 6_000

// 묶음을 시작하기 전에 이보다 크면 멈춘다. 무료 500MB를 넘으면 DB가 읽기 전용이 된다 (pipeline 3-9 보관 1, MB = 10⁶B)
export const MAX_DB_BYTES = 400_000_000

export type BackfillRequest = {
  years?: number
  items?: readonly string[] // 품목 코드. 없으면 백필 대상 전부
  budget?: number
}

export type BackfillDeps = {
  env: IngestEnv
  fetch?: FetchLike
  store?: ObjectStore
  connect?: (url: string) => Sql
  now?: () => Date
  sleep?: Sleep
  delays?: readonly number[]
  log?: (line: string) => void
  gitSha?: string | null
  maxDbBytes?: number
}

export type BackfillResult = {
  exitCode: number
  runId: number | null
  errorCode: string | null
  done: string[] // 이번에 끝낸 task_key
  failed: string[]
  remaining: number // 이번 실행 뒤에도 done이 아닌 묶음 수
  callsUsed: number
}

type TaskStatus = "pending" | "running" | "done" | "failed"

// 이 실행이 멈춘 이유: 호출 정책의 멈춤, DB 크기, 원본 업로드 실패
type Stop = StopReason | "db_size_limit" | "storage_failed"

async function setTask(
  sql: Sql,
  taskKey: string,
  update: { status: TaskStatus; rows?: number; calls?: number; errorCode?: string | null },
): Promise<void> {
  const finished = update.status === "done" || update.status === "failed"
  await sql`
    update price.backfill_task
       set status = ${update.status}, rows = ${update.rows ?? null}, calls = ${update.calls ?? null},
           finished_at = ${finished ? sql`now()` : null}, last_error_code = ${update.errorCode ?? null}
     where source = 'kamis' and task_key = ${taskKey}`
}

export async function runBackfill(request: BackfillRequest, deps: BackfillDeps): Promise<BackfillResult> {
  const now = deps.now ?? (() => new Date())
  const log = deps.log ?? ((line: string) => console.log(line))
  const redact = createRedactor([deps.env.serviceKey, deps.env.secretKey, deps.env.databaseUrl])
  const say = (line: string) => log(redact(line))
  const startedAt = now().toISOString()
  const today = kstDateOf(startedAt)
  const budget = new CallBudget(request.budget ?? BACKFILL_BUDGET)
  const store = deps.store ?? createObjectStore({ url: deps.env.supabaseUrl, secretKey: deps.env.secretKey })
  const tasks = backfillTasks(today, { years: request.years, items: request.items })
  const result: BackfillResult = { exitCode: EXIT.ok, runId: null, errorCode: null, done: [], failed: [], remaining: 0, callsUsed: 0 }

  // 원본 업로드보다 DB가 먼저다: 진행 기록 없이 받으면 다음 실행이 같은 묶음을 또 받는다
  let sql: Sql
  try {
    sql = (deps.connect ?? connectIngest)(deps.env.databaseUrl)
    // 백필은 한 번에 하나만. 세션 lock이라 접속이 끊기면 풀린다 (접속은 하나, db.ts)
    const [lock] = await sql<{ ok: boolean }[]>`select pg_try_advisory_lock(hashtext('backfill:kamis')) as ok`
    if (!lock?.ok) {
      say("다른 백필이 돌고 있어 끝낸다")
      await sql.end({ timeout: 5 })
      return { ...result, exitCode: EXIT.partial, errorCode: "already_running" }
    }
    result.runId = await registerRun(sql, { source: "kamis", job: "backfill", callBudget: budget.limit, startedAt })
    await sql`
      insert into price.backfill_task (source, task_key, status)
      select 'kamis', k, 'pending' from jsonb_array_elements_text(${sql.json(tasks.map((t) => t.taskKey))}) k
      on conflict do nothing`
  } catch (error) {
    say(`DB 접속·실행 기록 실패: ${errorSummary(error, redact)}`)
    return { ...result, exitCode: EXIT.dbUnreachable, errorCode: "db_unreachable" }
  }
  const runId = result.runId

  const statusRows = await sql<{ task_key: string; status: TaskStatus }[]>`
    select task_key, status from price.backfill_task where source = 'kamis'`
  const status = new Map(statusRows.map((row) => [row.task_key, row.status]))
  const todo = tasks.filter((task) => status.get(task.taskKey) !== "done")
  say(`백필 시작: 묶음 ${tasks.length}개 중 남은 것 ${todo.length}개, 예산 ${budget.limit}회, 실행 ${runId}`)

  const ctx: CollectContext = {
    serviceKey: deps.env.serviceKey,
    fetch: deps.fetch,
    budget,
    sleep: deps.sleep ?? realSleep,
    delays: deps.delays,
    log: say,
    now: () => now().getTime(),
  }
  const baseline = contractBaselineVersion()
  const maxDbBytes = deps.maxDbBytes ?? MAX_DB_BYTES
  let stop: Stop | null = null
  let dbFailed = false

  for (const task of todo) {
    try {
      const [size] = await sql<{ bytes: string }[]>`select pg_database_size(current_database())::text as bytes`
      if (Number(size!.bytes) > maxDbBytes) {
        say(`DB 크기 ${Math.round(Number(size!.bytes) / 1e6)}MB가 ${maxDbBytes / 1e6}MB를 넘어 멈춘다. 보존 정리나 용량을 먼저 본다`)
        stop = "db_size_limit"
        break
      }
      const outcome = await runTask(task)
      if (outcome.done) result.done.push(task.taskKey)
      else result.failed.push(task.taskKey)
      stop = outcome.stop
      if (stop) break
    } catch (error) {
      say(`DB 실패: ${task.taskKey} ${errorSummary(error, redact)}`)
      dbFailed = true
      result.failed.push(task.taskKey)
      break
    }
  }

  // 묶음 하나: 받기 → 올리기 → 기록 → 적재 → 재계산 → done. 받기·올리기·적재가 실패하면 failed로 두고 다음 실행이 다시 받는다
  async function runTask(task: BackfillTask): Promise<{ done: boolean; stop: Stop | null }> {
    const range = taskRange(task.year, today)!
    const label = `backfill-01-${task.item.itemCd}-${task.year}`
    await setTask(sql, task.taskKey, { status: "running" })
    const collected = await collectKamisRange(ctx, task.item, { ...range, label })
    const part = collected.files[0]!
    if (collected.stop || collected.failedCalls > 0) {
      // 한 번도 부르지 못하고 멈췄으면(예산·시간) 실패가 아니다. 다음 실행이 그대로 받는다
      const untouched = collected.stop !== null && part.requests.length === 0
      await setTask(
        sql,
        task.taskKey,
        untouched ? { status: "pending" } : { status: "failed", calls: part.requests.length, errorCode: collected.stop ?? "calls_failed" },
      )
      return { done: false, stop: collected.stop }
    }

    const fetchedAt = now().toISOString()
    const file = buildRawFile(
      {
        source: "kamis",
        endpoint: part.endpoint,
        job: "backfill",
        ingestRunId: runId,
        runStartedAt: startedAt,
        fetchedAt,
        requests: part.requests,
        targetFrom: part.targetFrom,
        targetTo: part.targetTo,
        contractBaseline: baseline,
        adapterVersion: ADAPTER_VERSION,
      },
      part.rows,
    )
    const key = rawObjectKey("kamis", kstDateOf(fetchedAt), callKeyOf(label, fetchedAt))
    try {
      await store.upload(key, file.bytes)
    } catch (error) {
      say(`원본 업로드 실패: ${label} ${errorSummary(error, redact)}`)
      await setTask(sql, task.taskKey, { status: "failed", calls: part.requests.length, errorCode: "storage_failed" })
      return { done: false, stop: "storage_failed" }
    }
    const storagePath = storagePathOf(key)
    await registerPending(sql, {
      storagePath,
      header: file.header,
      contentSha256: file.contentSha256,
      bytesGz: file.bytes.length,
      ingestRunId: runId!,
    })
    const [raw] = await sql<{ id: string }[]>`select id from price.raw_object where storage_path = ${storagePath}`
    const rawObjectId = Number(raw!.id)

    try {
      const loaded = await loadRawFile(sql, rawObjectId, file, { today })
      const quotes = await transaction(sql, async (tx) =>
        recomputeDailyQuote(tx, "quote", await datesOfRawObjects(tx, [rawObjectId]), today),
      )
      const o = loaded.observations
      say(
        `묶음 ${task.taskKey}: ${part.rows.length}행, 호출 ${part.requests.length}회, ${loaded.status}(거부 ${loaded.rejected.length})` +
          `, 90일 밖 ${loaded.backfill?.days ?? 0}일 요약 ${loaded.backfill?.written ?? 0}행, 관측값 새 행 ${o.inserted}, 90일 안 요약 ${quotes.written}행`,
      )
    } catch (error) {
      // 원본은 pending_load로 남아 다음 정기 실행의 적재가 백필 경로로 다시 적재한다
      say(`적재 실패: ${label} ${errorSummary(error, redact)}`)
      await setTask(sql, task.taskKey, { status: "failed", rows: part.rows.length, calls: part.requests.length, errorCode: "load_failed" })
      return { done: false, stop: null }
    }
    await setTask(sql, task.taskKey, { status: "done", rows: part.rows.length, calls: part.requests.length })
    return { done: true, stop: null }
  }

  result.callsUsed = budget.used
  result.remaining = todo.length - result.done.length
  const failedStatus = dbFailed ? "db_unreachable" : (stop ?? (result.failed.length > 0 ? "tasks_failed" : null))
  result.errorCode = failedStatus
  result.exitCode =
    stop === "storage_failed" ? EXIT.storageFailed
    : stop === "key_invalid" ? EXIT.keyInvalid
    : dbFailed ? EXIT.dbUnreachable
    : failedStatus ? EXIT.partial
    : EXIT.ok
  try {
    await finishRun(sql, runId!, {
      status: failedStatus ? "partial" : "ok",
      callsUsed: budget.used,
      errorCode: failedStatus,
      errorDetail: `끝낸 묶음 ${result.done.length}, 실패 ${result.failed.length}, 남은 묶음 ${result.remaining}`,
      gitSha: deps.gitSha ?? null,
    })
  } catch (error) {
    say(`실행 마감 실패: ${errorSummary(error, redact)}`)
  }
  await sql.end({ timeout: 5 })
  say(`백필 끝: 끝낸 묶음 ${result.done.length}, 실패 ${result.failed.length}, 남은 묶음 ${result.remaining}, 호출 ${budget.used}회${stop ? `, 멈춤: ${stop}` : ""}`)
  return result
}
