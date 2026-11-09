"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import { Input } from "@workspace/ui/components/input"
import { NativeSelect, NativeSelectOption } from "@workspace/ui/components/native-select"
import { Segmented } from "@workspace/ui/components/segmented"

import { monthDay, won } from "@workspace/price/format"

import { routes } from "@/shared/routes"

import { PAGE_STATE_LABEL, pageStateOf, type PageState, type ProductRow } from "../lib/product-view"
import type { ProductCatalog } from "../server/products"

type StateFilter = "all" | PageState | "no-item"

// 화면 상태마다 표의 표시 색 (Oura 토큰)
const STATE_TONE: Record<PageState, string> = {
  shown: "bg-verdict-cheap-wash text-verdict-cheap-ink",
  stale: "bg-gold-wash text-espresso",
  "no-page": "bg-verdict-pricey-wash text-verdict-pricey-ink",
  discontinued: "bg-mat text-stone",
}

/**
 * 상품 목록 어드민 (catalog-scale/10의 읽기 화면). 참가격 상품이 어느 카테고리 · 품목에 들어가 상품 화면에 어떻게 나오는지 본다.
 * 고치지 않는다. 품목이 틀리면 상품의 품목 제안(catalog propose → 제안 검토)으로 고친다.
 */
export function ProductBoard({ rows, summary, categories }: ProductCatalog) {
  const [category, setCategory] = useState("all")
  const [item, setItem] = useState("all")
  const [state, setState] = useState<StateFilter>("all")
  const [query, setQuery] = useState("")
  const q = query.trim()

  const inCategory = useMemo(() => rows.filter((r) => category === "all" || r.category === category), [rows, category])
  // 고른 카테고리 안의 품목과 상품 수 (품목을 너무 잘게 · 크게 나눴는지 보기)
  const items = useMemo(() => {
    const n = new Map<string, number>()
    for (const r of inCategory) n.set(r.item, (n.get(r.item) ?? 0) + 1)
    return [...n]
  }, [inCategory])
  const visible = inCategory.filter(
    (r) =>
      (item === "all" || r.item === item) &&
      (state === "all" || (state === "no-item" ? !r.itemSet : pageStateOf(r) === state)) &&
      (q === "" || r.name.includes(q) || r.goodId === q || r.item.includes(q)),
  )

  return (
    <section className="flex flex-col gap-6">
      <dl className="grid grid-cols-6 gap-3">
        <Stat label="참가격 상품" value={summary.total} />
        <Stat label={PAGE_STATE_LABEL.shown} value={summary.shown} />
        <Stat label={PAGE_STATE_LABEL.stale} value={summary.stale} />
        <Stat label={PAGE_STATE_LABEL["no-page"]} value={summary.noPage} />
        <Stat label={PAGE_STATE_LABEL.discontinued} value={summary.discontinued} />
        <Stat label="품목 미정" value={summary.noItem} />
      </dl>

      <div className="flex flex-wrap items-center gap-3">
        <NativeSelect
          aria-label="카테고리"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value)
            setItem("all")
          }}
          className="w-44"
        >
          <NativeSelectOption value="all">카테고리 전체</NativeSelectOption>
          {categories.map((c) => (
            <NativeSelectOption key={c} value={c}>
              {c}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect aria-label="품목" value={item} onChange={(e) => setItem(e.target.value)} className="w-52">
          <NativeSelectOption value="all">품목 전체 ({items.length})</NativeSelectOption>
          {items.map(([name, n]) => (
            <NativeSelectOption key={name} value={name}>
              {name} · {n}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Segmented<StateFilter>
          options={[
            { value: "all", label: "전체" },
            { value: "shown", label: "노출" },
            { value: "stale", label: "오래됨" },
            { value: "no-page", label: "페이지 없음" },
            { value: "discontinued", label: "조사 중단" },
            { value: "no-item", label: "품목 미정" },
          ]}
          value={state}
          onValueChange={setState}
        />
        <Input aria-label="상품 검색" placeholder="이름·상품 번호·품목" value={query} onChange={(e) => setQuery(e.target.value)} className="w-56" />
        <p className="ml-auto text-sm text-stone tabular-nums">{visible.length}개</p>
      </div>

      <Table rows={visible} />
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

const HEAD = ["카테고리", "품목", "상품", "상품 번호", "품종 연결", "화면 상태", "판매가", "기준 단위당", "조사일"] as const

function Table({ rows }: { rows: readonly ProductRow[] }) {
  if (rows.length === 0) return <p className="rounded-xl bg-mat px-4 py-6 text-center text-stone">조건에 맞는 상품이 없어요.</p>
  return (
    <div className="overflow-x-auto rounded-2xl bg-surface shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="sticky top-0 bg-surface">
          <tr className="border-b border-mat">
            {HEAD.map((h) => (
              <th key={h} scope="col" className="px-4 py-3 text-xs font-semibold whitespace-nowrap text-stone">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const s = pageStateOf(r)
            return (
              <tr key={r.goodId} className="border-b border-mat align-top last:border-0">
                <td className="px-4 py-3 whitespace-nowrap text-stone">{r.category}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {r.item}
                  {!r.itemSet && <span className="ml-1.5 text-xs text-stone">(소분류)</span>}
                </td>
                <td className="px-4 py-3 font-semibold text-ink">
                  {r.page ? (
                    <Link href={routes.price.product(r.goodId)} target="_blank" className="underline-offset-2 hover:underline">
                      {r.name}
                    </Link>
                  ) : (
                    r.name
                  )}
                </td>
                <td className="px-4 py-3 text-stone tabular-nums">{r.goodId}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {r.link.kind === "mapped" ? (
                    <Link href={routes.price.variety(r.link.variety)} target="_blank" className="underline-offset-2 hover:underline">
                      {r.link.varietyName}
                    </Link>
                  ) : (
                    <span className="text-stone">{r.link.kind === "ignored" ? "잇지 않음" : "pending"}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${STATE_TONE[s]}`}>{PAGE_STATE_LABEL[s]}</span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">{r.page ? `${won(r.page.price)}원` : "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap text-stone tabular-nums">{r.page?.perUnit ?? "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap text-stone tabular-nums">{r.page ? monthDay(r.page.surveyedOn) : "—"}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
