"use client"

import { useActionState, useState } from "react"

import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Field, FieldControl, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

import { EDITION_LIMITS } from "@workspace/seasonal/print/edition"
import { PRINT_KIND_LABELS, type PrintKind } from "@workspace/seasonal/print/spec"

import { createEdition } from "../server/actions"
import type { FormState } from "../types"
import { FormStep } from "./form-step"
import { KindPicker } from "./kind-picker"

const INITIAL_STATE: FormState = {}

/** 새 에디션 만들기. 종류 → 이름 → 확인 순서로 고르고, id는 종류별 번호로 붙는다. */
export function NewEditionForm({ nextIds }: { nextIds: Record<PrintKind, string> }) {
  const [kind, setKind] = useState<PrintKind>("monthly")
  const [title, setTitle] = useState("")
  const [state, action, pending] = useActionState(createEdition, INITIAL_STATE)
  const name = title.trim()
  return (
    <Card className="flex flex-col gap-6">
      <h2 className="font-heading text-xl font-bold text-ink">새 에디션</h2>
      <form action={action}>
        <input type="hidden" name="kind" value={kind} />
        <ol className="flex flex-col gap-7">
          <FormStep order={1} title="종류 고르기" id="step-kind">
            <KindPicker value={kind} onChange={setKind} labelledBy="step-kind" />
          </FormStep>

          <FormStep order={2} title="이름 붙이기" id="step-name">
            <Field invalid={Boolean(state.error)}>
              <FieldLabel className="sr-only">이름</FieldLabel>
              <FieldControl>
                <Input name="title" required maxLength={EDITION_LIMITS.title} placeholder="예: 2027 크림 달력" autoComplete="off" value={title} onChange={(event) => setTitle(event.target.value)} />
              </FieldControl>
              {state.error && <FieldError>{state.error}</FieldError>}
            </Field>
          </FormStep>

          <FormStep order={3} title="확인하고 만들기" id="step-create">
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 rounded-2xl bg-hairline/50 px-4 py-3 text-sm">
              <dt className="text-caption">종류</dt>
              <dd className="font-medium text-ink">{PRINT_KIND_LABELS[kind]}</dd>
              <dt className="text-caption">이름</dt>
              <dd className={name ? "truncate font-medium text-ink" : "text-caption"}>{name || "아직 없어요"}</dd>
              <dt className="text-caption">id</dt>
              <dd className="font-medium text-ink tabular-nums">{nextIds[kind]}</dd>
            </dl>
            <Button type="submit" disabled={pending || !name} className="w-full">
              {pending ? "만드는 중…" : "만들기"}
            </Button>
          </FormStep>
        </ol>
      </form>
    </Card>
  )
}
