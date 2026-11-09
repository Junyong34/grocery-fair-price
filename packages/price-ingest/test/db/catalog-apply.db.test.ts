// 제안 승인 적용·반려·되돌리기를 로컬 DB에 넣어 본다 (catalog-scale/08). 모두 되돌려 샘플 데이터를 바꾸지 않는다.
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { exportSnapshot, importSnapshot } from "../../src/catalog/db.ts"
import { insertProposals } from "../../src/catalog/pending.ts"
import { parseProposalFile } from "../../src/catalog/proposal.ts"
import { applyProposals, rejectProposals, revertProposal } from "../../src/catalog/proposals.ts"
import { refreshJudgment } from "../../src/catalog/refresh.ts"
import { readSnapshot } from "../../src/catalog/snapshot.ts"
import type { Sql, Tx } from "../../src/load/db.ts"

import { connectLocalAdmin, inRollback } from "./local.ts"

let admin: Sql

beforeAll(() => {
  admin = connectLocalAdmin()
})

afterAll(async () => {
  await admin.end()
})

// KAMIS 고등어 냉동 大를 pending으로 등록한다
async function pendingMackerel(tx: Tx) {
  const [row] = await tx<{ id: number }[]>`
    insert into price.source_item (source, source_key, key_parts, label, first_seen_on, last_seen_on)
    values ('kamis', 'kamis:01-600-611-06-20',
            ${tx.json({ se_cd: "01", ctgry_cd: "600", item_cd: "611", vrty_cd: "06", grd_cd: "20" })},
            '고등어/국산(냉동)/大', '2026-08-20', '2026-11-06')
    returning id`
  await tx`insert into price.source_code_map (source_item_id, valid_from, status) values (${row!.id}, '2026-08-20', 'pending')`
}

async function propose(tx: Tx, entry: Record<string, unknown>): Promise<number> {
  const result = await insertProposals(tx, parseProposalFile([{ source: "kamis", key: "611-06-20", rationale: "test", ...entry }]), "test")
  return result.inserted[0]!.id
}

async function mackerelMap(tx: Tx) {
  const [row] = await tx<{ status: string; variety: string | null; spec: string | null }[]>`
    select m.status, v.slug as variety, s.slug as spec
      from price.source_item si join price.source_code_map m on m.source_item_id = si.id and m.valid_to is null
      left join price.variety v on v.id = m.variety_id left join price.spec s on s.id = m.spec_id
     where si.source_key = 'kamis:01-600-611-06-20'`
  return row
}

async function setup(tx: Tx) {
  await importSnapshot(tx, readSnapshot(), "test")
  await pendingMackerel(tx)
  return exportSnapshot(tx)
}

