"use server"

import { writeFileSync } from "node:fs"
import { resolve } from "node:path"

import { refresh } from "next/cache"

import { exportSnapshot } from "@workspace/price-ingest/catalog/db"
import { applyProposals, rejectProposals, revertProposal } from "@workspace/price-ingest/catalog/proposals"
import { refreshJudgment } from "@workspace/price-ingest/catalog/refresh"
import { formatSnapshot } from "@workspace/price-ingest/catalog/snapshot"

import { ownerDb } from "./owner-db"

// 제안 승인·반려·되돌리기 (catalog-scale/07). 쓰기는 모두 08의 함수(packages/price-ingest/src/catalog/proposals.ts)를 거친다.
// 적용·되돌리기는 한 트랜잭션에서 카탈로그·매핑·관측값·일자 요약을 고치고 평소가·판정 묶음을 다시 낸 뒤,
// 저장소 사본(snapshot.json)을 다시 쓴다. 사본은 사람이 커밋한다 (ADR 0005 백업).

export type MappingSummary = { mapped: number; ignored: number; pending: number; changed: number; conflicts: number; remapped: number; dailyQuote: number }
export type JudgmentSummary = { status: "ready" | "failed"; rows: number; previousRows: number | null; note: string | null }
export type DecisionResult =
  | { ok: true; mappings?: MappingSummary; changes?: number; judgment?: JudgmentSummary | null; snapshot?: string; dryRun?: boolean }
  | { ok: false; error: string }

// pnpm dev는 apps/web에서 next를 띄운다
const SNAPSHOT_FILE = resolve(process.cwd(), "../../packages/price-ingest/src/catalog/snapshot.json")
const ROLLBACK = Symbol("rollback")

const failure = (error: unknown): DecisionResult => ({ ok: false, error: error instanceof Error ? error.message : String(error) })

type Mappings = Awaited<ReturnType<typeof applyProposals>>["mappings"]
const summarize = (m: Mappings): MappingSummary => ({
  mapped: m.mapped,
  ignored: m.ignored,
  pending: m.pending,
  changed: m.changed,
  conflicts: m.conflicts.length,
  remapped: Object.values(m.remapped).reduce((a, b) => a + b, 0),
  dailyQuote: m.dailyQuote.quote.written + m.dailyQuote.shelf_price.written,
})

async function writeSnapshot(): Promise<string> {
  const snapshot = await ownerDb().begin("read only", (tx) => exportSnapshot(tx))
  writeFileSync(SNAPSHOT_FILE, formatSnapshot(snapshot))
  return "packages/price-ingest/src/catalog/snapshot.json"
}

// 미리보기: 적용을 해 보고 되돌린다 (판정 묶음은 내지 않는다)
export async function previewProposals(ids: number[]): Promise<DecisionResult> {
  let result: DecisionResult = { ok: false, error: "미리보기를 끝내지 못했다" }
  try {
    await ownerDb().begin(async (tx) => {
      const applied = await applyProposals(tx, ids)
      result = { ok: true, dryRun: true, changes: applied.changes, mappings: summarize(applied.mappings) }
      throw ROLLBACK
    })
  } catch (error) {
    if (error !== ROLLBACK) return failure(error)
  }
  return result
}

export async function applySelected(ids: number[], options: { judgment: boolean }): Promise<DecisionResult> {
  try {
    const result = await ownerDb().begin(async (tx) => {
      const applied = await applyProposals(tx, ids)
      const judgment = options.judgment ? (await refreshJudgment(tx)).judgment : null
      return { applied, judgment }
    })
    const snapshot = await writeSnapshot()
    refresh()
    return {
      ok: true,
      changes: result.applied.changes,
      mappings: summarize(result.applied.mappings),
      judgment: result.judgment && { status: result.judgment.status, rows: result.judgment.rows, previousRows: result.judgment.previousRows, note: result.judgment.note },
      snapshot,
    }
  } catch (error) {
    return failure(error)
  }
}

export async function rejectSelected(ids: number[]): Promise<DecisionResult> {
  try {
    await ownerDb().begin((tx) => rejectProposals(tx, ids))
    refresh()
    return { ok: true }
  } catch (error) {
    return failure(error)
  }
}

export async function revertApplied(id: number, options: { judgment: boolean }): Promise<DecisionResult> {
  try {
    const result = await ownerDb().begin(async (tx) => {
      const reverted = await revertProposal(tx, id)
      const judgment = options.judgment ? (await refreshJudgment(tx)).judgment : null
      return { reverted, judgment }
    })
    const snapshot = await writeSnapshot()
    refresh()
    return {
      ok: true,
      changes: result.reverted.changes,
      mappings: summarize(result.reverted.mappings),
      judgment: result.judgment && { status: result.judgment.status, rows: result.judgment.rows, previousRows: result.judgment.previousRows, note: result.judgment.note },
      snapshot,
    }
  } catch (error) {
    return failure(error)
  }
}
