// schema-map.html의 ERD를 실제 DB 카탈로그에서 만든다.
// 로컬 DB(supabase start, 마이그레이션 적용 뒤)의 price 스키마를 읽어 묶음마다 Mermaid erDiagram을 쓰고,
// HTML의 <!-- erd:group-N --> … <!-- /erd:group-N --> 사이를 바꾼다. 묶음 설명 글은 손으로 쓴 그대로 둔다.
// 실행: pnpm --filter @workspace/price-db erd          (HTML을 고친다)
//       pnpm --filter @workspace/price-db erd --check  (HTML이 DB와 다르면 실패)
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { connectAdmin } from "../src/db.ts"

const HTML = fileURLToPath(new URL("../../../grocery-price/docs/30-data/schema-map.html", import.meta.url))

// 묶음과 그 묶음이 "가진" 표. 표는 정확히 한 묶음에 속해야 한다 (새 표를 만들면 여기에 넣는다).
// 다른 묶음의 표는 FK로 가리킬 때 열 없이 이름만 그린다.
const GROUPS: { id: number; tables: string[]; hideParents?: string[] }[] = [
  { id: 1, tables: ["category", "item", "variety", "spec", "alias", "variety_seasonal_map",
                    "source_item", "source_code_map", "unit_rule", "source_code_table"] },
  { id: 2, tables: ["obs_place", "store", "market", "region", "region_code_map", "store_seller", "seller", "store_link"] },
  { id: 3, tables: ["observation", "observation_revision", "reference_observation"],
    hideParents: ["unit_rule"] },
  { id: 4, tables: ["product", "product_source_key", "product_attr_history", "product_variety_map", "al_variety_rule"],
    hideParents: ["unit_rule", "raw_object"] },
  { id: 5, tables: ["daily_quote", "product_daily_summary", "reference_price", "usual_price",
                    "judgment_batch", "judgment_current", "judgment_snapshot", "calc_param", "current_judgment"] },
  { id: 6, tables: ["ingest_run", "raw_object", "source_master_change", "source_day", "source_day_part", "backfill_task"] },
]

// FK가 없는 논리 연결 (점선). DB 카탈로그에 없어 여기에 적는다.
const LOGICAL_LINKS: { parent: string; child: string; label: string }[] = [
  { parent: "observation", child: "observation_revision", label: "관측값 PK (FK 없음)" },
]

// 키가 아니어도 그림에 넣을 열
const EXTRA_COLUMNS: Record<string, string[]> = {
  observation_revision: ["source_item_id", "obs_date", "place_id"],   // 관측값 PK를 FK 없이 든다
}

type Column = { table: string; name: string; type: string; notnull: boolean; num: number }
type Constraint = { table: string; name: string; type: "p" | "u" | "f" | "c" | "x"; cols: string[];
                    parent: string | null; def: string }

