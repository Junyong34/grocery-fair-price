"use client"

import { Field, FieldControl, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Segmented } from "@workspace/ui/components/segmented"

import { EDITION_LIMITS, EDITION_STATUSES, type EditionStatus } from "@workspace/seasonal/print/edition"

import { EDITION_STATUS_LABELS } from "../constants"

const STATUS_OPTIONS = EDITION_STATUSES.map((status) => ({ value: status, label: EDITION_STATUS_LABELS[status] }))

type Props = {
  description: string
  status: EditionStatus
  /** 지금 상태로 저장할 수 없는 이유(PDF 없음, R2 쓰기 키 없음) */
  statusError: string | undefined
  onDescriptionChange: (description: string) => void
  onStatusChange: (status: EditionStatus) => void
}

export function ListingPanel({ description, status, statusError, onDescriptionChange, onStatusChange }: Props) {
  return (
    <section aria-labelledby="listing-title" className="flex flex-col gap-4">
      <h2 id="listing-title" className="font-heading text-lg font-bold text-ink">
        내려받기 화면
      </h2>
      <Field>
        <FieldLabel>설명</FieldLabel>
        <FieldControl>
          <Input value={description} maxLength={EDITION_LIMITS.description} placeholder="내려받기 화면에 한 줄로 보여요" onChange={(event) => onDescriptionChange(event.target.value)} />
        </FieldControl>
      </Field>
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <span className="flex max-w-[34ch] flex-col gap-0.5">
          <span className="text-ink">상태</span>
          <span className="text-[13px] text-stone">공개하려면 설명과 지금 옵션으로 만든 PDF가 있어야 해요. 공개하면 R2에 올려요. 내리면 옛 링크에 새 에디션을 안내해요</span>
        </span>
        <Segmented aria-label="상태" options={STATUS_OPTIONS} value={status} onValueChange={onStatusChange} className="shrink-0" />
      </div>
      <p role="status" className="text-[13px] text-error empty:hidden">
        {statusError}
      </p>
    </section>
  )
}
