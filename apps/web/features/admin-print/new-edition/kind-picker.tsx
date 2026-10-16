"use client"

import { RadioGroup, RadioGroupBody, RadioGroupItem } from "@workspace/ui/components/radio-group"

import { PRINT_KIND_LABELS, PRINT_KINDS, type PrintKind } from "@workspace/seasonal/print/spec"

import { KindMark } from "../components/kind-mark"
import { KIND_DESCRIPTIONS, KIND_LOOKS } from "../constants"

export function KindPicker({ value, onChange, labelledBy }: { value: PrintKind; onChange: (kind: PrintKind) => void; labelledBy: string }) {
  return (
    <RadioGroup aria-labelledby={labelledBy} appearance="card" size="sm" value={value} onValueChange={(next) => onChange(next as PrintKind)} className="gap-2">
      {PRINT_KINDS.map((kind) => (
        <RadioGroupItem key={kind} value={kind} shape={KIND_LOOKS[kind].selector} tone={KIND_LOOKS[kind].tone} className="!grid-cols-[20px_minmax(0,1fr)_auto] !items-center !gap-3 !p-3 !pr-4">
          <RadioGroupBody className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[15px] font-semibold text-ink">{PRINT_KIND_LABELS[kind]}</span>
            <span className="text-[13px] leading-snug text-stone">{KIND_DESCRIPTIONS[kind]}</span>
          </RadioGroupBody>
          <KindMark kind={kind} className="size-9" />
        </RadioGroupItem>
      ))}
    </RadioGroup>
  )
}
