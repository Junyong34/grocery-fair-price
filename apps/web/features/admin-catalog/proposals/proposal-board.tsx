"use client"

import { useMemo, useState, useTransition } from "react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { NativeSelect, NativeSelectOption } from "@workspace/ui/components/native-select"
import { Segmented } from "@workspace/ui/components/segmented"

import { CONFIDENCE_LABEL, countByKind, describeProposal, KIND_LABEL, targetItemOf, type ProposalKind } from "../lib/proposal-view"
import { applySelected, previewProposals, rejectSelected, revertApplied, type DecisionResult } from "../server/proposal-actions"
import type { ProposalBoardData, ProposalRow } from "../server/proposals"

type View = "open" | "decided"
type KindFilter = "all" | ProposalKind
type Outcome = { action: string; result: DecisionResult }

const SOURCE_LABEL = { kamis: "KAMIS", ekape: "축평원", chamga: "참가격" } as const
const KIND_ORDER: readonly ProposalKind[] = ["new_spec", "map", "new_variety", "product_item", "ignore", "hold", "merge"]

// 확신·상태 표시 색 (Oura 토큰)
const CONFIDENCE_TONE = { high: "bg-verdict-cheap-wash text-verdict-cheap-ink", medium: "bg-gold-wash text-espresso", low: "bg-verdict-pricey-wash text-verdict-pricey-ink" } as const
const STATUS_LABEL = { proposed: "대기", approved: "승인됨", applied: "적용됨", rejected: "반려" } as const

export function ProposalBoard(props: ProposalBoardData) {
  const [view, setView] = useState<View>("open")
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [pending, startTransition] = useTransition()
  const [busy, setBusy] = useState<string | null>(null)
  const [judgment, setJudgment] = useState(true)

  const run = (action: string, fn: () => Promise<DecisionResult>) => {
    setBusy(action)
    setOutcome(null)
    startTransition(async () => {
      const result = await fn()
      setOutcome({ action, result })
      setBusy(null)
    })
  }

  return (
    <section className="flex flex-col gap-6">
      <dl className="grid grid-cols-7 gap-3">
        <Stat label="검토 대기" value={props.open.length} />
        {KIND_ORDER.filter((k) => k !== "merge").map((k) => (
          <Stat key={k} label={KIND_LABEL[k]} value={countByKind(props.open)[k] ?? 0} small />
        ))}
      </dl>

      <div className="flex items-center gap-4">
        <Segmented<View>
          options={[
            { value: "open", label: `검토 대기 ${props.open.length}` },
            { value: "decided", label: `결정됨 ${props.decided.length}` },
          ]}
          value={view}
          onValueChange={setView}
        />
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" className="size-4 accent-espresso" checked={judgment} onChange={(e) => setJudgment(e.target.checked)} />
          적용·되돌리기 뒤 판정 묶음도 다시 내기
        </label>
        <p className="ml-auto text-sm text-stone">
          고치는 곳: <span className="font-semibold text-ink">{props.db}</span>
        </p>
      </div>

      {(busy || outcome) && <OutcomePanel busy={busy} outcome={outcome} />}

      {view === "open" ? (
        <OpenTable rows={props.open} names={props.names} disabled={pending} run={run} judgment={judgment} />
      ) : (
        <DecidedTable rows={props.decided} names={props.names} disabled={pending} run={run} judgment={judgment} />
      )}
    </section>
  )
}

function Stat({ label, value, small }: { label: string; value: number; small?: boolean }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-mat px-4 py-3">
      <dt className="text-sm text-stone">{label}</dt>
      <dd className={`font-number text-ink tabular-nums ${small ? "text-2xl" : "text-3xl"}`}>{value}</dd>
    </div>
  )
}

function OutcomePanel({ busy, outcome }: { busy: string | null; outcome: Outcome | null }) {
  if (busy) {
    return (
      <p role="status" className="rounded-xl bg-gold-wash px-4 py-3 text-sm text-espresso">
        {busy} 중이에요. 카탈로그를 고치고 가격을 다시 매핑하느라 수십 건이면 몇 분 걸려요. 창을 닫지 마세요.
      </p>
    )
  }
  if (!outcome) return null
  const { action, result } = outcome
  if (!result.ok) {
    return (
      <p role="alert" className="rounded-xl bg-verdict-pricey-wash px-4 py-3 text-sm whitespace-pre-wrap text-verdict-pricey-ink">
        {action}하지 못했어요: {result.error}
      </p>
    )
  }
  const m = result.mappings
  const j = result.judgment
  return (
    <div role="status" className="flex flex-col gap-1 rounded-xl bg-verdict-cheap-wash px-4 py-3 text-sm text-verdict-cheap-ink">
      <p className="font-semibold">
        {action} {result.dryRun ? "결과 (되돌렸어요, 아직 바뀐 것 없음)" : "완료"}
      </p>
      {m && (
        <p className="tabular-nums">
          카탈로그 변경 {result.changes ?? 0} · 규격에 이음 {m.mapped} · 제외 {m.ignored} · 남은 pending {m.pending} · 다시 매핑된 관측값 {m.remapped} · 일자 요약 {m.dailyQuote}
          {m.conflicts > 0 ? ` · 충돌 ${m.conflicts}(고치지 않음)` : ""}
        </p>
      )}
      {j && (
        <p className="tabular-nums">
          판정 묶음: {j.status === "ready" ? "공개" : "실패(지금 묶음 유지)"} · 행 {j.rows} (이전 {j.previousRows ?? "없음"}){j.note ? ` · ${j.note}` : ""}
        </p>
      )}
      {result.snapshot && <p>저장소 사본 {result.snapshot}을 다시 썼어요. 커밋해 주세요.</p>}
    </div>
  )
}

