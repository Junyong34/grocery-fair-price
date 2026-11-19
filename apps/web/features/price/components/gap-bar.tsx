import { ArrowDown, ArrowUp, Equal } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

import type { GapAxis } from "@workspace/price/axis"
import { PRICE_COPY } from "@workspace/price/copy"

// "어디서 얼마에 팔까"의 차이 막대(상품 판매가 · 품종 시세 공통).
// 가운데 세로선이 기준값이고, 낮으면 왼쪽 · 높으면 오른쪽으로 막대가 뻗는다. 길이는 기준에서 가장 먼 곳을 끝으로 잡는다.
// 판매처 비교는 판정이 아니어서 판정 색을 쓰지 않는다. 방향은 막대 쪽과 화살표 · 낱말로 읽힌다.

const COPY = PRICE_COPY.gap

/** 목록 위 기준 줄: 기준 금액을 한 번 크게 쓴다. */
export function GapReference({ label, price }: { label: string; price: number }) {
  return (
    <p className="flex items-center gap-1.5 text-[13px] leading-relaxed text-stone">
      <span aria-hidden className="h-3.5 border-s-2 border-ink" />
      <span className="font-semibold text-ink tabular-nums">{COPY.reference(label, price)}</span>
    </p>
  )
}

/** 막대 칸 위 눈금 줄: 낮음 · 기준 · 높음. 막대와 같은 칸 폭에 둔다. */
export function GapAxisLabels({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("relative flex justify-between text-[11px] leading-none text-caption", className)}>
      <span>{COPY.lower}</span>
      <span className="absolute left-1/2 -translate-x-1/2 font-semibold text-stone">{COPY.axisCenter}</span>
      <span>{COPY.higher}</span>
    </span>
  )
}

/** 한 곳의 차이 막대. 읽는 값은 옆의 금액 · 차이 글이 맡아 막대는 aria-hidden이다. */
export function GapBar({ axis, value, className }: { axis: GapAxis; value: number; className?: string }) {
  const at = axis.at(value)
  const width = `${Math.abs(at) * 50}%`
  return (
    <span aria-hidden className={cn("relative block h-2 rounded-full bg-hairline", className)}>
      {at !== 0 && (
        <span
          className={cn("absolute inset-y-0 bg-stone", at < 0 ? "right-1/2 rounded-s-full" : "left-1/2 rounded-e-full")}
          style={{ width }}
        />
      )}
      <span className="absolute -inset-y-1 left-1/2 -translate-x-1/2 border-s-2 border-ink" />
    </span>
  )
}

const SIDE_ICON = { lower: ArrowDown, higher: ArrowUp, same: Equal } as const

/** 기준과의 차이 한 줄: ↓ 1,780원 낮음 · = 기준과 같음 · ↑ 1,500원 높음. */
export function GapDiff({ axis, value, reference, className }: { axis: GapAxis; value: number; reference: number; className?: string }) {
  const side = axis.side(value)
  const Icon = SIDE_ICON[side]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs leading-snug font-semibold whitespace-nowrap tabular-nums",
        side === "same" ? "text-caption" : "text-stone",
        className
      )}
    >
      <Icon aria-hidden size={12} strokeWidth={2.5} />
      {COPY.diff(value - reference)}
    </span>
  )
}
