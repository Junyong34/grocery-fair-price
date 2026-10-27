"use client"

import { ShoppingBasket, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { cn } from "@workspace/ui/lib/utils"

import { basketView, type BasketItem } from "@workspace/price/basket"
import { LIST_BASIS, listBasisLine, PRICE_COPY, VERDICT_WORD } from "@workspace/price/copy"
import { latestSurveyedOn } from "@workspace/price/list"
import type { VarietySummary } from "@workspace/price/types"

import { routes } from "@/shared/routes"

import { PriceHint, ROW_COLUMNS, VarietyRow } from "../components/variety-row"
import { VerdictDot } from "../components/verdict-chip"
import { VERDICT_TONE } from "../components/verdict-tone"
import { useBasketHydrated, useBasketStore } from "../stores/basket-store"

const COPY = PRICE_COPY.basket

/**
 * P4 담은 품종. 판정별 개수 한 줄, 담은 뒤 판정이 바뀐 품종 알림, 판정별 묶음(싸요 → 보통 → 비싸요 → 판정 전, 안은 % 오름차순).
 * 담은 목록은 기기에 저장되어 있어 불러온 뒤에 그린다. "편집"을 누르면 행마다 × 빼기와 "모두 빼기"가 나온다.
 */
export function BasketView({ varieties }: { varieties: readonly VarietySummary[] }) {
  const hydrated = useBasketHydrated()
  const entries = useBasketStore((state) => state.entries)
  const [editingOn, setEditing] = useState(false)
  const view = basketView(varieties, entries)
  // 다 빼서 빈 목록이 되면 편집도 끝난다.
  const editing = editingOn && view.count > 0
  const surveyedOn = latestSurveyedOn(view.groups.flatMap((group) => group.items.map((item) => item.variety)))
  const remove = (id: string) => useBasketStore.getState().remove(id)

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-5 px-[18px] pt-4 lg:pt-10">
      <div className="flex items-center gap-2">
        <h1 className="font-heading text-[26px] leading-tight font-bold text-ink">{COPY.title}</h1>
        {view.count > 0 && <span className="font-number text-[22px] text-caption tabular-nums">{view.count}</span>}
        {view.count > 0 && (
          <button
            type="button"
            aria-pressed={editing}
            onClick={() => setEditing((on) => !on)}
            className="ml-auto h-9 rounded-full px-3 text-sm font-semibold text-stone hover:text-ink"
          >
            {editing ? COPY.done : COPY.edit}
          </button>
        )}
      </div>

      {!hydrated ? (
        <div className="min-h-60" aria-busy />
      ) : view.count === 0 ? (
        <EmptyBasket />
      ) : (
        <>
          <ul aria-label="판정별 개수" className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone">
            {view.tally.map(({ kind, count }) => (
              <li key={kind} className="inline-flex items-center gap-1.5">
                <VerdictDot verdict={{ kind, pct: null }} />
                {VERDICT_WORD[kind]}
                <b className="font-semibold text-ink tabular-nums">{count}</b>
              </li>
            ))}
          </ul>
          {view.changed.length > 0 && (
            <p role="status" className="rounded-2xl bg-gold-wash px-4 py-3 text-sm text-ink">
              {COPY.changed(view.changed.length, view.changed.map((item) => item.variety.name).join(", "))}
            </p>
          )}
          <div className="flex flex-col gap-1">
            <PriceHint />
            <div className={cn(ROW_COLUMNS, "mt-2 border-b border-hairline pb-1.5 text-xs font-semibold text-caption")}>
              <span>{COPY.columns[0]}</span>
              <span>{COPY.columns[1]}</span>
              <span className="justify-self-end">{COPY.columns[2]}</span>
              <span />
            </div>
            {view.groups.map((group) => (
              <section key={group.kind} aria-label={group.title}>
                <h2 className={cn("flex items-center gap-1.5 pt-4 pb-1 text-[13px] font-semibold", VERDICT_TONE[group.kind].ink)}>
                  <VerdictDot verdict={{ kind: group.kind, pct: null }} />
                  {group.title}
                  <small className="font-normal text-caption">{group.items.length}</small>
                </h2>
                <ul>
                  {group.items.map((item) => (
                    <VarietyRow
                      key={item.variety.id}
                      variety={item.variety}
                      // × 빼기는 편집 중에만 보인다. 열 자리는 남겨 다른 목록과 열 폭이 같다.
                      action={editing ? <RemoveButton name={item.variety.name} onClick={() => remove(item.variety.id)} /> : undefined}
                      footer={changedLine(item)}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
          {editing && (
            <button
              type="button"
              onClick={() => {
                useBasketStore.setState({ entries: [] })
                setEditing(false)
              }}
              className="h-11 rounded-full border border-silver text-sm font-semibold text-verdict-pricey-ink hover:border-stone"
            >
              {COPY.clearAll}
            </button>
          )}
          <Link
            href={routes.price.search}
            className="grid h-12 place-items-center rounded-full border border-dashed border-stone text-[15px] font-semibold text-ink no-underline hover:bg-surface"
          >
            {COPY.addMore}
          </Link>
          {surveyedOn && <p className="text-xs text-caption">{listBasisLine(LIST_BASIS, surveyedOn)}</p>}
        </>
      )}
    </div>
  )
}

/** 행 아래 "10/16에 담을 때 보통 → 지금 싸요". 판정이 그대로면 없다. */
function changedLine(item: BasketItem) {
  if (item.addedVerdict === item.variety.verdict.kind) return undefined
  return (
    <p className={cn("text-xs font-semibold", VERDICT_TONE[item.variety.verdict.kind].ink)}>
      {COPY.changedRow(item.addedOn, VERDICT_WORD[item.addedVerdict], VERDICT_WORD[item.variety.verdict.kind])}
    </p>
  )
}

function RemoveButton({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={PRICE_COPY.row.remove(name)}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-full text-stone hover:bg-surface hover:text-ink"
    >
      <X aria-hidden size={18} />
    </button>
  )
}

function EmptyBasket() {
  return (
    <div className="flex flex-col items-center gap-3 pt-14 text-center">
      <span aria-hidden className="grid size-16 place-items-center rounded-full bg-gold-wash text-gold-deep">
        <ShoppingBasket size={26} />
      </span>
      <p className="text-base font-semibold text-ink">{COPY.emptyTitle}</p>
      <p className="text-sm text-caption">{COPY.emptyBody}</p>
      <Link
        href={routes.price.search}
        className="mt-3 inline-flex h-11 items-center rounded-full bg-ink px-5 text-[15px] font-semibold text-canvas no-underline"
      >
        {COPY.emptyAction}
      </Link>
    </div>
  )
}