type TableProps = {
  rows: readonly ProposalRow[]
  names: ProposalBoardData["names"]
  disabled: boolean
  judgment: boolean
  run: (action: string, fn: () => Promise<DecisionResult>) => void
}

function OpenTable({ rows, names, disabled, judgment, run }: TableProps) {
  const [kind, setKind] = useState<KindFilter>("all")
  const [confidence, setConfidence] = useState("all")
  const [item, setItem] = useState("all")
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set())
  const q = query.trim()
  const visible = useMemo(
    () =>
      rows.filter(
        (r) =>
          (kind === "all" || r.kind === kind) &&
          (confidence === "all" || (r.confidence ?? "none") === confidence) &&
          (item === "all" || targetItemOf(r, names)?.slug === item) &&
          (q === "" || (r.label ?? "").includes(q) || r.key.includes(q) || describeProposal(r, names).includes(q)),
      ),
    [rows, kind, confidence, item, q, names],
  )
  // 제안이 가리키는 품목과 그 제안 수. 많은 것부터 (가공식품 품목 제안을 품목 하나씩 훑어볼 때)
  const itemOptions = useMemo(() => {
    const byItem = new Map<string, { label: string; count: number }>()
    for (const r of rows) {
      const t = targetItemOf(r, names)
      if (t) byItem.set(t.slug, { label: t.label, count: (byItem.get(t.slug)?.count ?? 0) + 1 })
    }
    return [...byItem].sort((a, b) => b[1].count - a[1].count || a[1].label.localeCompare(b[1].label, "ko"))
  }, [rows, names])
  const ids = [...selected].filter((id) => rows.some((r) => r.id === id)).sort((a, b) => a - b)
  const allVisible = visible.length > 0 && visible.every((r) => selected.has(r.id))
  const toggle = (id: number) => setSelected((s) => (s.has(id) ? new Set([...s].filter((x) => x !== id)) : new Set([...s, id])))
  const toggleVisible = () =>
    setSelected((s) => (allVisible ? new Set([...s].filter((id) => !visible.some((r) => r.id === id))) : new Set([...s, ...visible.map((r) => r.id)])))
  const kinds = KIND_ORDER.filter((k) => rows.some((r) => r.kind === k))
  const clearAfter = (fn: () => Promise<DecisionResult>) => async () => {
    const result = await fn()
    if (result.ok && !result.dryRun) setSelected(new Set())
    return result
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented<KindFilter>
          options={[{ value: "all", label: "전체" }, ...kinds.map((k) => ({ value: k, label: KIND_LABEL[k] }))]}
          value={kind}
          onValueChange={setKind}
        />
        <NativeSelect aria-label="확신" value={confidence} onChange={(e) => setConfidence(e.target.value)} className="w-36">
          <NativeSelectOption value="all">확신 전체</NativeSelectOption>
          <NativeSelectOption value="high">높음</NativeSelectOption>
          <NativeSelectOption value="medium">중간</NativeSelectOption>
          <NativeSelectOption value="low">낮음</NativeSelectOption>
        </NativeSelect>
        {itemOptions.length > 0 && (
          <NativeSelect aria-label="품목" value={item} onChange={(e) => setItem(e.target.value)} className="w-64">
            <NativeSelectOption value="all">품목 전체 ({itemOptions.length})</NativeSelectOption>
            {itemOptions.map(([slug, o]) => (
              <NativeSelectOption key={slug} value={slug}>
                {o.label} · {o.count}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        )}
        <Input aria-label="제안 검색" placeholder="원문 이름·원천 키·제안" value={query} onChange={(e) => setQuery(e.target.value)} className="w-56" />
        <p className="ml-auto text-sm text-stone tabular-nums">{visible.length}건</p>
      </div>

      <div className="sticky top-0 z-10 flex items-center gap-3 rounded-xl bg-canvas py-2">
        <p className="text-sm font-semibold text-ink tabular-nums">선택 {ids.length}건</p>
        <Button size="sm" variant="outline" disabled={disabled || ids.length === 0} onClick={() => run("미리보기", () => previewProposals(ids))}>
          미리보기
        </Button>
        <Button
          size="sm"
          disabled={disabled || ids.length === 0}
          onClick={() => {
            if (window.confirm(`제안 ${ids.length}건을 적용할까요? 카탈로그와 가격 매핑이 바뀌어요.`)) run("적용", clearAfter(() => applySelected(ids, { judgment })))
          }}
        >
          적용
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={disabled || ids.length === 0}
          onClick={() => {
            if (window.confirm(`제안 ${ids.length}건을 반려할까요?`)) run("반려", clearAfter(() => rejectSelected(ids)))
          }}
        >
          반려
        </Button>
      </div>

      <Table
        head={[
          <input key="all" type="checkbox" aria-label="보이는 제안 모두 고르기" className="size-4 accent-espresso" checked={allVisible} onChange={toggleVisible} />,
          "번호",
          "원천 키",
          "원문 이름",
          "종류",
          "제안",
          "근거",
          "확신",
          "마지막 관측",
        ]}
        empty="검토할 제안이 없어요."
        rows={visible.map((r) => ({
          key: r.id,
          cells: [
            <input key="c" type="checkbox" aria-label={`제안 ${r.id} 고르기`} className="size-4 accent-espresso" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />,
            <span key="i" className="text-sm text-stone tabular-nums">#{r.id}</span>,
            <SourceKey key="k" row={r} />,
            <span key="l" className="text-ink">{r.label ?? "—"}</span>,
            <span key="t" className="whitespace-nowrap">{KIND_LABEL[r.kind]}</span>,
            <span key="p" className="block min-w-56 font-semibold text-ink">{describeProposal(r, names)}</span>,
            <span key="r" className="block min-w-48 text-sm text-stone">{r.rationale}</span>,
            <Confidence key="f" value={r.confidence} />,
            <span key="s" className="text-sm whitespace-nowrap text-stone tabular-nums">
              {r.lastSeen ?? "—"}
              <br />
              관측값 {r.observations}
            </span>,
          ],
        }))}
      />
    </div>
  )
}

function DecidedTable({ rows, names, disabled, judgment, run }: TableProps) {
  return (
    <Table
      head={["번호", "원천 키", "원문 이름", "종류", "제안", "상태", "결정 시각", ""]}
      empty="아직 결정한 제안이 없어요."
      rows={rows.map((r) => ({
        key: r.id,
        cells: [
          <span key="i" className="text-sm text-stone tabular-nums">#{r.id}</span>,
          <SourceKey key="k" row={r} />,
          <span key="l" className="whitespace-nowrap text-ink">{r.label ?? "—"}</span>,
          <span key="t" className="whitespace-nowrap">{KIND_LABEL[r.kind]}</span>,
          <span key="p" className="text-ink">{describeProposal(r, names)}</span>,
          <span key="s" className="whitespace-nowrap">{STATUS_LABEL[r.status]}</span>,
          <span key="d" className="text-sm whitespace-nowrap text-stone tabular-nums">{r.decidedAt?.slice(0, 16) ?? "—"}</span>,
          r.status === "applied" ? (
            <Button
              key="b"
              size="sm"
              variant="outline"
              disabled={disabled}
              onClick={() => {
                if (window.confirm(`제안 #${r.id}을 되돌릴까요? 그 원천 키는 다시 pending이 돼요.`)) run("되돌리기", () => revertApplied(r.id, { judgment }))
              }}
            >
              되돌리기
            </Button>
          ) : (
            <span key="b" />
          ),
        ],
      }))}
    />
  )
}

function SourceKey({ row }: { row: ProposalRow }) {
  return (
    <span className="flex flex-col">
      <span className="text-xs text-stone">{SOURCE_LABEL[row.source]}</span>
      <code className="text-sm whitespace-nowrap text-ink">{row.key}</code>
    </span>
  )
}

function Confidence({ value }: { value: ProposalRow["confidence"] }) {
  if (!value) return <span className="text-stone">—</span>
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${CONFIDENCE_TONE[value]}`}>{CONFIDENCE_LABEL[value]}</span>
}

function Table({ head, rows, empty }: { head: readonly React.ReactNode[]; rows: readonly { key: number; cells: readonly React.ReactNode[] }[]; empty: string }) {
  if (rows.length === 0) return <p className="rounded-xl bg-mat px-4 py-6 text-center text-stone">{empty}</p>
  return (
    <div className="overflow-x-auto rounded-xl border border-hairline">
      <table className="w-full border-collapse text-left">
        <thead className="bg-mat text-sm text-stone">
          <tr>
            {head.map((h, i) => (
              <th key={i} scope="col" className="px-3 py-2 font-semibold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-t border-hairline align-top">
              {r.cells.map((c, i) => (
                <td key={i} className="px-3 py-2.5">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
