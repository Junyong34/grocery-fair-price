"use client"

import { Check, Copy } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

import { useCopy } from "../hooks/use-copy"

/** id 꼬리표. 누르면 id를 복사한다(폴더·주소에 쓰는 값이라). */
export function EditionId({ id, className }: { id: string; className?: string }) {
  const { copied, copy } = useCopy()
  return (
    <button
      type="button"
      onClick={() => copy("id", id)}
      aria-label={`id ${id} 복사`}
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-md bg-canvas px-2 text-[13px] text-stone ring-1 ring-hairline ring-inset transition-colors hover:text-ink hover:ring-silver",
        className,
      )}
    >
      <span className="text-[11px] font-semibold tracking-wide text-caption">ID</span>
      <span className="font-medium tabular-nums">{id}</span>
      {copied ? <Check aria-hidden size={12} strokeWidth={2.4} className="text-olive" /> : <Copy aria-hidden size={12} strokeWidth={2} className="text-caption" />}
      <span aria-live="polite" className="sr-only">
        {copied ? "복사했어요" : ""}
      </span>
    </button>
  )
}
