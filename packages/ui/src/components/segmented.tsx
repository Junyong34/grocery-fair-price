"use client"

import * as React from "react"

import { tabsVariants } from "@workspace/ui/components/tabs"
import { useFlowGroup } from "@workspace/ui/lib/cojeev-motion/use-flow"
import { cn } from "@workspace/ui/lib/utils"

export type SegmentedOption<T extends string | number> = {
  value: T
  label: React.ReactNode
}

/**
 * 하나를 고르는 세그먼트(라디오 묶음). cojeev 탭(lenses) 모양을 베이지 트레이에 담았고, 선택 렌즈가 칸 사이를 미끄러진다.
 * 화살표 키로 옆 칸을 고른다.
 */
export function Segmented<T extends string | number>({
  options,
  value,
  onValueChange,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "onChange"> & {
  options: readonly SegmentedOption<T>[]
  value: T
  onValueChange: (value: T) => void
}) {
  const flowRef = useFlowGroup<HTMLDivElement>(undefined, {
    kind: "pill",
    itemSelector: '[data-slot="tabs-trigger"]',
    activeSelector: '[aria-checked="true"]',
  })
  const index = options.findIndex((option) => option.value === value)

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
    if (!step) return
    event.preventDefault()
    const next = (index + step + options.length) % options.length
    onValueChange(options[next]!.value)
    event.currentTarget.querySelectorAll<HTMLButtonElement>("[role=radio]")[next]?.focus()
  }

  return (
    <div
      {...props}
      ref={flowRef}
      role="radiogroup"
      data-slot="tabs-list"
      data-flow-group=""
      onKeyDown={onKeyDown}
      className={cn(
        tabsVariants({ variant: "lenses" }),
        "gap-0! rounded-full border border-silver/50 bg-hairline/60 p-0.5 [--glide-bg:var(--color-canvas)]",
        // 움직임 레이어가 붙기 전(첫 그림)과 모션을 끈 때에도 선택 칸이 보이게 한다.
        "[&:not(.v-glide)>[aria-checked=true]]:bg-canvas",
        className
      )}
    >
      {options.map((option, i) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={i === index}
          tabIndex={i === index ? 0 : -1}
          data-slot="tabs-trigger"
          onClick={() => onValueChange(option.value)}
          className="v-tab h-8! min-h-0! shrink-0 px-3.5! text-[13px]! aria-checked:font-semibold"
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
