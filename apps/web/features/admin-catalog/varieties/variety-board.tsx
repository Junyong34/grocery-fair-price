"use client"

import { useMemo, useState } from "react"

import { Input } from "@workspace/ui/components/input"
import { NativeSelect, NativeSelectOption } from "@workspace/ui/components/native-select"
import { Segmented } from "@workspace/ui/components/segmented"

import { SCREEN_STATE_LABEL, screenStateOf, similarVarieties, type ScreenState, type VarietyRow } from "../lib/variety-view"
import type { VarietyCatalog } from "../server/varieties"

type View = "varieties" | "pending" | "seasonal"
type StateFilter = "all" | ScreenState

const SOURCE_LABEL = { kamis: "KAMIS", ekape: "축평원", chamga: "참가격" } as const
const VERDICT_LABEL = { cheap: "싸요", normal: "보통", pricey: "비싸요", none: "판정 전" } as const

// 화면 상태마다 표의 표시 색 (Oura 토큰)
const STATE_TONE: Record<ScreenState, string> = {
  shown: "bg-verdict-cheap-wash text-verdict-cheap-ink",
  "before-verdict": "bg-verdict-none-wash text-verdict-none-ink",
  "no-quote": "bg-gold-wash text-espresso",
  hidden: "bg-mat text-stone",
}

type Props = VarietyCatalog & { foodNames: Record<string, { name: string; category: string }> }

export function VarietyBoard(props: Props) {
  const [view, setView] = useState<View>("varieties")
  const { summary } = props
  return (
    <section className="flex flex-col gap-6">
      <dl className="grid grid-cols-6 gap-3">
        <Stat label="등록된 식재료" value={summary.total} />
        <Stat label="노출 · 판정" value={summary.shown} />
        <Stat label="노출 · 판정 전" value={summary.beforeVerdict} />
        <Stat label="미노출 · 시세 없음" value={summary.noQuote} />
        <Stat label="미노출 · 숨김" value={summary.hidden} />
        <Stat label="pending 원천 키·상품" value={summary.pending} />
      </dl>

      <Segmented<View>
        className="self-start"
        options={[
          { value: "varieties", label: `등록된 식재료 ${summary.total}` },
          { value: "pending", label: `pending ${summary.pending}` },
          { value: "seasonal", label: "제철달력 연결" },
        ]}
        value={view}
        onValueChange={setView}
      />

      {view === "varieties" && <VarietyTable rows={props.rows} foodNames={props.foodNames} />}
      {view === "pending" && <PendingTables {...props} />}
      {view === "seasonal" && <SeasonalGroups groups={props.seasonal} />}
    </section>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-mat px-4 py-3">
      <dt className="text-sm text-stone">{label}</dt>
      <dd className="font-number text-3xl text-ink tabular-nums">{value}</dd>
    </div>
  )
}

