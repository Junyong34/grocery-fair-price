"use server"

import { writeFileSync } from "node:fs"
import { resolve } from "node:path"

import { refresh } from "next/cache"

import { decideProposals, type Decision, type DecisionRequest, type MappingSummary } from "@workspace/price-ingest/catalog/decide"
import { formatSnapshot } from "@workspace/price-ingest/catalog/snapshot"

import { ownerDb } from "./owner-db"

// 제안 결정의 어드민 adapter (catalog-scale/07). 결정은 @workspace/price-ingest/catalog/decide가 한다:
// 트랜잭션 · 미리보기(dry-run) · 매핑 · 판정 묶음 · 커밋 뒤 사본 내보내기. 여기서는 버튼을 요청으로 바꾸고,
// 결과를 화면 모양으로 바꾸고, 돌려받은 사본을 저장소의 snapshot.json에 쓴다. 사본은 사람이 커밋한다 (ADR 0005 백업).

export type { MappingSummary }
export type JudgmentSummary = { status: "ready" | "failed"; rows: number; previousRows: number | null; note: string | null }
export type DecisionResult =
  | { ok: true; mappings?: MappingSummary; changes?: number; judgment?: JudgmentSummary | null; snapshot?: string; dryRun?: boolean }
  | { ok: false; error: string }

// pnpm dev는 apps/web에서 next를 띄운다. Next 번들 안에서는 snapshot.ts의 SNAPSHOT_PATH(import.meta.url 기준)가 틀어져 cwd로 찾는다
const SNAPSHOT_FILE = resolve(process.cwd(), "../../packages/price-ingest/src/catalog/snapshot.json")
const SNAPSHOT_SHOWN = "packages/price-ingest/src/catalog/snapshot.json"

async function decide(request: DecisionRequest): Promise<DecisionResult> {
  let decision: Decision
  try {
    decision = await decideProposals(ownerDb(), request)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
  if (decision.snapshot) writeFileSync(SNAPSHOT_FILE, formatSnapshot(decision.snapshot))
  // 미리보기는 아무것도 바꾸지 않았으니 화면을 다시 읽을 까닭이 없다
  if (!decision.dryRun) refresh()
  const j = decision.judgment
  return {
    ok: true,
    dryRun: decision.dryRun,
    changes: decision.changes,
    ...(decision.mappings && { mappings: decision.mappings }),
    judgment: j && { status: j.status, rows: j.rows, previousRows: j.previousRows, note: j.note },
    ...(decision.snapshot && { snapshot: SNAPSHOT_SHOWN }),
  }
}

// 미리보기: 적용을 해 보고 되돌린다 (판정 묶음은 내지 않는다)
export async function previewProposals(ids: number[]): Promise<DecisionResult> {
  return decide({ action: "apply", ids, judgment: false, dryRun: true })
}

export async function applySelected(ids: number[], options: { judgment: boolean }): Promise<DecisionResult> {
  return decide({ action: "apply", ids, judgment: options.judgment, dryRun: false })
}

export async function rejectSelected(ids: number[]): Promise<DecisionResult> {
  return decide({ action: "reject", ids, judgment: false, dryRun: false })
}

// 화면은 한 건씩 되돌린다. 여러 건이면 decide.ts가 적용한 순서의 역순으로 푼다
export async function revertApplied(id: number, options: { judgment: boolean }): Promise<DecisionResult> {
  return decide({ action: "revert", ids: [id], judgment: options.judgment, dryRun: false })
}
