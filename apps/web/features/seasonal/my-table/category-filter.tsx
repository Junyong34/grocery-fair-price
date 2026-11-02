"use client"

import { Check, ChevronDown, X } from "lucide-react"
import { overlay } from "overlay-kit"
import { useRef } from "react"

import { MY_TABLE_COPY } from "@workspace/seasonal/data/copy"
import type { FoodCategory } from "@workspace/seasonal/data/foods"
import { BottomSheet } from "@workspace/ui/components/bottom-sheet"
import { cn } from "@workspace/ui/lib/utils"

const CATEGORIES: readonly (FoodCategory | null)[] = [
  null,
  "채소",
  "수산",
  "과일",
  "곡물·견과",
  "버섯",
]

export function CategoryFilter({
  value,
  onChange,
}: {
  value: FoodCategory | null
  onChange: (category: FoodCategory | null) => void
}) {
  const triggerRef = useRef<HTMLButtonElement>(null)

  const open = () =>
    overlay.open(({ isOpen, close, unmount }) => (
      <BottomSheet
        open={isOpen}
        onClose={close}
        onExited={() => {
          unmount()
          triggerRef.current?.focus({ preventScroll: true })
        }}
        title={MY_TABLE_COPY.categoryTitle}
        description={MY_TABLE_COPY.categoryDescription}
        action={
          <button
            type="button"
            onClick={close}
            aria-label="닫기"
            className="flex size-11 items-center justify-center rounded-full text-stone hover:bg-hairline/50 focus-visible:outline-2 focus-visible:outline-gold"
          >
            <X size={18} aria-hidden />
          </button>
        }
      >
        <div
          className="grid gap-1"
          role="group"
          aria-label={MY_TABLE_COPY.categoryTitle}
        >
          {CATEGORIES.map((category) => (
            <button
              key={category ?? "all"}
              type="button"
              aria-pressed={value === category}
              onClick={() => {
                onChange(category)
                close()
              }}
              className={cn(
                "flex min-h-12 items-center justify-between rounded-lg px-4 text-left text-base hover:bg-hairline/50 focus-visible:outline-2 focus-visible:outline-gold",
                value === category
                  ? "bg-gold/15 font-medium text-gold-deep"
                  : "text-ink"
              )}
            >
              {category ?? MY_TABLE_COPY.allCategories}
              {value === category && <Check size={18} aria-hidden />}
            </button>
          ))}
        </div>
      </BottomSheet>
    ))

  return (
    <button
      ref={triggerRef}
      type="button"
      aria-haspopup="dialog"
      aria-label={`카테고리 선택: ${value ?? MY_TABLE_COPY.allCategories}`}
      onClick={open}
      className={cn(
        "flex h-11 shrink-0 items-center gap-2 rounded-full border px-3 text-[13px] whitespace-nowrap hover:bg-gold/10 focus-visible:outline-2 focus-visible:outline-gold",
        value === null
          ? "border-hairline bg-surface/40 text-stone"
          : "border-gold bg-gold/15 text-gold-deep"
      )}
    >
      {value ?? "카테고리"}
      <ChevronDown size={14} aria-hidden />
    </button>
  )
}
