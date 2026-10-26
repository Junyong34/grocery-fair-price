// 수집 실행 한 번: 실행 기록 → API 호출 → 원본 Storage 업로드 → 대조(최근 7일) → pending_load 적재 → 실행 기록 마감
// (ingest-schedule/07, pipeline 3-7 "순서", 5-2). 워크플로는 이것만 부른다 (pipeline 6장 "나중에 옮기기 쉽게").
//
// 원본을 먼저 올리고 적재한다. DB가 안 되어도 업로드는 끝내고 실패 코드로 끝난다. 다음 실행의 대조가 이어 받는다.
// 로그에는 개수·경로·오류 요약만 찍는다. 오류는 비밀값을 지운 뒤에만 찍는다 (02).
import { ADAPTER_VERSION } from "../adapt/draft.ts"
import { contractBaselineVersion } from "../contract/probes.ts"
import type { FetchLike } from "../http.ts"
import { datesOfRawObjects, recomputeDailyQuote } from "../load/daily-quote.ts"
import { connectIngest, transaction, type Sql } from "../load/db.ts"
import { finishRun, previousRawFile, registerDuplicate, registerPending, registerRun } from "../load/ledger.ts"
import { loadPendingFiles } from "../load/load-pending.ts"
import { buildRawFile, callKeyOf, rawObjectKey, storagePathOf } from "../load/raw-file.ts"
import { reconcileRawFiles } from "../load/reconcile.ts"
import { closeEmpty, markNotYet, readSurveyDays, recordFetch, rowCountOf } from "../load/survey-day.ts"
import { createObjectStore, type ObjectStore } from "../load/storage.ts"
import { kstDateOf } from "../load/window.ts"
import { createRedactor, errorSummary } from "../secrets.ts"
import { CALL_BUDGET, CALL_TIME_LIMIT_MS, CallBudget, realSleep, type Sleep, type StopReason } from "./calls.ts"
import { backlogFridays, nextStableChecks, planChamga, recentFridays, type ChamgaPlan, type SurveyDayState } from "./chamga-schedule.ts"
import { collect, type CollectContext, type CollectRequest } from "./collect.ts"

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
  chamgaFirstSurveyDay?: string // 지난 조사일 채우기의 시작 (기본 2026-06-12. 테스트가 바꾼다)
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

function describeTarget(request: CollectRequest): string {
  if (request.source !== "chamga") return `기준일 ${request.day}`
  return `조사일 ${request.surveyDays?.join(", ") || "없음"}`
}

// 받은 조사일의 행 수가 받기 전과 같으면 stable_checks를 올린다. 호출이 하나라도 실패한 실행은 세지 않는다
// (빠진 상품 때문에 우연히 같을 수 있다). 마지막 받기(완료 뒤 월요일, 지난 조사일 채우기)였으면 닫는다.
async function settleChamga(sql: Sql, plan: ChamgaPlan, input: { clean: boolean }): Promise<void> {
  for (const day of plan.notYet) await markNotYet(sql, day)
  for (const day of plan.closeEmpty) await closeEmpty(sql, day)
  for (const fetched of plan.fetch) {
    const stableChecks = input.clean ? nextStableChecks(fetched.before, await rowCountOf(sql, fetched.day)) : null
    await recordFetch(sql, fetched.day, { stableChecks, close: fetched.final && input.clean })
  }
}

