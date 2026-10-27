"use client"

import { PenLine, PencilLine, X } from "lucide-react"
import { overlay } from "overlay-kit"
import { useState } from "react"
import { create } from "zustand"

import { BottomSheet } from "@workspace/ui/components/bottom-sheet"
import { cn } from "@workspace/ui/lib/utils"

import { PRICE_COPY, verdictChip, verdictDiff } from "@workspace/price/copy"
import { won } from "@workspace/price/format"
import type { VarietyDetail, Verdict } from "@workspace/price/types"
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

/**
 * 하단 고정 "내가 본 가격 적기". 하단 내비 위에 뜬 크림 버튼이고, 바텀 시트에서 가격을 적으면 같은 자리에 비교 카드가 뜬다.
 * 카드는 흰 바탕 · 판정 색 띠 · 꽉 찬 판정 칩으로 배경(크림)과 확실히 구분한다.
 */
export function MyPriceBar({ detail }: { detail: VarietyDetail }) {
  const mine = useMyPrice(detail.id)
  const ask = async () => {
    const price = await openMyPriceSheet(detail, mine)
    if (price != null) useMyPriceStore.setState({ id: detail.id, price })
  }
  const verdict = mine == null ? null : verdictOf(mine, detail.usual, detail.band)
  return (
    <div className="sticky bottom-[calc(max(14px,env(safe-area-inset-bottom))+70px)] z-10 flex justify-center lg:bottom-6">
      {verdict?.pct != null && mine != null && detail.usual != null ? (
        <MyPriceCard
          // 값을 바꿀 때마다 다시 떠오르게
          key={mine}
          price={mine}
          verdict={verdict}
          usual={detail.usual}
          unit={detail.baseUnit}
          onEdit={ask}
          onClear={() => useMyPriceStore.setState({ id: null, price: null })}
        />
      ) : (
        <button
          type="button"
          onClick={ask}
          // 크림 배경과 구분되게 브랜드 초록(forest)으로 채운다. 검정은 쓰지 않는다(2026-10-27 사용자 결정).
          className="flex h-11 w-full items-center gap-2.5 rounded-full bg-forest px-[18px] text-left text-canvas shadow-lg shadow-forest/30 transition-transform duration-150 ease-out active:scale-[0.98] motion-safe:animate-rise"
        >
          <PenLine aria-hidden size={18} strokeWidth={1.9} className="shrink-0" />
          <span className="flex-1 text-[15px] font-semibold">{COPY.myPrice}</span>
          <span className="shrink-0 text-[12.5px] text-canvas/75">{COPY.myPriceUnit(detail.baseUnit)}</span>
        </button>
      )}
    </div>
  )
}

/** 적은 가격의 판정 카드: 큰 가격 · 꽉 찬 판정 칩 · 평소가 대비, 다시 적기와 지우기. */
function MyPriceCard({
  price,
  verdict,
  usual,
  unit,
  onEdit,
  onClear,
}: {
  price: number
  verdict: Verdict
  usual: number
  unit: string
  onEdit: () => void
  onClear: () => void
}) {
  const tone = VERDICT_TONE[verdict.kind]
  return (
    <section
      aria-live="polite"
      aria-label={COPY.myPriceTitle}
      className="relative w-full overflow-hidden rounded-[22px] bg-surface shadow-xl shadow-ink/15 ring-1 ring-ink/8 motion-safe:animate-rise"
    >
      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1.5", tone.fill)} />
      <div className="flex items-center gap-3 py-3 pr-3 pl-5">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-xs font-medium text-caption">{COPY.myPriceLabel(unit)}</p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-number text-[24px] leading-none text-ink tabular-nums">{won(price)}원</span>
            <span className={cn("rounded-full px-2.5 py-1 text-[13px] leading-none font-bold tabular-nums", tone.solid)}>
              {verdictChip(verdict)}
            </span>
          </p>
          <p className={cn("text-xs font-semibold", tone.ink)}>{COPY.myPriceAgainstUsual(verdictDiff(verdict.pct ?? 0), won(usual))}</p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-forest px-3.5 text-[13px] font-semibold text-canvas transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          <PencilLine aria-hidden size={14} />
          {COPY.myPriceEdit}
        </button>
      </div>
      <button
        type="button"
        aria-label={COPY.myPriceClear}
        onClick={onClear}
        className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full text-mute hover:bg-canvas hover:text-ink"
      >
        <X aria-hidden size={14} />
      </button>
    </section>
  )
}

/** 바텀 시트로 "내가 본 가격"을 묻는다. 닫으면(×, 바깥, 아래로 끌기) null. */
function openMyPriceSheet(detail: VarietyDetail, initial: number | null): Promise<number | null> {
  return overlay.openAsync<number | null>(({ isOpen, close, unmount }) => (
    <BottomSheet
      open={isOpen}
      onClose={() => close(null)}
      onExited={unmount}
      title={
        <>
          {COPY.myPriceTitle} <small className="text-base font-normal text-caption">({detail.baseUnit})</small>
        </>
      }
      action={
        <button
          type="button"
          aria-label={COPY.myPriceClose}
          onClick={() => close(null)}
          className="-mr-2 grid size-10 place-items-center rounded-full text-stone hover:bg-surface hover:text-ink"
        >
          <X aria-hidden size={22} />
        </button>
      }
    >
      <MyPriceForm example={detail.price} initial={initial} onSubmit={close} />
    </BottomSheet>
  ))
}

/** 입력 줄: 회색 알약 입력칸 · 원 · 비교하기. 숫자만 받고 쉼표를 붙여 보여 준다. */
function MyPriceForm({
  example,
  initial,
  onSubmit,
}: {
  example: number
  initial: number | null
  onSubmit: (price: number) => void
}) {
  const [text, setText] = useState(initial == null ? "" : String(initial))
  const price = Number(text.replace(/[^\d]/g, "")) || null
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (price != null) onSubmit(price)
      }}
      className="flex flex-col gap-3 pt-1 pb-3"
    >
      <div className="flex items-center gap-2.5">
        <input
          inputMode="numeric"
          enterKeyHint="done"
          autoFocus
          aria-label={COPY.myPriceTitle}
          placeholder={COPY.myPricePlaceholder(won(example))}
          value={price == null ? "" : won(price)}
          onChange={(event) => setText(event.target.value)}
          className="h-[52px] min-w-0 flex-1 rounded-full border-[1.5px] border-stone/45 bg-hairline px-5 text-xl text-ink tabular-nums outline-none placeholder:text-caption focus:border-stone focus:bg-surface"
        />
        <span className="shrink-0 text-[15px] text-stone">{COPY.myPriceWon}</span>
        <button
          type="submit"
          disabled={price == null}
          className="h-[52px] shrink-0 rounded-full bg-stone px-6 text-[15px] font-semibold text-canvas transition-[transform,opacity] duration-150 ease-out active:scale-[0.97] disabled:opacity-40"
        >
          {COPY.myPriceApply}
        </button>
      </div>
      <p className="text-[13px] text-caption">{COPY.myPriceHint}</p>
    </form>
  )
}
