// 제안 승인 적용·반려·되돌리기 (catalog-scale/08). 소유자 접속 트랜잭션 안에서 부른다. 어드민(07)과 CLI가 같은 함수를 쓴다.
//   applyProposals: 제안마다 카탈로그 사본을 고쳐(edit.ts) importSnapshot으로 넣고, 바뀐 분류 단위를 그 제안 번호로 catalog_change에 남긴다.
//     상품의 품목(product.item_id)은 사본 밖이라 따로 고치고 기록한다. 모두 넣은 뒤 매핑·관측값·일자 요약을 맞춘다(refresh.ts)
//   rejectProposals: 반려. 카탈로그는 그대로다
//   revertProposal: 적용한 제안의 변경 기록을 전 값으로 돌린다. 그 원천 키의 매핑을 pending으로 되돌리고,
//     사본에서 빠진 규격은 파생 행(일자 요약·평소가·계절비율)과 함께 지운다. 새로 만든 품종은 지우지 않고 숨긴다(importSnapshot).
//     되돌린 제안은 rejected가 된다
import type { Tx } from "../load/db.ts"

import { exportSnapshot, importSnapshot } from "./db.ts"
import { editSnapshot, revertSnapshot } from "./edit.ts"
import { keyPatternOf, parseProposalFile, type ProposalEntry } from "./proposal.ts"
import { refreshMappings } from "./refresh.ts"
import type { CatalogChange } from "./rules.ts"

type ProposalRow = ProposalEntry & { id: number; status: string }

