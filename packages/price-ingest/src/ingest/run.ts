// 수집 실행 한 번: 실행 기록 → API 호출 → 원본 Storage 업로드 → 대조(최근 7일) → pending_load 적재 → 실행 기록 마감
// (ingest-schedule/07, pipeline 3-7 "순서", 5-2). 워크플로는 이것만 부른다 (pipeline 6장 "나중에 옮기기 쉽게").
//
// 원본을 먼저 올리고 적재한다. DB가 안 되어도 업로드는 끝내고 실패 코드로 끝난다. 다음 실행의 대조가 이어 받는다.
// 로그에는 개수·경로·오류 요약만 찍는다. 오류는 비밀값을 지운 뒤에만 찍는다 (02).
import { ADAPTER_VERSION } from "../adapt/draft.ts"
import { contractBaselineVersion } from "../contract/probes.ts"
import type { FetchLike } from "../http.ts"
import { connectIngest, type Sql } from "../load/db.ts"
import { finishRun, previousRawFile, registerDuplicate, registerPending, registerRun } from "../load/ledger.ts"
import { loadPendingFiles } from "../load/load-pending.ts"
import { buildRawFile, callKeyOf, rawObjectKey, storagePathOf } from "../load/raw-file.ts"
import { reconcileRawFiles } from "../load/reconcile.ts"
import { createObjectStore, type ObjectStore } from "../load/storage.ts"
import { kstDateOf } from "../load/window.ts"
import { createRedactor, errorSummary } from "../secrets.ts"
import { CALL_BUDGET, CallBudget, realSleep, type Sleep, type StopReason } from "./calls.ts"
import { collect, type CollectRequest } from "./collect.ts"

// 종료 코드. 알림(ingest-schedule/13)이 이것과 ingest_run.error_code로 알림을 고른다.
export const EXIT = {
  ok: 0,
  partial: 1, // 일부 호출·적재 실패, 한도·예산 초과. 다음 실행이 메운다
  keyInvalid: 2, // 인증키 오류. 다시 불러도 안 된다. 즉시 알림
  dbUnreachable: 3, // DB에 기록·적재하지 못했다. 원본은 Storage에 있어 다음 실행이 적재한다
  storageFailed: 4, // 원본을 올리지 못했다. 받은 것을 잃는다
  unexpected: 9, // 코드 오류 등 (CLI가 정한다)
} as const

export type IngestEnv = {
  serviceKey: string
  supabaseUrl: string
  secretKey: string
  databaseUrl: string
}

export type IngestDeps = {
  env: IngestEnv
  fetch?: FetchLike // 공공 API (테스트는 가짜 응답)
  store?: ObjectStore
  connect?: (url: string) => Sql
  now?: () => Date
  sleep?: Sleep
  delays?: readonly number[]
  log?: (line: string) => void
  gitSha?: string | null
}

export type IngestResult = {
  exitCode: number
  runId: number | null
  errorCode: string | null
  uploaded: string[] // 올린 storage_path
  duplicates: string[] // 바로 전 파일과 같아 올리지 않은 것
  loaded: number // 이번 실행이 적재한 원본 수 (예전 pending_load 포함)
  loadFailed: number
  callsUsed: number
}

type Outcome = { exitCode: number; status: "ok" | "partial" | "failed"; errorCode: string | null }

function decide(input: {
  storageFailed: boolean
  dbFailed: boolean
  stop: StopReason | null
  failedCalls: number
  loadFailed: number
}): Outcome {
  if (input.storageFailed) return { exitCode: EXIT.storageFailed, status: "failed", errorCode: "storage_failed" }
  if (input.stop === "key_invalid") return { exitCode: EXIT.keyInvalid, status: "failed", errorCode: "key_invalid" }
  if (input.dbFailed) return { exitCode: EXIT.dbUnreachable, status: "failed", errorCode: "db_unreachable" }
  if (input.stop) return { exitCode: EXIT.partial, status: "partial", errorCode: input.stop }
  if (input.failedCalls > 0) return { exitCode: EXIT.partial, status: "partial", errorCode: "calls_failed" }
  if (input.loadFailed > 0) return { exitCode: EXIT.partial, status: "partial", errorCode: "load_failed" }
  return { exitCode: EXIT.ok, status: "ok", errorCode: null }
}

