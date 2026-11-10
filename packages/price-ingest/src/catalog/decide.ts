// 제안 결정 (catalog-scale/07·08): 적용 · 반려 · 되돌리기를 한 번에 하는 module.
// CLI(catalog apply|reject|revert)와 카탈로그 어드민(제안 검토)이 이 함수 하나만 부른다. 두 곳은 입력을 요청으로 바꾸고,
// 결과를 찍거나 그리고, 돌려받은 사본을 자기 경로의 snapshot.json에 쓰는 adapter다.
//
// 이 module이 지키는 규칙:
//   1. 트랜잭션은 여기서 열고 닫는다. dryRun이면 같은 일을 모두 한 뒤 되돌린다(어드민 "미리보기", CLI --dry-run).
//   2. 적용·되돌리기 뒤에는 매핑·관측값·일자 요약을 맞추고(refreshMappings), judgment면 평소가와 판정 묶음을 다시 낸다.
//   3. 저장소 사본(ADR 0005 백업)은 커밋한 뒤에만 DB에서 다시 내보내 돌려준다. dry-run과 반려는 사본이 바뀌지 않으므로 null이다.
//      파일 쓰기는 하지 않는다: 실행 환경마다 경로를 찾는 방법이 달라서(Next 번들 안에서는 import.meta.url 경로가 틀어진다) adapter 몫이다.
//   4. 되돌리기는 여러 건을 받아 적용한 순서의 역순(새 것부터)으로 푼다. 같은 원천 키를 두 제안이 차례로 바꿨을 때
//      나중 것부터 풀어야 처음 상태로 돌아간다.
import type { Sql, Tx } from "../load/db.ts"
import { writeJudgment, type JudgmentResult } from "../judgment/cli.ts"
import { writeUsual } from "../usual/cli.ts"

import { exportSnapshot } from "./db.ts"
import { applyProposals, rejectProposals, revertProposal } from "./proposals.ts"
import type { refreshMappings } from "./refresh.ts"
import type { CatalogSnapshot } from "./types.ts"

export type DecisionRequest = {
  action: "apply" | "reject" | "revert"
  ids: readonly number[]
  /** 평소가(182일)와 판정 묶음을 다시 낼까. 끄면 다음 정기 배치를 기다린다. 반려에는 쓰지 않는다 */
  judgment: boolean
  /** 같은 일을 하고 되돌린다 */
  dryRun: boolean
}

/** 매핑을 맞춘 결과의 숫자 요약. 두 adapter가 같은 숫자를 보인다 */
export type MappingSummary = {
  mapped: number // 지금 규격에 이은 원천 키·상품 수
  ignored: number
  pending: number
  changed: number // 이번에 바뀐 매핑 수
  conflicts: number // 이미 다르게 정해져 있어 고치지 않은 수
  remapped: number // 다시 매핑한 관측값 수 (출처 합)
  dailyQuote: number // 다시 쓴 일자 요약 행 수 (시세 + 판매가)
}

export type Decision = {
  action: DecisionRequest["action"]
  /** 처리한 제안 번호. 되돌리기는 실제로 푼 순서(새 것부터) */
  ids: number[]
  /** catalog_change에 남긴 카탈로그 변경 수 */
  changes: number
  /** 되돌리기로 사본에서 빠져 지운 규격(`품종/규격`). 그 밖에는 빈 목록 */
  droppedSpecs: string[]
  /** 반려면 null (매핑을 건드리지 않는다) */
  mappings: MappingSummary | null
  /** judgment를 껐거나 반려면 null. 묶음 검사에 걸리면 status가 failed이고 화면은 지금 묶음을 그대로 읽는다 */
  judgment: JudgmentResult | null
  /** 커밋한 뒤 다시 내보낸 카탈로그 사본. dry-run · 반려면 null */
  snapshot: CatalogSnapshot | null
  dryRun: boolean
}

type Mappings = Awaited<ReturnType<typeof refreshMappings>>

function summarize(m: Mappings): MappingSummary {
  return {
    mapped: m.mapped,
    ignored: m.ignored,
    pending: m.pending,
    changed: m.changed,
    conflicts: m.conflicts.length,
    remapped: Object.values(m.remapped).reduce((a, b) => a + b, 0),
    dailyQuote: m.dailyQuote.quote.written + m.dailyQuote.shelf_price.written,
  }
}

