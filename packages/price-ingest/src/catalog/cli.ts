// 카탈로그 명령 (ingest-foundation/08, catalog-scale/04, ADR 0005). 사람이 로컬에서 부른다. 카탈로그 원본은 운영 DB다.
//   pnpm --filter @workspace/price-ingest catalog --export [--file 경로]            DB → 사본 (INGEST_DATABASE_URL). 기본 경로는 src/catalog/snapshot.json
//   pnpm --filter @workspace/price-ingest catalog --import [--file 경로] [--dry-run] 사본 → 분류 표·규칙 표 (OWNER_DATABASE_URL, 소유자 postgres)
//   pnpm --filter @workspace/price-ingest catalog --mappings [--dry-run]            규칙대로 매핑 (INGEST_DATABASE_URL, ingest_writer)
//   pnpm --filter @workspace/price-ingest catalog pending [--json] [--source kamis] [--since 30]   제안할 거리 (INGEST_DATABASE_URL, 읽기만)
//   pnpm --filter @workspace/price-ingest catalog propose --file 제안.json [--by 이름] [--dry-run]    제안을 catalog_proposal에 (OWNER_DATABASE_URL)
//   pnpm --filter @workspace/price-ingest catalog apply --ids 64,65,70-80 [--skip-judgment] [--dry-run]  제안 적용 (OWNER_DATABASE_URL)
//   pnpm --filter @workspace/price-ingest catalog reject --ids 64 [--dry-run]                              제안 반려 (OWNER_DATABASE_URL)
//   pnpm --filter @workspace/price-ingest catalog revert --ids 64 [--skip-judgment] [--dry-run]           적용한 제안 되돌리기 (OWNER_DATABASE_URL)
// pending·propose는 제안 흐름(catalog-scale/06)이다. 제안은 승인(07·08) 전에는 매핑·화면에 영향이 없다.
// apply·revert는 한 트랜잭션에서 카탈로그를 고치고 매핑·관측값·일자 요약을 맞춘 뒤, 평소가(182일)와 판정 묶음을 다시 낸다(--skip-judgment면
// 다음 정기 배치를 기다린다). 커밋되면 저장소 사본(snapshot.json)을 다시 쓴다. 사본을 커밋한다 (ADR 0005 백업).
// 가져오기는 로컬 DB 채우기와 운영 복구에 쓴다. 바뀐 분류 단위는 catalog_change에 남긴다.
// 매핑을 맞춘 뒤 이미 쌓인 관측값을 다시 매핑하고(09), 관측값이 있는 날의 일자 요약을 다시 계산한다(10).
// --dry-run은 같은 일을 하고 되돌린다.
// .env를 스스로 읽지 않는다. 넣을 곳(로컬 DB인지 운영인지)을 정해 직접 넘긴다.
import { readFileSync, writeFileSync } from "node:fs"
import { parseArgs } from "node:util"

import { connectIngest, type Tx } from "../load/db.ts"
import { seoulToday } from "../load/window.ts"
import { describeError, redactorFromEnv } from "../secrets.ts"

import { exportSnapshot, importSnapshot } from "./db.ts"
import { insertProposals, listPending, type PendingEntry } from "./pending.ts"
import { parseProposalFile } from "./proposal.ts"
import { applyProposals, rejectProposals, revertProposal } from "./proposals.ts"
import type { Source } from "./rules.ts"
import { refreshJudgment, refreshMappings } from "./refresh.ts"
import { formatSnapshot, readSnapshot, SNAPSHOT_PATH } from "./snapshot.ts"

const USAGE =
  "사용법: catalog --export|--import|--mappings [--file 경로] [--dry-run]\n" +
  "       catalog pending [--json] [--source kamis|ekape|chamga] [--since 일수]\n" +
  "       catalog propose --file 제안.json [--by 제안한-주체] [--dry-run]\n" +
  "       catalog apply|reject|revert --ids 64,65,70-80 [--skip-judgment] [--dry-run]"
const SOURCES: readonly Source[] = ["kamis", "ekape", "chamga"]
const DRY_RUN = Symbol("dry-run")

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`환경변수 ${name}가 없다`)
  return value
}

// 커밋했으면 true
async function run(url: string, dryRun: boolean, fn: (tx: Tx) => Promise<unknown>): Promise<boolean> {
  const sql = connectIngest(url)
  try {
    await sql.begin(async (tx) => {
      console.log(JSON.stringify(await fn(tx), null, 2))
      if (dryRun) throw DRY_RUN
    })
    return true
  } catch (error) {
    if (error !== DRY_RUN) throw error
    console.log("--dry-run: 되돌렸다")
    return false
  } finally {
    await sql.end()
  }
}

async function writeSnapshotFile(url: string, file: string): Promise<void> {
  const sql = connectIngest(url)
  try {
    const snapshot = await sql.begin("read only", (tx) => exportSnapshot(tx))
    writeFileSync(file, formatSnapshot(snapshot))
    console.log(`내보냄: ${file} (카테고리 ${snapshot.categories.length}, 품목 ${snapshot.items.length}, 품종 ${snapshot.varieties.length}, 예외 ${snapshot.exceptions.length}, 출처 분류 ${snapshot.sourceCategories.length})`)
  } finally {
    await sql.end()
  }
}