export async function runIngest(request: CollectRequest, deps: IngestDeps): Promise<IngestResult> {
  const now = deps.now ?? (() => new Date())
  const log = deps.log ?? ((line: string) => console.log(line))
  const redact = createRedactor([deps.env.serviceKey, deps.env.secretKey, deps.env.databaseUrl])
  const say = (line: string) => log(redact(line))
  const source = request.source
  const startedAt = now().toISOString()
  const job = request.source === "kamis" && request.recheckDays !== undefined ? "recheck" : "daily"
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
    runId = await registerRun(sql, { source, job, callBudget: budget.limit, startedAt })
  } catch (error) {
    await dbDown("실행 기록", error)
  }
  const ctx: CollectContext = {
    serviceKey: deps.env.serviceKey,
    fetch: deps.fetch,
    budget,
    sleep: deps.sleep ?? realSleep,
    delays: deps.delays,
    log: say,
    now: () => now().getTime(),
    deadline: Date.parse(startedAt) + CALL_TIME_LIMIT_MS[source],
  }
  const today = kstDateOf(now().toISOString())

  // 참가격 자동 모드: 조사일 상태를 읽고 감지한 뒤 받을 조사일을 정한다 (10). 남는 예산으로 지난 조사일을 채운다 (12)
  let target = request
  let plan: ChamgaPlan | null = null
  if (request.source === "chamga" && request.surveyDays === undefined) {
    let states = new Map<string, SurveyDayState>()
    if (sql) {
      try {
        states = await readSurveyDays(sql, [...recentFridays(today), ...backlogFridays(today, deps.chamgaFirstSurveyDay)])
      } catch (error) {
        await dbDown("조사일 상태", error)
      }
    }
    plan = await planChamga(ctx, states, {
      today,
      now: now().toISOString(),
      canClose: sql !== null,
      firstSurveyDay: deps.chamgaFirstSurveyDay,
    })
    say(
      `조사일: 받음 ${plan.fetch.map((f) => `${f.day}${f.final ? "(마지막)" : ""}`).join(", ") || "없음"}` +
        `, 아직 없음 ${plan.notYet.join(", ") || "-"}, 빈 조사일로 닫음 ${plan.closeEmpty.join(", ") || "-"}`,
    )
    target = { source: "chamga", surveyDays: plan.fetch.map((f) => f.day) }
  }
  say(`수집 시작: ${source} ${describeTarget(target)}, 실행 ${runId ?? "기록 없음"}`)

  const collected = await collect(ctx, target)
  const failedCalls = collected.failedCalls + (plan?.failedCalls ?? 0)
  const stop = plan?.stop ?? collected.stop
  say(`호출 ${budget.used}회, 실패 ${failedCalls}건${stop ? `, 멈춤: ${stop}` : ""}`)

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
        job,
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
  const loadedIds: number[] = []
  if (sql && !storageFailed) {
    try {
      const reconciled = await reconcileRawFiles({ sql, store, source, today: kstDateOf(now().toISOString()) })
      if (reconciled.registered.length > 0) say(`대조: 기록 없던 원본 ${reconciled.registered.length}개를 적재 대기로`)
      const result = await loadPendingFiles({ sql, store, source })
      loaded = result.loaded.length
      loadFailed = result.failed.length
      loadedIds.push(...result.loaded.map((o) => o.rawObjectId))
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

  // 적재한 원본이 담은 날의 일자 요약을 다시 계산한다 (ingest-foundation/10). 실패하면 부분으로 끝내고 다음 실행이 다시 한다
  if (sql && loadedIds.length > 0) {
    try {
      const basis = source === "chamga" ? "shelf_price" : "quote"
      const days = await datesOfRawObjects(sql, loadedIds)
      const quotes = await transaction(sql, (tx) => recomputeDailyQuote(tx, basis, days, today))
      say(`일자 요약: ${basis} ${days.length}일, 고친 행 ${quotes.written}, 지운 행 ${quotes.removed}`)
    } catch (error) {
      say(`일자 요약 실패: ${errorSummary(error, redact)}`)
      loadFailed += 1
    }
  }

  // 참가격 조사일 상태: 안 온 날·빈 날 기록, 받은 날의 행 수 안정 횟수와 마지막 받기 뒤 닫기
  if (plan && sql && !storageFailed) {
    try {
      await settleChamga(sql, plan, { clean: failedCalls === 0 && stop === null && loadFailed === 0 })
    } catch (error) {
      await dbDown("조사일 상태 기록", error)
    }
  }

  const inputs = { storageFailed, dbFailed, stop, failedCalls, loadFailed }
  let outcome = decide(inputs)
  // dbDown이 sql을 비우므로 흐름 분석이 좁힌 타입을 다시 넓혀 읽는다
  const activeSql = sql as Sql | null
  if (activeSql && runId !== null) {
    try {
      await finishRun(activeSql, runId, {
        status: outcome.status,
        callsUsed: budget.used,
        errorCode: outcome.errorCode,
        errorDetail: `업로드 ${uploaded.length}, 중복 ${duplicates.length}, 적재 ${loaded}, 적재 실패 ${loadFailed}, 호출 실패 ${failedCalls}`,
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
