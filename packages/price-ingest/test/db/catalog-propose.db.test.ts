// 제안 흐름을 로컬 DB에 넣어 본다 (catalog-scale/06). 모두 되돌려 샘플 데이터를 바꾸지 않는다.
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { importSnapshot } from "../../src/catalog/db.ts"
import { insertProposals, listPending } from "../../src/catalog/pending.ts"
import { parseProposalFile } from "../../src/catalog/proposal.ts"
import { readSnapshot } from "../../src/catalog/snapshot.ts"
import type { Sql, Tx } from "../../src/load/db.ts"

import { connectLocalAdmin, connectLocalIngest, inRollback } from "./local.ts"

let admin: Sql
let ingest: Sql

beforeAll(async () => {
  admin = connectLocalAdmin()
  ingest = await connectLocalIngest()
})

afterAll(async () => {
  await admin.end()
  await ingest.end()
})

// 고등어(국산) 냉동 大: 기존 품종의 보관 상태·크기 변형 (운영 pending의 흔한 모양)
async function pendingMackerel(tx: Tx, lastSeen = "2026-11-06") {
  const [row] = await tx<{ id: number }[]>`
    insert into price.source_item (source, source_key, key_parts, label, first_seen_on, last_seen_on)
    values ('kamis', 'kamis:01-600-611-06-20',
            ${tx.json({ se_cd: "01", ctgry_cd: "600", item_cd: "611", vrty_cd: "06", grd_cd: "20" })},
            '고등어/국산(냉동)/大', '2026-08-20', ${lastSeen})
    returning id`
  await tx`insert into price.source_code_map (source_item_id, valid_from, status) values (${row!.id}, '2026-08-20', 'pending')`
}

const proposal = (over: Record<string, unknown> = {}) =>
  parseProposalFile([{ source: "kamis", key: "611-06-20", kind: "map", proposal: { variety: "mackerel-kr", spec: "chilled" }, rationale: "고등어 국산", confidence: "medium", ...over }])

describe("pending 내보내기", () => {
  it("원천 키를 규칙 표기로, 같은 품목 코드의 규칙과 이름이 같은 품종을 붙여 내보낸다", async () => {
    await inRollback(admin, async (tx) => {
      await importSnapshot(tx, readSnapshot(), "test")
      await pendingMackerel(tx)
      const entries = await listPending(tx, { today: "2026-11-09" })
      const mackerel = entries.find((e) => e.key === "611-06-20")
      expect(mackerel).toMatchObject({ source: "kamis", label: "고등어/국산(냉동)/大", sourceCategory: "600", observations: 0, openProposal: null })
      expect(mackerel?.similar.sameCode.some((r) => r.variety === "mackerel-kr")).toBe(true)
      expect(mackerel?.similar.byName.map((v) => v.slug)).toContain("mackerel-kr")
      // 최근 관측이 먼저
      expect(entries.map((e) => e.lastSeen)).toEqual([...entries.map((e) => e.lastSeen)].sort().reverse())
    })
  })

  it("--source·--since로 거른다", async () => {
    await inRollback(admin, async (tx) => {
      await importSnapshot(tx, readSnapshot(), "test")
      await pendingMackerel(tx, "2026-09-01")
      expect((await listPending(tx, { today: "2026-11-09", sinceDays: 30 })).some((e) => e.key === "611-06-20")).toBe(false)
      expect((await listPending(tx, { today: "2026-11-09", source: "chamga" })).every((e) => e.source === "chamga")).toBe(true)
    })
  })

  it("ingest_writer로 읽기 전용 트랜잭션에서 돈다", async () => {
    await ingest.begin("read only", (tx) => listPending(tx, { today: "2026-11-09" }))
  })
})

describe("제안 넣기", () => {
  it("proposed로 넣고, 같은 키에 열린 제안이 있으면 덮지 않고 넘긴다. pending 매핑은 그대로다", async () => {
    await inRollback(admin, async (tx) => {
      await importSnapshot(tx, readSnapshot(), "test")
      await pendingMackerel(tx)
      const first = await insertProposals(tx, proposal(), "test")
      expect(first.inserted).toHaveLength(1)
      const [row] = await tx<{ status: string; kind: string; proposal: unknown; confidence: string }[]>`
        select status, kind, proposal, confidence from price.catalog_proposal where id = ${first.inserted[0]!.id}`
      expect(row).toEqual({ status: "proposed", kind: "map", proposal: { variety: "mackerel-kr", spec: "chilled" }, confidence: "medium" })

      const again = await insertProposals(tx, proposal({ rationale: "다시" }), "test")
      expect(again).toEqual({ inserted: [], skipped: [{ source: "kamis", key: "611-06-20", openProposal: first.inserted[0]!.id }] })

      const [map] = await tx<{ status: string }[]>`
        select m.status from price.source_code_map m join price.source_item si on si.id = m.source_item_id
         where si.source_key = 'kamis:01-600-611-06-20' and m.valid_to is null`
      expect(map?.status).toBe("pending")
      expect((await listPending(tx, { today: "2026-11-09" })).find((e) => e.key === "611-06-20")?.openProposal).toBe(first.inserted[0]!.id)
    })
  })

  it("없는 원천 키·규격, 이미 있는 slug를 가리키면 모두 모아 멈춘다", async () => {
    await inRollback(admin, async (tx) => {
      await importSnapshot(tx, readSnapshot(), "test")
      await pendingMackerel(tx)
      const entries = parseProposalFile([
        { source: "kamis", key: "611-06-20", kind: "map", proposal: { variety: "mackerel-kr", spec: "frozen-big" }, rationale: "r" },
        { source: "kamis", key: "999-99-99", kind: "hold", proposal: { reason: "r" }, rationale: "r" },
      ])
      await expect(insertProposals(tx, entries, "test")).rejects.toThrow(/frozen-big[\s\S]*999-99-99/)
      const dup = parseProposalFile([
        { source: "kamis", key: "611-06-20", kind: "new_spec", proposal: { variety: "mackerel-kr", spec: { slug: "chilled", name: "냉장" } }, rationale: "r" },
      ])
      await expect(insertProposals(tx, dup, "test")).rejects.toThrow(/이미 있다/)
    })
  })

  it("ingest_writer는 제안을 넣지 못한다 (소유자만 쓴다)", async () => {
    await inRollback(ingest, async (tx) => {
      await expect(tx`insert into price.catalog_proposal (source, key_pattern, kind, proposal, rationale, proposed_by, status)
        values ('kamis', 'x', 'hold', '{}', 'r', 'test', 'proposed')`).rejects.toThrow(/permission denied/)
    })
  })
})