// 되돌리기를 여러 번 하면 refreshMappings도 여러 번 돈다. 상태 숫자(이음·제외·pending)는 마지막 것이 지금 상태이고,
// 이번에 한 일의 양(바뀐 매핑·다시 매핑한 관측값·다시 쓴 일자 요약·충돌)은 매번의 것을 더한다.
function mergeSummaries(list: readonly MappingSummary[]): MappingSummary | null {
  const last = list.at(-1)
  if (!last) return null
  const sum = (key: "changed" | "conflicts" | "remapped" | "dailyQuote") => list.reduce((n, s) => n + s[key], 0)
  return { ...last, changed: sum("changed"), conflicts: sum("conflicts"), remapped: sum("remapped"), dailyQuote: sum("dailyQuote") }
}

// 결정의 본체. 트랜잭션 안에서 부른다
async function decideIn(tx: Tx, request: DecisionRequest): Promise<Omit<Decision, "snapshot" | "dryRun">> {
  const { action } = request
  if (action === "reject") {
    const ids = await rejectProposals(tx, request.ids)
    return { action, ids, changes: 0, droppedSpecs: [], mappings: null, judgment: null }
  }

  let ids: number[]
  let changes = 0
  const droppedSpecs: string[] = []
  const summaries: MappingSummary[] = []

  if (action === "apply") {
    // 여러 제안을 한 번에 적용하고 매핑은 끝에 한 번 맞춘다 (proposals.ts)
    const applied = await applyProposals(tx, request.ids)
    ids = applied.applied
    changes = applied.changes
    summaries.push(summarize(applied.mappings))
  } else {
    // 적용한 순서의 역순: 결정 시각(decided_at)이 늦은 것부터, 같으면 번호가 큰 것부터.
    // 없는 번호나 applied가 아닌 제안은 revertProposal이 상태를 확인하며 멈추므로 여기서는 순서만 정한다
    const ordered = await tx<{ id: number }[]>`
      select id::int from price.catalog_proposal where id = any(${request.ids as number[]})
       order by decided_at desc nulls last, id desc`
    const known = new Set(ordered.map((r) => r.id))
    ids = [...ordered.map((r) => r.id), ...request.ids.filter((id) => !known.has(id))]
    for (const id of ids) {
      const reverted = await revertProposal(tx, id)
      changes += reverted.changes
      droppedSpecs.push(...reverted.droppedSpecs)
      summaries.push(summarize(reverted.mappings))
    }
  }

  // 새 품종·규격이 다음 정기 배치를 기다리지 않고 화면에 나오게 평소가와 판정 묶음을 다시 낸다
  let judgment: JudgmentResult | null = null
  if (request.judgment) {
    await writeUsual(tx, { days: 182 })
    judgment = await writeJudgment(tx, { trigger: "catalog" })
  }
  return { action, ids, changes, droppedSpecs, mappings: mergeSummaries(summaries), judgment }
}

// dry-run에서 결과를 들고 트랜잭션을 빠져나오는 표시. 던져서 되돌리고, 잡아서 결과를 돌려준다
class RolledBack extends Error {
  constructor(readonly result: Omit<Decision, "snapshot" | "dryRun">) {
    super("dry-run: 되돌렸다")
  }
}

/**
 * 제안을 적용 · 반려 · 되돌린다.
 * db가 접속(Sql)이면 트랜잭션을 열고 커밋한다. 이미 열린 트랜잭션(Tx)이면 그 안의 savepoint로 돈다:
 * 테스트가 준비한 데이터를 같은 트랜잭션에서 보고, 바깥 테스트 트랜잭션이 모두 되돌리게 하기 위해서다.
 * 실패하면 아무것도 바꾸지 않고 던진다(트랜잭션이 통째로 되돌아간다).
 */
export async function decideProposals(db: Sql | Tx, request: DecisionRequest): Promise<Decision> {
  const nested = "savepoint" in db
  const body = async (tx: Tx) => {
    const result = await decideIn(tx, request)
    if (request.dryRun) throw new RolledBack(result)
    return result
  }

  let result: Omit<Decision, "snapshot" | "dryRun">
  try {
    result = nested ? await (db as Tx).savepoint(body) : await (db as Sql).begin(body)
  } catch (error) {
    if (error instanceof RolledBack) return { ...error.result, snapshot: null, dryRun: true }
    throw error
  }

  // 커밋한 뒤의 카탈로그를 다시 읽는다. 반려는 카탈로그를 바꾸지 않으므로 사본도 그대로다
  const snapshot =
    request.action === "reject" ? null : nested ? await exportSnapshot(db as Tx) : await (db as Sql).begin("read only", (tx) => exportSnapshot(tx))
  return { ...result, snapshot, dryRun: false }
}
