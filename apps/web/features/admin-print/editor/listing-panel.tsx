"use client"

import { Field, FieldControl, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Switch } from "@workspace/ui/components/switch"

import { EDITION_LIMITS, type EditionStatus } from "@workspace/seasonal/print/edition"

type Props = {
  description: string
  status: EditionStatus
  onDescriptionChange: (description: string) => void
  onStatusChange: (status: EditionStatus) => void
}

/** 사용자 내려받기 화면에 보일 것: 한 줄 설명과 공개 여부 */
export function ListingPanel({ description, status, onDescriptionChange, onStatusChange }: Props) {
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
      <label className="flex items-center justify-between gap-4 text-sm">
        <span className="flex flex-col gap-0.5">
          <span className="text-ink">사용자에게 공개</span>
          <span className="text-[13px] text-stone">PDF 저장 위치를 정하기 전에는 끄세요</span>
        </span>
        <Switch checked={status === "published"} onCheckedChange={(on) => onStatusChange(on ? "published" : "draft")} />
      </label>
    </section>
  )
}