function VarietyTable({ rows, foodNames }: { rows: readonly VarietyRow[]; foodNames: Props["foodNames"] }) {
  const [category, setCategory] = useState("all")
  const [state, setState] = useState<StateFilter>("all")
  const [query, setQuery] = useState("")
  const categories = useMemo(() => [...new Set(rows.map((r) => r.category))], [rows])
  const q = query.trim()
  const visible = rows.filter(
    (r) =>
      (category === "all" || r.category === category) &&
      (state === "all" || screenStateOf(r) === state) &&
      (q === "" || r.name.includes(q) || r.slug.includes(q) || r.item.includes(q)),
  )
  // 같은 제철 품종에 묶인 시세 식재료 수 (그룹핑 확인용)
  const linkCount = useMemo(() => {
    const n = new Map<string, number>()
    for (const r of rows) for (const id of r.seasonal) n.set(id, (n.get(id) ?? 0) + 1)
    return n
  }, [rows])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <NativeSelect aria-label="카테고리" value={category} onChange={(e) => setCategory(e.target.value)} className="w-44">
          <NativeSelectOption value="all">카테고리 전체</NativeSelectOption>
          {categories.map((c) => (
            <NativeSelectOption key={c} value={c}>
              {c}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Segmented<StateFilter>
          options={[
            { value: "all", label: "전체" },
            { value: "shown", label: "노출" },
            { value: "before-verdict", label: "판정 전" },
            { value: "no-quote", label: "시세 없음" },
            { value: "hidden", label: "숨김" },
          ]}
          value={state}
          onValueChange={setState}
        />
        <Input aria-label="식재료 검색" placeholder="이름·slug·품목" value={query} onChange={(e) => setQuery(e.target.value)} className="w-56" />
        <p className="ml-auto text-sm text-stone tabular-nums">{visible.length}개</p>
      </div>

      <Table
        head={["카테고리", "품목", "식재료", "규격", "원천 키", "화면 상태", "판정", "조사일", "제철달력 연결"]}
        empty="조건에 맞는 식재료가 없어요."
        rows={visible.map((r) => {
          const s = screenStateOf(r)
          return {
            key: r.slug,
            cells: [
              <span key="c" className="whitespace-nowrap">{r.category}</span>,
              <span key="i" className="whitespace-nowrap">{r.item}</span>,
              <span key="n" className="flex flex-col">
                <span className="font-semibold whitespace-nowrap text-ink">{r.name}</span>
                <code className="text-xs whitespace-nowrap text-stone">{r.slug}</code>
              </span>,
              <span key="s" className="tabular-nums">{r.specs}</span>,
              <span key="k" className="text-sm whitespace-nowrap text-stone tabular-nums">
                {(["kamis", "ekape", "chamga"] as const)
                  .filter((src) => r.keys[src] > 0)
                  .map((src) => `${SOURCE_LABEL[src]} ${r.keys[src]}`)
                  .join(" · ") || "없음"}
              </span>,
              <span key="st" className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${STATE_TONE[s]}`}>
                {SCREEN_STATE_LABEL[s]}
              </span>,
              r.judgment ? (
                <span key="v" className="whitespace-nowrap tabular-nums">
                  {VERDICT_LABEL[r.judgment.verdict]}
                  {r.judgment.pct !== null ? ` ${r.judgment.pct > 0 ? "+" : ""}${r.judgment.pct}%` : ""}
                </span>
              ) : (
                <span key="v" className="text-stone">—</span>
              ),
              <span key="d" className="text-sm whitespace-nowrap text-stone tabular-nums">{r.judgment?.surveyedOn ?? "—"}</span>,
              r.seasonal.length === 0 ? (
                <span key="f" className="text-stone">연결 없음</span>
              ) : (
                <span key="f" className="flex flex-wrap gap-1.5">
                  {r.seasonal.map((id) => (
                    <span key={id} className="rounded-full bg-mat px-2.5 py-1 text-xs whitespace-nowrap text-ink">
                      {foodNames[id]?.name ?? id}
                      <span className="text-stone"> · {foodNames[id]?.category ?? "제철 목록에 없음"}</span>
                      {(linkCount.get(id) ?? 0) > 1 ? <span className="text-stone"> · {linkCount.get(id)}개 묶임</span> : null}
                    </span>
                  ))}
                </span>
              ),
            ],
          }
        })}
      />
    </div>
  )
}

function PendingTables({ pendingKeys, pendingProducts, ignoredProducts, rows }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold">KAMIS · 축평원 원천 키 {pendingKeys.length}개</h2>
        <p className="max-w-[70ch] text-sm text-pretty text-stone">
          들어왔지만 어느 식재료에도 잇지 않은 키예요. 관측값은 쌓이지만 시세 요약·판정에 들어가지 않아 화면에 나오지 않아요. 비슷한 식재료는 원문 이름의 첫 마디로 찾은 참고값이에요.
        </p>
        <Table
          head={["출처", "원문 이름", "원천 키", "처음 본 날", "마지막 본 날", "관측값", "비슷한 식재료"]}
          empty="pending 원천 키가 없어요."
          rows={pendingKeys.map((p) => ({
            key: p.key,
            cells: [
              SOURCE_LABEL[p.source],
              <span key="l" className="font-semibold text-ink">{p.label ?? "이름 없음"}</span>,
              <code key="k" className="text-xs text-stone">{p.key}</code>,
              <span key="f" className="text-sm text-stone tabular-nums">{p.firstSeen}</span>,
              <span key="s" className="text-sm text-stone tabular-nums">{p.lastSeen}</span>,
              <span key="o" className="tabular-nums">{p.observations.toLocaleString("ko-KR")}</span>,
              similarVarieties(p.label, rows).map((r) => r.name).join(", ") || <span key="x" className="text-stone">—</span>,
            ],
          }))}
        />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold">참가격 보류 상품 {pendingProducts.length}개</h2>
        <p className="max-w-[70ch] text-sm text-pretty text-stone">
          근거가 없어 식재료에 잇지 않고 미룬 상품이에요. 그 밖에 규칙이 없는 참가격 상품 {ignoredProducts.toLocaleString("ko-KR")}개(대부분 가공식품)는 ignored로 두었어요.
        </p>
        <Table
          head={["goodId", "상품 이름", "상품 분류(AL)", "보류 이유"]}
          empty="보류 상품이 없어요."
          rows={pendingProducts.map((p) => ({
            key: p.goodId,
            cells: [
              <code key="g" className="text-xs text-stone">{p.goodId}</code>,
              <span key="n" className="font-semibold text-ink">{p.name}</span>,
              <code key="a" className="text-xs text-stone">{p.alCode ?? "—"}</code>,
              <span key="r" className="text-sm text-stone">{p.reason ?? "규칙 없음"}</span>,
            ],
          }))}
        />
      </div>
    </div>
  )
}

function SeasonalGroups({ groups }: { groups: Props["seasonal"] }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-[70ch] text-sm text-pretty text-stone">
        제철달력의 분류마다 제철 품종과, 거기에 묶인 시세 식재료예요. 연결이 없으면 제철 상세에서 시세로 가는 링크가 생기지 않아요.
      </p>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        {groups.map((g) => (
          <section key={g.category} className="flex flex-col gap-3 rounded-2xl bg-surface p-5 shadow-sm">
            <h2 className="flex items-baseline justify-between gap-3">
              <span className="font-heading text-xl font-bold">{g.category}</span>
              <span className="text-sm text-stone tabular-nums">
                {g.linked}/{g.foods.length} 연결
              </span>
            </h2>
            <ul className="flex flex-col gap-1.5">
              {g.foods.map((f) => (
                <li key={f.id} className="flex items-baseline gap-2 text-sm">
                  <span className={f.varieties.length > 0 ? "font-semibold text-ink" : "text-stone"}>{f.name}</span>
                  <span className="text-stone">→</span>
                  <span className={f.varieties.length > 0 ? "text-ink" : "text-stone"}>
                    {f.varieties.length > 0 ? f.varieties.map((v) => v.name).join(", ") : "연결 없음"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

type TableRow = { key: string; cells: React.ReactNode[] }

function Table({ head, rows, empty }: { head: readonly string[]; rows: readonly TableRow[]; empty: string }) {
  if (rows.length === 0) return <p className="rounded-xl bg-mat px-4 py-6 text-center text-stone">{empty}</p>
  return (
    <div className="overflow-x-auto rounded-2xl bg-surface shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="sticky top-0 bg-surface">
          <tr className="border-b border-mat">
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-3 text-xs font-semibold whitespace-nowrap text-stone">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-mat last:border-0 align-top">
              {row.cells.map((cell, i) => (
                <td key={i} className="px-4 py-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
