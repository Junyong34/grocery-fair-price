"use client"

import { useActionState, useState } from "react"

import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Field, FieldControl, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { RadioGroup, RadioGroupBody, RadioGroupItem } from "@workspace/ui/components/radio-group"

import { PRINT_KIND_LABELS, PRINT_KINDS, type PrintKind } from "@workspace/seasonal/print/spec"

import { createEdition } from "./actions"
import { KIND_DESCRIPTIONS } from "./fields"
import { KIND_LOOKS } from "./kind-look"
import { KindMark } from "./kind-mark"

/** 새 에디션 만들기. 종류 → 이름 → 만들기 순서로 고르고, id는 종류별 번호로 붙는다. */
export function NewEditionForm({ nextIds }: { nextIds: Record<PrintKind, string> }) {
  const [kind, setKind] = useState<PrintKind>("monthly")
  const [title, setTitle] = useState("")
  const [state, action, pending] = useActionState(createEdition, {})
  return (
    <Card className="flex flex-col gap-6">
      <h2 className="font-heading text-xl font-bold text-ink">새 에디션</h2>
      <form action={action}>
        <input type="hidden" name="kind" value={kind} />
        <ol className="flex flex-col gap-7">
          <Step order={1} title="종류 고르기" id="step-kind">
            <RadioGroup aria-labelledby="step-kind" appearance="card" size="sm" value={kind} onValueChange={(value) => setKind(value as PrintKind)} className="gap-2">
              {PRINT_KINDS.map((option) => (
                <RadioGroupItem key={option} value={option} shape={KIND_LOOKS[option].selector} tone={KIND_LOOKS[option].tone} className="!grid-cols-[20px_minmax(0,1fr)_auto] !items-center !gap-3 !p-3 !pr-4">
                  <RadioGroupBody className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[15px] font-semibold text-ink">{PRINT_KIND_LABELS[option]}</span>
                    <span className="text-[13px] leading-snug text-stone">{KIND_DESCRIPTIONS[option]}</span>
                  </RadioGroupBody>
                  <KindMark kind={option} className="size-9" />
                </RadioGroupItem>
              ))}
            </RadioGroup>
          </Step>

          <Step order={2} title="이름 붙이기" id="step-name">
            <Field invalid={Boolean(state.error)}>
              <FieldLabel className="sr-only">이름</FieldLabel>
              <FieldControl>
                <Input name="title" required maxLength={40} placeholder="예: 2027 크림 달력" autoComplete="off" value={title} onChange={(event) => setTitle(event.target.value)} />
              </FieldControl>
              {state.error && <FieldError>{state.error}</FieldError>}
            </Field>
          </Step>

          <Step order={3} title="확인하고 만들기" id="step-create">
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 rounded-2xl bg-hairline/50 px-4 py-3 text-sm">
              <dt className="text-caption">종류</dt>
              <dd className="font-medium text-ink">{PRINT_KIND_LABELS[kind]}</dd>
              <dt className="text-caption">이름</dt>
              <dd className={title.trim() ? "truncate font-medium text-ink" : "text-caption"}>{title.trim() || "아직 없어요"}</dd>
              <dt className="text-caption">id</dt>
              <dd className="font-medium text-ink tabular-nums">{nextIds[kind]}</dd>
            </dl>
            <Button type="submit" disabled={pending || !title.trim()} className="w-full">
              {pending ? "만드는 중…" : "만들기"}
            </Button>
          </Step>
        </ol>
      </form>
    </Card>
  )
}

/** 순서가 있는 단계 하나. 번호는 원 안에, 제목은 그 옆에 둔다. */
function Step({ order, title, id, children }: { order: number; title: string; id: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-3">
      <h3 id={id} className="flex items-center gap-2.5 text-base font-semibold text-ink">
        <span aria-hidden="true" className="grid size-6 place-items-center rounded-full bg-stone text-[13px] font-semibold text-canvas tabular-nums">
          {order}
        </span>
        {title}
      </h3>
      {children}
    </li>
  )
}