export async function runIngest(request: CollectRequest, deps: IngestDeps): Promise<IngestResult> {
  const now = deps.now ?? (() => new Date())
  const log = deps.log ?? ((line: string) => console.log(line))
  const redact = createRedactor([deps.env.serviceKey, deps.env.secretKey, deps.env.databaseUrl])
  const say = (line: string) => log(redact(line))
  const source = request.source
  const startedAt = now().toISOString()
  const budget = new CallBudget(CALL_BUDGET[source])
  const store = deps.store ?? createObjectStore({ url: deps.env.supabaseUrl, secretKey: deps.env.secretKey })

  // DB. 안 되면 원본 업로드까지만 한다
  let sql: Sql | null = null
  let runId: number | null = null
  let dbFailed = false
  const dbDown = async (step: string, error: unknown) => {
    say(`DB ${step} 실패: ${errorSummary(error, redact)}`)
    dbFailed = true
    const closing = sql
    sql = null
    await closing?.end({ timeout: 1 }).catch(() => {})
  }
  try {
    sql = (deps.connect ?? connectIngest)(deps.env.databaseUrl)
    runId = await registerRun(sql, { source, job: "daily", callBudget: budget.limit, startedAt })
  } catch (error) {
    await dbDown("실행 기록", error)
  }
  say(`수집 시작: ${source} ${"day" in request ? `기준일 ${request.day}` : `조사일 ${request.surveyDay}`}, 실행 ${runId ?? "기록 없음"}`)

  const collected = await collect(
    { serviceKey: deps.env.serviceKey, fetch: deps.fetch, budget, sleep: deps.sleep ?? realSleep, delays: deps.delays },
    request,
  )
  say(`호출 ${budget.used}회, 실패 ${collected.failedCalls}건${collected.stop ? `, 멈춤: ${collected.stop}` : ""}`)

  const uploaded: string[] = []
  const duplicates: string[] = []
  let storageFailed = false
  const baseline = contractBaselineVersion()
  for (const part of collected.files) {
    const fetchedAt = now().toISOString()
    const file = buildRawFile(
      {
        source,
        endpoint: part.endpoint,
        job: "daily",
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
    const key = rawObjectKey(source, kstDateOf(fetchedAt), callKeyOf(part.label, fetchedAt))
    const storagePath = storagePathOf(key)
    const record = { storagePath, header: file.header, contentSha256: file.contentSha256, bytesGz: file.bytes.length }

    if (sql && runId !== null) {
      try {
        const previous = await previousRawFile(sql, { source, ...part })
        if (previous && previous.contentSha256 === file.contentSha256) {
          await registerDuplicate(sql, { ...record, ingestRunId: runId, duplicateOf: previous.id })
          duplicates.push(storagePath)
          say(`중복(올리지 않음): ${part.label} ${part.rows.length}행 = 원본 ${previous.id}`)
          continue
        }
      } catch (error) {
        await dbDown("중복 확인", error)
      }
    }

    try {
      await store.upload(key, file.bytes)
    } catch (error) {
      say(`원본 업로드 실패: ${part.label} ${errorSummary(error, redact)}`)
      storageFailed = true
      break
    }
    uploaded.push(storagePath)
    say(`업로드: ${storagePath} ${part.rows.length}행, 호출 ${part.requests.length}회`)

    if (sql && runId !== null) {
      try {
        await registerPending(sql, { ...record, ingestRunId: runId })
      } catch (error) {
        await dbDown("원본 기록", error)
      }
    }
  }

  // 대조로 DB 기록 없는 원본(DB 장애 때 올라간 것)을 채운 뒤 pending_load를 모두 적재한다
  let loaded = 0
  let loadFailed = 0
  if (sql && !storageFailed) {
    try {
      const reconciled = await reconcileRawFiles({ sql, store, source, today: kstDateOf(now().toISOString()) })
      if (reconciled.registered.length > 0) say(`대조: 기록 없던 원본 ${reconciled.registered.length}개를 적재 대기로`)
      const result = await loadPendingFiles({ sql, store, source })
      loaded = result.loaded.length
      loadFailed = result.failed.length
      for (const outcome of result.loaded) {
        const o = outcome.observations
        say(
          `적재: 원본 ${outcome.rawObjectId} ${outcome.status}, 새 행 ${o.inserted}, 고친 행 ${o.changed}, 정정 ${o.corrections}` +
            `, 거부 ${outcome.rejected.length}, 평년 ${outcome.references}, 새 마스터 ${outcome.createdMasters}`,
        )
      }
      for (const failure of result.failed) say(`적재 실패: ${failure.storagePath} ${redact(failure.error).slice(0, 160)}`)
    } catch (error) {
      await dbDown("대조·적재", error)
    }
  }

  const inputs = { storageFailed, dbFailed, stop: collected.stop, failedCalls: collected.failedCalls, loadFailed }
  let outcome = decide(inputs)
  // dbDown이 sql을 비우므로 흐름 분석이 좁힌 타입을 다시 넓혀 읽는다
  const activeSql = sql as Sql | null
  if (activeSql && runId !== null) {
    try {
      await finishRun(activeSql, runId, {
        status: outcome.status,
        callsUsed: budget.used,
        errorCode: outcome.errorCode,
        errorDetail: `업로드 ${uploaded.length}, 중복 ${duplicates.length}, 적재 ${loaded}, 적재 실패 ${loadFailed}, 호출 실패 ${collected.failedCalls}`,
        gitSha: deps.gitSha ?? null,
      })
    } catch (error) {
      await dbDown("실행 마감", error)
      outcome = decide({ ...inputs, dbFailed: true })
    }
  }
  await (sql as Sql | null)?.end({ timeout: 5 })
  say(`끝: ${outcome.status}${outcome.errorCode ? ` (${outcome.errorCode})` : ""}, 종료 코드 ${outcome.exitCode}`)

  return {
    exitCode: outcome.exitCode,
    runId,
    errorCode: outcome.errorCode,
    uploaded,
    duplicates,
    loaded,
    loadFailed,
    callsUsed: budget.used,
  }
}
