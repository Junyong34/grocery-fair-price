// 제안 결정(decideProposals: 적용·반려·되돌리기)을 로컬 DB에 넣어 본다 (catalog-scale/07·08). 모두 되돌려 샘플 데이터를 바꾸지 않는다.
// 테스트 트랜잭션(inRollback)을 넘기면 decideProposals는 그 안의 savepoint로 돈다.
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { exportSnapshot, importSnapshot } from "../../src/catalog/db.ts"
import { insertProposals } from "../../src/catalog/pending.ts"
import { parseProposalFile } from "../../src/catalog/proposal.ts"
import { decideProposals, type DecisionRequest } from "../../src/catalog/decide.ts"
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

// 카탈로그에 없는 KAMIS 키(고등어 품종 99, 시험용)를 pending으로 등록한다. 실제 키를 쓰면 카탈로그가 바뀔 때 테스트가 깨진다
async function pendingMackerel(tx: Tx) {
  const [row] = await tx<{ id: number }[]>`
    insert into price.source_item (source, source_key, key_parts, label, first_seen_on, last_seen_on)
    values ('kamis', 'kamis:01-600-611-99-20',
            ${tx.json({ se_cd: "01", ctgry_cd: "600", item_cd: "611", vrty_cd: "99", grd_cd: "20" })},
            '고등어/시험(냉동)/大', '2026-08-20', '2026-11-06')
    returning id`
  await tx`insert into price.source_code_map (source_item_id, valid_from, status) values (${row!.id}, '2026-08-20', 'pending')`
}

async function propose(tx: Tx, entry: Record<string, unknown>): Promise<number> {
  const result = await insertProposals(tx, parseProposalFile([{ source: "kamis", key: "611-99-20", rationale: "test", ...entry }]), "test")
  return result.inserted[0]!.id
}

async function mackerelMap(tx: Tx) {
  const [row] = await tx<{ status: string; variety: string | null; spec: string | null }[]>`
    select m.status, v.slug as variety, s.slug as spec
      from price.source_item si join price.source_code_map m on m.source_item_id = si.id and m.valid_to is null
      left join price.variety v on v.id = m.variety_id left join price.spec s on s.id = m.spec_id
     where si.source_key = 'kamis:01-600-611-99-20'`
  return row
}

// 판정 묶음은 기본으로 끈다(느리다). 판정을 보는 테스트만 켠다
const decide = (tx: Tx, action: DecisionRequest["action"], ids: number[], over: Partial<DecisionRequest> = {}) =>
  decideProposals(tx, { action, ids, judgment: false, dryRun: false, ...over })

async function setup(tx: Tx) {
  await importSnapshot(tx, readSnapshot(), "test")
  await pendingMackerel(tx)
  return exportSnapshot(tx)
}

describe("승인 적용", () => {
  it("new_spec: 규격을 만들어 잇고, 변경 기록에 제안 번호를 남기고, 제안을 applied로 둔다", async () => {
    await inRollback(admin, async (tx) => {
      await setup(tx)
      const id = await propose(tx, { kind: "new_spec", proposal: { variety: "mackerel-kr", spec: { slug: "frozen-test", name: "냉동 대" } } })
      const result = await decide(tx, "apply", [id])
      expect(result.ids).toEqual([id])
      expect(result.snapshot?.varieties.find((v) => v.slug === "mackerel-kr")?.specs.map((sp) => sp.slug)).toContain("frozen-test")
      expect(await mackerelMap(tx)).toEqual({ status: "mapped", variety: "mackerel-kr", spec: "frozen-test" })
      const [log] = await tx<{ target: string; target_key: string; actor: string }[]>`
        select target, target_key, actor from price.catalog_change where proposal_id = ${id}`
      expect(log).toEqual({ target: "variety", target_key: "mackerel-kr", actor: `proposal:${id}` })
      const [p] = await tx<{ status: string; decided: boolean }[]>`
        select status, decided_at is not null as decided from price.catalog_proposal where id = ${id}`
      expect(p).toEqual({ status: "applied", decided: true })
      await expect(decide(tx, "apply", [id])).rejects.toThrow(/applied/)
    })
  })

  it("map·ignore: 기존 규격에 잇거나 제외한다", async () => {
    await inRollback(admin, async (tx) => {
      await setup(tx)
      const id = await propose(tx, { kind: "ignore", proposal: { reason: "더 오지 않는다" } })
      await decide(tx, "apply", [id])
      expect((await mackerelMap(tx))?.status).toBe("ignored")
    })
    await inRollback(admin, async (tx) => {
      await setup(tx)
      const id = await propose(tx, { kind: "map", proposal: { variety: "mackerel-kr", spec: "chilled" } })
      await decide(tx, "apply", [id])
      expect(await mackerelMap(tx)).toEqual({ status: "mapped", variety: "mackerel-kr", spec: "chilled" })
    })
  })

  it("반려는 카탈로그를 바꾸지 않는다", async () => {
    await inRollback(admin, async (tx) => {
      const before = await setup(tx)
      const id = await propose(tx, { kind: "map", proposal: { variety: "mackerel-kr", spec: "chilled" } })
      const result = await decide(tx, "reject", [id])
      expect(result).toMatchObject({ ids: [id], mappings: null, snapshot: null })
      expect(await exportSnapshot(tx)).toEqual(before)
      expect((await mackerelMap(tx))?.status).toBe("pending")
    })
  })

  it("적용 뒤 판정 묶음을 다시 낸다", async () => {
    await inRollback(admin, async (tx) => {
      await setup(tx)
      const id = await propose(tx, { kind: "new_spec", proposal: { variety: "mackerel-kr", spec: { slug: "frozen-test", name: "냉동 대" } } })
      const { judgment } = await decide(tx, "apply", [id], { judgment: true })
      const [batch] = await tx<{ trigger: string }[]>`select trigger from price.judgment_batch where id = ${judgment!.batchId}`
      expect(batch?.trigger).toBe("catalog")
    })
  })

  it("product_item: 두 상품이 같은 새 품목을 가리키면 품목을 한 번 만들고 둘 다 그 품목에 속한다", async () => {
    await inRollback(admin, async (tx) => {
      await setup(tx)
      const ramen = { slug: "ramen-test", name: "라면(시험)", category: "noodles" }
      const a = await propose(tx, { source: "chamga", key: "1000", kind: "product_item", proposal: { item: ramen } })
      const b = await propose(tx, { source: "chamga", key: "302", kind: "product_item", proposal: { item: ramen } })
      await decide(tx, "apply", [a, b])
      const rows = await tx<{ item: string }[]>`
        select i.slug as item from price.source_item si
          join price.product_source_key k on k.source_item_id = si.id and k.valid_to is null
          join price.product p on p.id = k.product_id join price.item i on i.id = p.item_id
         where si.source_key in ('chamga:1000', 'chamga:302')`
      expect(rows.map((r) => r.item)).toEqual(["ramen-test", "ramen-test"])
      const [log] = await tx<{ n: number }[]>`select count(*)::int as n from price.catalog_change where target = 'item' and target_key = 'ramen-test'`
      expect(log?.n).toBe(1)
    })
  })
})

