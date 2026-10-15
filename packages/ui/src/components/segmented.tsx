"use client"

import * as React from "react"

import { TRAY_CLASS } from "@workspace/ui/components/link-tabs"
import { tabsVariants } from "@workspace/ui/components/tabs"
import { useFlowGroup } from "@workspace/ui/lib/cojeev-motion/use-flow"
import { cn } from "@workspace/ui/lib/utils"

export type SegmentedOption<T extends string | number> = {
  value: T
  label: React.ReactNode
}

/**
 * 하나를 고르는 세그먼트(라디오 묶음). cojeev 탭(lenses) 모양을 2차 탭과 같은 트레이(TRAY_CLASS)에 담았고, 선택 표시가 칸 사이를 미끄러진다.
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
        TRAY_CLASS,
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
          className="v-tab h-8! min-h-0! shrink-0 px-4! text-[13px]! aria-checked:font-semibold"
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
