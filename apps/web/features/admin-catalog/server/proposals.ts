import "server-only"

import type { CatalogNames, ProposalKind } from "../lib/proposal-view"
import { ownerDb, ownerDbLabel } from "./owner-db"

// 제안 검토 어드민의 읽기 (catalog-scale/07). 쓰기와 같은 소유자 접속으로 읽기 전용 트랜잭션에서 읽는다.

export type ProposalRow = {
  id: number
  source: "kamis" | "ekape" | "chamga"
  key: string // catalog_key_rule.key_pattern 표기
  label: string | null // 원문 이름 (KAMIS `품목/품종/등급`, 참가격 상품명)
  lastSeen: string | null
  observations: number // 남아 있는 관측값 수 (적용하면 다시 매핑될 행)
  kind: ProposalKind
  proposal: Record<string, unknown>
  rationale: string
  confidence: "high" | "medium" | "low" | null
  proposedBy: string
  status: "proposed" | "approved" | "rejected" | "applied"
  createdAt: string
  decidedAt: string | null
}

export type ProposalBoardData = { open: ProposalRow[]; decided: ProposalRow[]; names: CatalogNames; db: ReturnType<typeof ownerDbLabel> }

const DECIDED_LIMIT = 100

export async function getProposalBoard(): Promise<ProposalBoardData> {
  return ownerDb().begin("read only", async (sql) => {
    // 원천 키 표기는 catalog_key_rule과 같다 (KAMIS 품목-품종-등급, 축평원 축종-품목코드-구분명, 참가격 goodId)
    const rows = await sql<(Omit<ProposalRow, "createdAt" | "decidedAt"> & { createdAt: string; decidedAt: string | null })[]>`
      with keyed as (
        select si.id, si.source, si.label, si.last_seen_on,
               case si.source
                 when 'kamis' then concat_ws('-', si.key_parts->>'item_cd', si.key_parts->>'vrty_cd', si.key_parts->>'grd_cd')
                 when 'ekape' then concat_ws('-', si.key_parts->>'judgeKind', si.key_parts->>'itemCd', si.key_parts->>'grdNm')
                 else si.key_parts->>'goodId'
               end as key
          from price.source_item si
         where si.source in (select distinct source from price.catalog_proposal)
      )
      select p.id::int, p.source, p.key_pattern as key, p.kind, p.proposal, p.rationale, p.confidence,
             p.proposed_by as "proposedBy", p.status, p.created_at::text as "createdAt", p.decided_at::text as "decidedAt",
             coalesce(pr.name, k.label) as label, k.last_seen_on::text as "lastSeen",
             coalesce((select count(*)::int from price.observation o where o.source_item_id = k.id), 0) as observations
        from price.catalog_proposal p
        left join keyed k on k.source = p.source and k.key = p.key_pattern
        left join lateral (
          select pp.name from price.product_source_key psk join price.product pp on pp.id = psk.product_id
           where psk.source_item_id = k.id and psk.valid_to is null limit 1
        ) pr on p.source = 'chamga'
       order by p.id`
    const varieties = await sql<{ slug: string; name: string; specs: Record<string, string> | null }[]>`
      select v.slug, v.name, (select jsonb_object_agg(s.slug, s.name) from price.spec s where s.variety_id = v.id) as specs
        from price.variety v`
    const items = await sql<{ slug: string; name: string }[]>`select slug, name from price.item`
    const open = rows.filter((r) => r.status === "proposed" || r.status === "approved")
    const decided = rows
      .filter((r) => r.status === "applied" || r.status === "rejected")
      .sort((a, b) => (b.decidedAt ?? "").localeCompare(a.decidedAt ?? "") || b.id - a.id)
      .slice(0, DECIDED_LIMIT)
    return {
      open,
      decided,
      names: {
        varieties: Object.fromEntries(varieties.map((v) => [v.slug, { name: v.name, specs: v.specs ?? {} }])),
        items: Object.fromEntries(items.map((i) => [i.slug, i.name])),
      },
      db: ownerDbLabel(),
    }
  })
}