describe("되돌리기", () => {
  it("new_spec을 되돌리면 사본·매핑이 적용 전과 같고 규격이 지워진다", async () => {
    await inRollback(admin, async (tx) => {
      const before = await setup(tx)
      const id = await propose(tx, { kind: "new_spec", proposal: { variety: "mackerel-kr", spec: { slug: "frozen-test", name: "냉동 대" } } })
      await decide(tx, "apply", [id])
      const result = await decide(tx, "revert", [id])
      expect(result.droppedSpecs).toEqual(["mackerel-kr/frozen-test"])
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
        proposal: { item: "mackerel", variety: { slug: "mackerel-test", name: "고등어(시험)", unit: "1개" }, spec: { slug: "frozen-test", name: "냉동 대" } },
      })
      await decide(tx, "apply", [id])
      expect(await mackerelMap(tx)).toEqual({ status: "mapped", variety: "mackerel-test", spec: "frozen-test" })
      await decide(tx, "revert", [id])
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
      await decide(tx, "apply", [id])
      expect(await itemOf()).toBe("nuts")
      await decide(tx, "revert", [id])
      expect(await itemOf()).toBe(before)
    })
  })

  it("여러 건은 적용한 순서의 역순으로 푼다: 같은 키를 두 번 바꿨어도 처음 상태로 돌아간다", async () => {
    await inRollback(admin, async (tx) => {
      const before = await setup(tx)
      // 같은 원천 키를 새 규격에 잇고(first), 다시 기존 규격으로 옮긴다(second)
      const first = await propose(tx, { kind: "new_spec", proposal: { variety: "mackerel-kr", spec: { slug: "frozen-test", name: "냉동 대" } } })
      await decide(tx, "apply", [first])
      await tx`update price.catalog_proposal set decided_at = now() - interval '1 minute' where id = ${first}`
      const second = await propose(tx, { kind: "map", proposal: { variety: "mackerel-kr", spec: "chilled" } })
      await decide(tx, "apply", [second])
      // 받은 순서와 상관없이 나중에 적용한 것부터 푼다
      const result = await decide(tx, "revert", [first, second])
      expect(result.ids).toEqual([second, first])
      expect(result.snapshot).toEqual(before)
      expect(await mackerelMap(tx)).toEqual({ status: "pending", variety: null, spec: null })
    })
  })
})

describe("dry-run", () => {
  it("적용한 결과를 돌려주고 모두 되돌린다. 사본은 null이다", async () => {
    await inRollback(admin, async (tx) => {
      const before = await setup(tx)
      const id = await propose(tx, { kind: "map", proposal: { variety: "mackerel-kr", spec: "chilled" } })
      const result = await decide(tx, "apply", [id], { dryRun: true })
      expect(result).toMatchObject({ ids: [id], dryRun: true, snapshot: null })
      expect(result.mappings?.mapped).toBeGreaterThan(0)
      expect(await exportSnapshot(tx)).toEqual(before)
      expect((await mackerelMap(tx))?.status).toBe("pending")
      const [p] = await tx<{ status: string }[]>`select status from price.catalog_proposal where id = ${id}`
      expect(p?.status).toBe("proposed")
    })
  })
})