describe("승인 적용", () => {
  it("new_spec: 규격을 만들어 잇고, 변경 기록에 제안 번호를 남기고, 제안을 applied로 둔다", async () => {
    await inRollback(admin, async (tx) => {
      await setup(tx)
      const id = await propose(tx, { kind: "new_spec", proposal: { variety: "mackerel-kr", spec: { slug: "frozen-l", name: "냉동 대" } } })
      const result = await applyProposals(tx, [id])
      expect(result.applied).toEqual([id])
      expect(await mackerelMap(tx)).toEqual({ status: "mapped", variety: "mackerel-kr", spec: "frozen-l" })
      const [log] = await tx<{ target: string; target_key: string; actor: string }[]>`
        select target, target_key, actor from price.catalog_change where proposal_id = ${id}`
      expect(log).toEqual({ target: "variety", target_key: "mackerel-kr", actor: `proposal:${id}` })
      const [p] = await tx<{ status: string; decided: boolean }[]>`
        select status, decided_at is not null as decided from price.catalog_proposal where id = ${id}`
      expect(p).toEqual({ status: "applied", decided: true })
      await expect(applyProposals(tx, [id])).rejects.toThrow(/applied/)
    })
  })

  it("map·ignore: 기존 규격에 잇거나 제외한다", async () => {
    await inRollback(admin, async (tx) => {
      await setup(tx)
      const id = await propose(tx, { kind: "ignore", proposal: { reason: "더 오지 않는다" } })
      await applyProposals(tx, [id])
      expect((await mackerelMap(tx))?.status).toBe("ignored")
    })
    await inRollback(admin, async (tx) => {
      await setup(tx)
      const id = await propose(tx, { kind: "map", proposal: { variety: "mackerel-kr", spec: "chilled" } })
      await applyProposals(tx, [id])
      expect(await mackerelMap(tx)).toEqual({ status: "mapped", variety: "mackerel-kr", spec: "chilled" })
    })
  })

  it("반려는 카탈로그를 바꾸지 않는다", async () => {
    await inRollback(admin, async (tx) => {
      const before = await setup(tx)
      const id = await propose(tx, { kind: "map", proposal: { variety: "mackerel-kr", spec: "chilled" } })
      expect(await rejectProposals(tx, [id])).toEqual([id])
      expect(await exportSnapshot(tx)).toEqual(before)
      expect((await mackerelMap(tx))?.status).toBe("pending")
    })
  })

  it("적용 뒤 판정 묶음을 다시 낸다", async () => {
    await inRollback(admin, async (tx) => {
      await setup(tx)
      const id = await propose(tx, { kind: "new_spec", proposal: { variety: "mackerel-kr", spec: { slug: "frozen-l", name: "냉동 대" } } })
      await applyProposals(tx, [id])
      const { judgment } = await refreshJudgment(tx)
      const [batch] = await tx<{ trigger: string }[]>`select trigger from price.judgment_batch where id = ${judgment.batchId}`
      expect(batch?.trigger).toBe("catalog")
    })
  })
})

describe("되돌리기", () => {
  it("new_spec을 되돌리면 사본·매핑이 적용 전과 같고 규격이 지워진다", async () => {
    await inRollback(admin, async (tx) => {
      const before = await setup(tx)
      const id = await propose(tx, { kind: "new_spec", proposal: { variety: "mackerel-kr", spec: { slug: "frozen-l", name: "냉동 대" } } })
      await applyProposals(tx, [id])
      const result = await revertProposal(tx, id)
      expect(result.droppedSpecs).toEqual(["mackerel-kr/frozen-l"])
      expect(await exportSnapshot(tx)).toEqual(before)
      expect(await mackerelMap(tx)).toEqual({ status: "pending", variety: null, spec: null })
      const [p] = await tx<{ status: string }[]>`select status from price.catalog_proposal where id = ${id}`
      expect(p?.status).toBe("rejected")
    })
  })

  it("new_variety를 되돌리면 품종을 숨기고 매핑은 pending이다", async () => {
    await inRollback(admin, async (tx) => {
      await setup(tx)
      const id = await propose(tx, {
        kind: "new_variety",
        proposal: { item: "mackerel", variety: { slug: "mackerel-test", name: "고등어(시험)", unit: "1개" }, spec: { slug: "frozen-l", name: "냉동 대" } },
      })
      await applyProposals(tx, [id])
      expect(await mackerelMap(tx)).toEqual({ status: "mapped", variety: "mackerel-test", spec: "frozen-l" })
      await revertProposal(tx, id)
      const [v] = await tx<{ status: string }[]>`select status from price.variety where slug = 'mackerel-test'`
      expect(v?.status).toBe("hidden")
      expect((await mackerelMap(tx))?.status).toBe("pending")
    })
  })

  it("product_item: 상품의 품목을 정하고, 되돌리면 전 값으로", async () => {
    await inRollback(admin, async (tx) => {
      await setup(tx)
      const itemOf = async () =>
        (await tx<{ item: string | null }[]>`
          select i.slug as item from price.source_item si
            join price.product_source_key k on k.source_item_id = si.id and k.valid_to is null
            join price.product p on p.id = k.product_id left join price.item i on i.id = p.item_id
           where si.source_key = 'chamga:1000'`)[0]?.item
      const before = await itemOf()
      const id = await propose(tx, { source: "chamga", key: "1000", kind: "product_item", proposal: { item: "nuts" } })
      await applyProposals(tx, [id])
      expect(await itemOf()).toBe("nuts")
      await revertProposal(tx, id)
      expect(await itemOf()).toBe(before)
    })
  })
})
