"use client"

import { X } from "lucide-react"
import { useState } from "react"
import { create } from "zustand"

import { InputAffix, InputControl, InputWrapper } from "@workspace/ui/components/input"
import { openBottomSheet } from "@workspace/ui/components/bottom-sheet"
import { cn } from "@workspace/ui/lib/utils"

import { PRICE_COPY, verdictChip } from "@workspace/price/copy"
import { won } from "@workspace/price/format"
import type { VarietyDetail } from "@workspace/price/types"
import { verdictOf } from "@workspace/price/verdict"

import { VERDICT_TONE } from "../components/verdict-tone"

const COPY = PRICE_COPY.detail

// "내가 본 가격": 매장에서 본 가격을 적으면 화면에서만 판정한다. 저장하지 않는다(domain-model 2026-10-19 결정).
// 범위 막대의 "내가 본" 핀과 하단 바가 같은 값을 본다. 품종을 바꾸면 그 품종 값만 보이게 품종 id와 함께 둔다.
const useMyPriceStore = create<{ id: string | null; price: number | null }>(() => ({ id: null, price: null }))

/** 이 품종에 적은 "내가 본 가격". 없으면 null. */
export function useMyPrice(id: string): number | null {
  return useMyPriceStore((state) => (state.id === id ? state.price : null))
}

/** 하단 고정 "내가 본 가격 적기". 적은 뒤에는 그 가격의 판정을 보여 준다. */
export function MyPriceBar({ detail }: { detail: VarietyDetail }) {
  const mine = useMyPrice(detail.id)
  const ask = async () => {
    const price = await openBottomSheet<number>(
      { title: COPY.myPriceTitle, description: COPY.myPriceHint(detail.baseUnit) },
      (choose) => <MyPriceForm detail={detail} initial={mine} onSubmit={choose} />
    )
    if (price != null) useMyPriceStore.setState({ id: detail.id, price })
  }
  const verdict = mine == null ? null : verdictOf(mine, detail.usual, detail.band)
  return (
    <div className="sticky bottom-[calc(max(14px,env(safe-area-inset-bottom))+66px)] z-10 lg:bottom-6">
      <div className="flex items-center gap-2 rounded-full border border-silver/60 bg-canvas/95 p-1.5 shadow-lg shadow-ink/10 backdrop-blur-md">
        {verdict && mine != null ? (
          <>
            <p className="flex min-w-0 flex-1 items-center gap-2 pl-3 text-sm text-ink">
              <span className="truncate">{COPY.myPriceVerdict(won(mine))}</span>
              <b className={cn("shrink-0 font-semibold", VERDICT_TONE[verdict.kind].ink)}>{verdictChip(verdict)}</b>
            </p>
            <button
              type="button"
              aria-label={COPY.myPriceClear}
              onClick={() => useMyPriceStore.setState({ id: null, price: null })}
              className="grid size-10 shrink-0 place-items-center rounded-full text-stone hover:text-ink"
            >
              <X aria-hidden size={18} />
            </button>
            <button type="button" onClick={ask} className="h-10 shrink-0 rounded-full bg-ink px-4 text-sm font-semibold text-canvas">
              {COPY.myPriceEdit}
            </button>
          </>
        ) : (
          <button type="button" onClick={ask} className="h-11 flex-1 rounded-full bg-ink text-[15px] font-semibold text-canvas">
            {COPY.myPrice}
          </button>
        )}
      </div>
    </div>
  )
}

function MyPriceForm({
  detail,
  initial,
  onSubmit,
}: {
  detail: VarietyDetail
  initial: number | null
  onSubmit: (price: number) => void
}) {
  const [text, setText] = useState(initial == null ? "" : String(initial))
  const price = Number(text.replace(/[^\d]/g, "")) || null
  const verdict = price == null ? null : verdictOf(price, detail.usual, detail.band)
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (price != null) onSubmit(price)
      }}
      className="flex flex-col gap-3 pb-2"
    >
      <InputWrapper as="label" variant="cream">
        <InputControl
          inputMode="numeric"
          autoFocus
          aria-label={COPY.myPriceTitle}
          placeholder={won(detail.price)}
          value={price == null ? "" : won(price)}
          onChange={(event) => setText(event.target.value)}
          className="text-lg tabular-nums"
        />
        <InputAffix>원 · {detail.baseUnit}</InputAffix>
      </InputWrapper>
      <p className={cn("min-h-5 text-sm font-semibold", verdict ? VERDICT_TONE[verdict.kind].ink : "text-caption")}>
        {verdict && price != null ? `${COPY.myPriceVerdict(won(price))} ${verdictChip(verdict)}` : " "}
      </p>
      <button
        type="submit"
        disabled={price == null}
        className="h-12 rounded-full bg-ink text-[15px] font-semibold text-canvas disabled:opacity-40"
      >
        {COPY.myPriceApply}
      </button>
    </form>
  )
}
