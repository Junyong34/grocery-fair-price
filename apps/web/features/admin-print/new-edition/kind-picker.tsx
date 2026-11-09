"use client"

import { Table2 } from "lucide-react"

import {
  RadioGroup,
  RadioGroupBody,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"

import { PRINT_KIND_LABELS, PRINT_KINDS } from "@workspace/seasonal/print/spec"

import { KindMark } from "../components/kind-mark"
import { KIND_DESCRIPTIONS, KIND_LOOKS } from "../constants"

// 궁합표는 정해진 A4 문서라 달력 에디션의 저장 사양과 구분한다.
export const PAIRING_PRINT_KIND = "baby-food-pairings"
const KINDS = [...PRINT_KINDS, PAIRING_PRINT_KIND] as const
export type CreatePrintKind = (typeof KINDS)[number]

export function KindPicker({
  value,
  onChange,
  labelledBy,
}: {
  value: CreatePrintKind
  onChange: (kind: CreatePrintKind) => void
  labelledBy: string
}) {
  return (
    <RadioGroup
      aria-labelledby={labelledBy}
      appearance="card"
      size="sm"
      value={value}
      onValueChange={(next) => {
        const kind = KINDS.find((item) => item === next)
        if (kind) onChange(kind)
      }}
      className="gap-2"
    >
      {KINDS.map((kind) => {
        const pairing = kind === PAIRING_PRINT_KIND
        return (
          <RadioGroupItem
            key={kind}
            value={kind}
            shape={pairing ? "rounded" : KIND_LOOKS[kind].selector}
            tone={pairing ? "olive" : KIND_LOOKS[kind].tone}
            className="!grid-cols-[20px_minmax(0,1fr)_auto] !items-center !gap-3 !p-3 !pr-4"
          >
            <RadioGroupBody className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[15px] font-semibold text-ink">
                {pairing ? "이유식 재료 궁합표" : PRINT_KIND_LABELS[kind]}
              </span>
              <span className="text-[13px] leading-snug text-stone">
                {pairing
                  ? "그림과 이름으로 보는 재료별 O·X 목록. A4 세로 3장"
                  : KIND_DESCRIPTIONS[kind]}
              </span>
            </RadioGroupBody>
            {pairing ? (
              <Table2 aria-hidden="true" className="size-9 p-1 text-olive" />
            ) : (
              <KindMark kind={kind} className="size-9" />
            )}
          </RadioGroupItem>
        )
      })}
    </RadioGroup>
  )
}