async function readProposals(tx: Tx, ids: readonly number[], allowed: readonly string[]): Promise<ProposalRow[]> {
  const rows = await tx<{ id: number; source: string; key: string; kind: string; proposal: unknown; rationale: string; confidence: string | null; status: string }[]>`
    select id::int, source, key_pattern as key, kind, proposal, rationale, confidence, status
      from price.catalog_proposal where id = any(${ids as number[]}) order by id for update`
  const missing = ids.filter((id) => !rows.some((r) => r.id === id))
  if (missing.length > 0) throw new Error(`제안이 없다: ${missing.join(", ")}`)
  const wrong = rows.filter((r) => !allowed.includes(r.status))
  if (wrong.length > 0) throw new Error(`${allowed.join("·")} 상태가 아니다: ${wrong.map((r) => `#${r.id}(${r.status})`).join(", ")}`)
  const entries = parseProposalFile(rows.map(({ source, key, kind, proposal, rationale, confidence }) => ({ source, key, kind, proposal, rationale, confidence })))
  return rows.map((r, i) => ({ ...entries[i]!, id: r.id, status: r.status }))
}

const productKey = (goodId: string) => `chamga:${goodId}`

// 상품의 품목을 바꾸고 기록한다. 바꿀 것이 없으면 기록하지 않는다
async function setProductItem(tx: Tx, goodId: string, item: string | null, actor: string, proposalId: number): Promise<void> {
  const [row] = await tx<{ id: number; item: string | null }[]>`
    select p.id, i.slug as item
      from price.source_item si
      join price.product_source_key k on k.source_item_id = si.id and k.valid_to is null
      join price.product p on p.id = k.product_id
      left join price.item i on i.id = p.item_id
     where si.source_key = ${productKey(goodId)}`
  if (!row) throw new Error(`참가격 상품 ${goodId}이 없다`)
  if (row.item === item) return
  await tx`update price.product set item_id = (select id from price.item where slug = ${item}) where id = ${row.id}`
  await tx`
    insert into price.catalog_change (actor, target, target_key, action, before, after, proposal_id)
    values (${actor}, 'product', ${productKey(goodId)}, 'update', ${tx.json({ item: row.item })}, ${tx.json({ item })}, ${proposalId})`
}

export type ApplyResult = { applied: number[]; changes: number; mappings: Awaited<ReturnType<typeof refreshMappings>> }

export async function applyProposals(tx: Tx, ids: readonly number[]): Promise<ApplyResult> {
  const proposals = await readProposals(tx, ids, ["proposed", "approved"])
  let changes = 0
  // 사본은 한 번만 읽고, 고친 사본을 이어서 쓴다 (넣은 사본이 곧 DB 카탈로그다). 제안마다 다시 읽으면 수백 건에 몇 분 걸린다
  let current = await exportSnapshot(tx)
  for (const p of proposals) {
    const actor = `proposal:${p.id}`
    const after = editSnapshot(current, p)
    if (after !== current) {
      changes += (await importSnapshot(tx, after, actor, p.id)).changes.length
      current = after
    }
    if (p.kind === "product_item") {
      const item = p.proposal.item as string | { slug: string }
      await setProductItem(tx, p.key, typeof item === "string" ? item : item.slug, actor, p.id)
    }
    await tx`update price.catalog_proposal set status = 'applied', decided_at = coalesce(decided_at, now()) where id = ${p.id}`
  }
  return { applied: proposals.map((p) => p.id), changes, mappings: await refreshMappings(tx) }
}

export async function rejectProposals(tx: Tx, ids: readonly number[]): Promise<number[]> {
  const proposals = await readProposals(tx, ids, ["proposed", "approved"])
  await tx`update price.catalog_proposal set status = 'rejected', decided_at = now() where id = any(${proposals.map((p) => p.id)})`
  return proposals.map((p) => p.id)
}

export type RevertResult = { reverted: number; changes: number; droppedSpecs: string[]; mappings: Awaited<ReturnType<typeof refreshMappings>> }

export async function revertProposal(tx: Tx, id: number): Promise<RevertResult> {
  const [p] = await readProposals(tx, [id], ["applied"])
  const actor = `revert:${id}`
  const logged = await tx<{ target: string; target_key: string; action: CatalogChange["action"]; before: unknown; after: unknown }[]>`
    select target, target_key, action, before, after from price.catalog_change
     where proposal_id = ${id} and actor = ${`proposal:${id}`} order by id`
  const snapshotChanges = logged
    .filter((c) => c.target !== "product")
    .map((c) => ({ target: c.target as CatalogChange["target"], targetKey: c.target_key, action: c.action, before: c.before, after: c.after }))
  // 되돌린 사본. importSnapshot은 규격을 지우지 않으니, 이 사본에 없는 규격은 아래에서 따로 지운다
  const restored = revertSnapshot(await exportSnapshot(tx), snapshotChanges)
  const changes = snapshotChanges.length > 0 ? (await importSnapshot(tx, restored, actor, id)).changes.length : 0
  for (const c of logged.filter((x) => x.target === "product")) {
    await setProductItem(tx, c.target_key.replace(/^chamga:/, ""), (c.before as { item: string | null }).item, actor, id)
  }

  // 규칙이 이은 매핑을 pending으로 되돌린다. 운영자가 따로 정한 매핑은 두지 않는다 (규칙 매핑만 note 'catalog'·origin 'operator')
  if (p!.source === "chamga") {
    await tx`
      update price.product_variety_map pm
         set status = 'pending', variety_id = null, spec_id = null, unit_rule_id = null
        from price.product_source_key k join price.source_item si on si.id = k.source_item_id
       where pm.product_id = k.product_id and k.valid_to is null and pm.valid_to is null
         and si.source_key = ${productKey(p!.key)} and pm.origin = 'operator'`
  } else {
    const rows = await tx<{ id: number; key_parts: Record<string, string> }[]>`
      select m.id, si.key_parts from price.source_code_map m join price.source_item si on si.id = m.source_item_id
       where si.source = ${p!.source} and m.valid_to is null and m.note = 'catalog'`
    const ids = rows.filter((r) => keyPatternOf(p!.source, r.key_parts) === p!.key).map((r) => r.id)
    await tx`
      update price.source_code_map
         set status = 'pending', variety_id = null, spec_id = null, unit_rule_id = null, note = null, updated_at = now()
       where id = any(${ids})`
  }
  const mappings = await refreshMappings(tx)

  // 사본에서 빠진 규격: 파생 행을 지우고 규격을 지운다 (관측값·매핑은 위에서 떼었다)
  const kept = new Set(restored.varieties.flatMap((v) => v.specs.map((s) => `${v.slug}/${s.slug}`)))
  const gone = await tx<{ id: number; key: string }[]>`
    select s.id, v.slug || '/' || s.slug as key from price.spec s join price.variety v on v.id = s.variety_id`
  const drop = gone.filter((s) => !kept.has(s.key))
  if (drop.length > 0) {
    const specIds = drop.map((s) => s.id)
    for (const table of ["daily_quote", "usual_price", "season_index", "reference_price"] as const) {
      await tx.unsafe(`delete from price.${table} where spec_id = any($1::int[])`, [specIds])
    }
    await tx`delete from price.spec where id = any(${specIds})`
  }
  await tx`update price.catalog_proposal set status = 'rejected', decided_at = now() where id = ${id}`
  return { reverted: id, changes, droppedSpecs: drop.map((s) => s.key), mappings }
}