// `64,65,70-80` → [64, 65, 70, …, 80]
export function parseIds(text: string | undefined): number[] {
  if (!text) throw new Error(USAGE)
  const ids = text.split(",").flatMap((part) => {
    const m = /^(\d+)(?:-(\d+))?$/.exec(part.trim())
    if (!m) throw new Error(`--ids를 읽을 수 없다: ${part}`)
    const [from, to] = [Number(m[1]), Number(m[2] ?? m[1])]
    if (to < from) throw new Error(`--ids 범위가 거꾸로다: ${part}`)
    return Array.from({ length: to - from + 1 }, (_, i) => from + i)
  })
  return [...new Set(ids)]
}

async function decide(command: "apply" | "reject" | "revert", ids: number[], skipJudgment: boolean, dryRun: boolean): Promise<void> {
  const url = required("OWNER_DATABASE_URL")
  const committed = await run(url, dryRun, async (tx) => {
    if (command === "reject") return { rejected: await rejectProposals(tx, ids) }
    const results = command === "apply" ? [await applyProposals(tx, ids)] : await ids.reduce(
      async (acc, id) => [...(await acc), await revertProposal(tx, id)],
      Promise.resolve([] as Awaited<ReturnType<typeof revertProposal>>[]),
    )
    const judgment = skipJudgment ? null : (await refreshJudgment(tx)).judgment
    return { results, judgment }
  })
  if (committed && command !== "reject") await writeSnapshotFile(url, SNAPSHOT_PATH)
}

function describePending(e: PendingEntry): string {
  const near = [...e.similar.sameCode.map((r) => (r.action === "map" ? `${r.variety}/${r.spec}` : r.action)), ...e.similar.byName.map((v) => v.slug)]
  const notes = [e.hold ? `보류: ${e.hold}` : "", e.openProposal ? `제안 #${e.openProposal}` : "", near.length ? `비슷: ${[...new Set(near)].join(", ")}` : ""]
  return [`${e.source}:${e.key}`, e.label ?? "-", e.units.join("·"), `${e.lastSeen} (${e.observations})`, ...notes.filter(Boolean)].join("  ")
}

async function pending(values: { json?: boolean; source?: string; since?: string }): Promise<void> {
  if (values.source !== undefined && !SOURCES.includes(values.source as Source)) throw new Error(USAGE)
  const sinceDays = values.since === undefined ? undefined : Number(values.since)
  if (sinceDays !== undefined && !(Number.isInteger(sinceDays) && sinceDays > 0)) throw new Error(USAGE)
  const sql = connectIngest(required("INGEST_DATABASE_URL"))
  try {
    const entries = await sql.begin("read only", (tx) => listPending(tx, { source: values.source as Source | undefined, sinceDays, today: seoulToday() }))
    if (values.json) console.log(JSON.stringify(entries, null, 2))
    else {
      for (const e of entries) console.log(describePending(e))
      console.log(`pending ${entries.length}개 (열린 제안 ${entries.filter((e) => e.openProposal).length})`)
    }
  } finally {
    await sql.end()
  }
}

async function propose(file: string | undefined, by: string, dryRun: boolean): Promise<void> {
  if (!file) throw new Error(USAGE)
  const entries = parseProposalFile(JSON.parse(readFileSync(file, "utf8")))
  await run(required("OWNER_DATABASE_URL"), dryRun, (tx) => insertProposals(tx, entries, by))
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      json: { type: "boolean" },
      source: { type: "string" },
      since: { type: "string" },
      by: { type: "string" },
      ids: { type: "string" },
      "skip-judgment": { type: "boolean" },
      export: { type: "boolean" },
      import: { type: "boolean" },
      mappings: { type: "boolean" },
      file: { type: "string" },
      "dry-run": { type: "boolean" },
    },
    strict: true,
  })
  const dryRun = values["dry-run"] === true
  const [command, ...rest] = positionals
  if (rest.length > 0) throw new Error(USAGE)
  if (command === "pending") return pending(values)
  if (command === "propose") return propose(values.file, values.by ?? "agent:catalog-propose", dryRun)
  if (command === "apply" || command === "reject" || command === "revert") {
    return decide(command, parseIds(values.ids), values["skip-judgment"] === true, dryRun)
  }
  if (command !== undefined) throw new Error(USAGE)
  const file = values.file ?? SNAPSHOT_PATH
  if ([values.export, values.import, values.mappings].filter(Boolean).length !== 1) throw new Error(USAGE)
  if (values.export) await writeSnapshotFile(required("INGEST_DATABASE_URL"), file)
  else if (values.import) {
    const snapshot = readSnapshot(file)
    await run(required("OWNER_DATABASE_URL"), dryRun, async (tx) => {
      const result = await importSnapshot(tx, snapshot, `import:${file.split("/").pop()}`)
      return { ...result, changes: result.changes.map((c) => `${c.action} ${c.target} ${c.targetKey}`) }
    })
  } else await run(required("INGEST_DATABASE_URL"), dryRun, refreshMappings)
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    // 비밀값을 지운 뒤에만 찍는다 (ingest-schedule/02)
    console.error(describeError(error, redactorFromEnv()))
    process.exitCode = 1
  })
}