const sql = connectAdmin()
try {
  const columns = await sql<Column[]>`
    select c.relname as table, a.attname as name, format_type(a.atttypid, a.atttypmod) as type,
           a.attnotnull as notnull, a.attnum as num
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'price' and c.relkind in ('r', 'v') and a.attnum > 0 and not a.attisdropped
    order by c.relname, a.attnum`
  const constraints = await sql<Constraint[]>`
    select c.relname as table, k.conname as name, k.contype as type,
           coalesce((select array_agg(a.attname order by x.ord) from unnest(k.conkey) with ordinality x (attnum, ord)
                     join pg_attribute a on a.attrelid = k.conrelid and a.attnum = x.attnum), '{}') as cols,
           p.relname as parent, pg_get_constraintdef(k.oid) as def
    from pg_constraint k
    join pg_class c on c.oid = k.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    left join pg_class p on p.oid = k.confrelid
    where n.nspname = 'price'
    order by c.relname, k.conname`
  // 제약이 아닌 unique 인덱스 (부분 unique: spec_one_default)
  const partialUniques = await sql<{ table: string; cols: string[]; pred: string }[]>`
    select c.relname as table,
           array(select a.attname from unnest(i.indkey) x (attnum) join pg_attribute a
                 on a.attrelid = i.indrelid and a.attnum = x.attnum) as cols,
           pg_get_expr(i.indpred, i.indrelid) as pred
    from pg_index i
    join pg_class c on c.oid = i.indrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'price' and i.indisunique and i.indpred is not null`
  const viewDeps = await sql<{ view: string; table: string }[]>`
    select distinct v.relname as view, t.relname as table
    from pg_rewrite r
    join pg_class v on v.oid = r.ev_class
    join pg_depend d on d.objid = r.oid and d.classid = 'pg_rewrite'::regclass
    join pg_class t on t.oid = d.refobjid and t.oid <> v.oid
    join pg_namespace n on n.oid = v.relnamespace
    where n.nspname = 'price' and v.relkind = 'v'
    order by 1, 2`
  const kinds = await sql<{ relname: string; relkind: string }[]>`
    select c.relname, c.relkind from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'price' and c.relkind in ('r', 'v')`

  const all = kinds.map((k) => k.relname).sort()
  const grouped = GROUPS.flatMap((g) => g.tables).sort()
  const missing = all.filter((t) => !grouped.includes(t))
  const extra = grouped.filter((t) => !all.includes(t))
  if (missing.length || extra.length || new Set(grouped).size !== grouped.length) {
    throw new Error(`GROUPS가 DB와 다르다. 빠진 표: ${missing.join(", ") || "-"} / 없는 표: ${extra.join(", ") || "-"}`)
  }

  const byTable = (t: string) => constraints.filter((c) => c.table === t)

  // check (col = any (array['a', 'b'])) 또는 check (col = 'a')에서 값 목록을 뽑는다
  function enumValues(table: string, column: string): string[] | null {
    for (const c of byTable(table).filter((c) => c.type === "c")) {
      const any = new RegExp(`^CHECK \\(\\(${column} = ANY \\(ARRAY\\[(.*)\\]\\)\\)\\)$`).exec(c.def)
      if (any) return [...any[1]!.matchAll(/'([^']*)'::text/g)].map((m) => m[1]!)
      const one = new RegExp(`^CHECK \\(\\(${column} = '([^']*)'::text\\)\\)$`).exec(c.def)
      if (one) return [one[1]!]
    }
    return null
  }

  function shortType(type: string): string {
    return type
      .replace(/^integer$/, "int")
      .replace(/^boolean$/, "bool")
      .replace(/^timestamp with time zone$/, "timestamptz")
      .replace(/^numeric\(.*\)$/, "numeric")
      .replace(/^text\[\]$/, "text_list")
  }

  function entity(table: string): string {
    const cs = byTable(table)
    const pk = new Set(cs.find((c) => c.type === "p")?.cols ?? [])
    const fk = new Set(cs.filter((c) => c.type === "f").flatMap((c) => c.cols))
    const uniques = cs.filter((c) => c.type === "u")
    const uk = new Set(uniques.filter((u) => u.cols.length === 1).flatMap((u) => u.cols))
    const notes = new Map<string, string[]>()
    const note = (col: string, text: string) => notes.set(col, [...(notes.get(col) ?? []), text])
    for (const u of uniques.filter((u) => u.cols.length > 1)) note(u.cols[0]!, `unique (${u.cols.join(", ")})`)
    for (const x of cs.filter((c) => c.type === "x")) {
      const period = /daterange\((\w+)/.exec(x.def)?.[1]
      if (period) note(period, "기간 겹침 거부")
    }
    for (const p of partialUniques.filter((p) => p.table === table)) note(p.cols[0]!, `where ${p.pred} 하나`)
    const view = kinds.find((k) => k.relname === table)?.relkind === "v"

    const lines: string[] = []
    for (const col of columns.filter((c) => c.table === table)) {
      const values = view ? null : enumValues(table, col.name)
      const keys = [pk.has(col.name) && "PK", fk.has(col.name) && "FK", uk.has(col.name) && "UK"].filter(Boolean)
      const shown = view ? pk.has(col.name) || ["batch_id", "variety_id", "spec_id", "verdict"].includes(col.name)
                         : keys.length > 0 || values !== null || notes.has(col.name) ||
                           (EXTRA_COLUMNS[table]?.includes(col.name) ?? false)
      if (!shown) continue
      const comment = [...(values ? [values.join(" ")] : []), ...(notes.get(col.name) ?? [])].join(", ")
      lines.push(`    ${shortType(col.type)} ${col.name}${keys.length ? " " + keys.join(", ") : ""}${comment ? ` "${comment}"` : ""}`)
    }
    if (view) lines.unshift(`    text _ "뷰 (security_invoker)"`)
    return `  ${table} {\n${lines.join("\n")}\n  }`
  }

  function relation(fk: Constraint): string {
    const cols = columns.filter((c) => c.table === fk.table && fk.cols.includes(c.name))
    const parentSide = cols.every((c) => c.notnull) ? "||" : "|o"
    const own = byTable(fk.table).filter((c) => c.type === "p" || c.type === "u")
    const oneToOne = own.some((c) => c.cols.length === fk.cols.length && c.cols.every((x) => fk.cols.includes(x)))
    const label = fk.cols.length === 1 && fk.cols[0] === `${fk.parent}_id` ? "" :
      fk.cols.length > 1 ? `(${fk.cols.join(", ")})` : fk.cols[0]!
    return `  ${fk.parent} ${parentSide}--${oneToOne ? "o|" : "o{"} ${fk.table} : "${label}"`
  }

  function diagram(group: (typeof GROUPS)[number]): string {
    const rels: string[] = []
    for (const t of group.tables) {
      for (const fk of byTable(t).filter((c) => c.type === "f")) {
        if (group.hideParents?.includes(fk.parent!) && !group.tables.includes(fk.parent!)) continue
        rels.push(relation(fk))
      }
      for (const d of viewDeps.filter((d) => d.view === t)) rels.push(`  ${d.table} ||..o{ ${t} : "뷰가 읽음"`)
    }
    for (const l of LOGICAL_LINKS.filter((l) => group.tables.includes(l.child))) {
      rels.push(`  ${l.parent} |o..o{ ${l.child} : "${l.label}"`)
    }
    return ["<pre class=\"mermaid\">", "erDiagram", ...rels, ...group.tables.map(entity), "</pre>"].join("\n")
  }

  let html = readFileSync(HTML, "utf8")
  const replace = (marker: string, body: string) => {
    const re = new RegExp(`(<!-- erd:${marker} -->)[\\s\\S]*?(<!-- /erd:${marker} -->)`)
    if (!re.test(html)) throw new Error(`schema-map.html에 표식이 없다: erd:${marker}`)
    html = html.replace(re, (_, open: string, close: string) => `${open}${body}${close}`)
  }
  for (const g of GROUPS) replace(`group-${g.id}`, `\n${diagram(g)}\n`)
  const tables = kinds.filter((k) => k.relkind === "r").length
  const views = kinds.filter((k) => k.relkind === "v").length
  replace("counts", `스키마 <code>price</code> · 테이블 <b>${tables}</b>개 + 뷰 <b>${views}</b> · 묶음 <b>${GROUPS.length}</b>개`)

  if (process.argv.includes("--check")) {
    if (readFileSync(HTML, "utf8") !== html) {
      console.error("schema-map.html의 ERD가 DB와 다르다. pnpm --filter @workspace/price-db erd로 다시 만든다.")
      process.exitCode = 1
    }
  } else {
    writeFileSync(HTML, html)
    console.log(`schema-map.html: 테이블 ${tables}개, 뷰 ${views}개, 묶음 ${GROUPS.length}개`)
  }
} finally {
  await sql.end()
}
