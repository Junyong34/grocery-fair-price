"use client"

import { useActionState, useState } from "react"

import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Field, FieldControl, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { NativeSelect, NativeSelectOption } from "@workspace/ui/components/native-select"

import { EDITION_LIMITS } from "@workspace/seasonal/print/edition"
import { PRINT_KIND_LABELS, type PrintKind } from "@workspace/seasonal/print/spec"

import { kindHasYear, printYearChoices } from "../lib/year-range"
import { createEdition } from "../server/actions"
import type { FormState } from "../types"
import { FormStep } from "./form-step"
import { KindPicker } from "./kind-picker"

const INITIAL_STATE: FormState = {}

/** currentYear는 서버가 정한 서울 기준 올해다. 연도 선택지와 기본값이 이것을 따른다. */
export function CreateEditionForm({ nextIds, currentYear }: { nextIds: Record<PrintKind, string>; currentYear: number }) {
  const [kind, setKind] = useState<PrintKind>("monthly")
  const [year, setYear] = useState(currentYear)
  const [title, setTitle] = useState("")
  const [state, action, pending] = useActionState(createEdition, INITIAL_STATE)
  const name = title.trim()
  // 연도는 달력 종류(월간·연간)에만 있다. 없는 종류는 단계째 빼고 번호를 당긴다.
  const hasYear = kindHasYear(kind)
  const step = { year: 2, name: hasYear ? 3 : 2, create: hasYear ? 4 : 3 }
  return (
    <Card className="flex flex-col gap-6">
      <h2 className="font-heading text-xl font-bold text-ink">새 에디션</h2>
      <form action={action}>
        <input type="hidden" name="kind" value={kind} />
        <ol className="flex flex-col gap-7">
          <FormStep order={1} title="종류 고르기" id="step-kind">
            <KindPicker value={kind} onChange={setKind} labelledBy="step-kind" />
          </FormStep>

          {hasYear && (
            <FormStep order={step.year} title="연도 고르기" id="step-year">
              <Field>
                <FieldLabel className="sr-only">연도</FieldLabel>
                <FieldControl>
                  <NativeSelect name="year" value={String(year)} onChange={(event) => setYear(Number(event.target.value))}>
                    {printYearChoices(currentYear).map((choice) => (
                      <NativeSelectOption key={choice} value={String(choice)}>
                        {choice}년
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </FieldControl>
              </Field>
            </FormStep>
          )}

          <FormStep order={step.name} title="이름 붙이기" id="step-name">
            <Field>
              <FieldLabel className="sr-only">이름</FieldLabel>
              <FieldControl>
                <Input name="title" required maxLength={EDITION_LIMITS.title} placeholder={`예: ${year} 크림 달력`} autoComplete="off" value={title} onChange={(event) => setTitle(event.target.value)} />
              </FieldControl>
            </Field>
          </FormStep>

          <FormStep order={step.create} title="확인하고 만들기" id="step-create">
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 rounded-2xl bg-hairline/50 px-4 py-3 text-sm">
              <dt className="text-caption">종류</dt>
              <dd className="font-medium text-ink">{PRINT_KIND_LABELS[kind]}</dd>
              {hasYear && (
                <>
                  <dt className="text-caption">연도</dt>
                  <dd className="font-medium text-ink tabular-nums">{year}년</dd>
                </>
              )}
              <dt className="text-caption">이름</dt>
              <dd className={name ? "truncate font-medium text-ink" : "text-caption"}>{name || "아직 없어요"}</dd>
              <dt className="text-caption">id</dt>
              <dd className="font-medium text-ink tabular-nums">{nextIds[kind]}</dd>
            </dl>
            {/* 오류는 이름·연도 어느 쪽에서도 올 수 있어 만들기 버튼 바로 위에 보인다. */}
            <p role="alert" className="text-sm text-error empty:hidden">
              {state.error}
            </p>
            <Button type="submit" disabled={pending || !name} className="w-full">
              {pending ? "만드는 중…" : "만들기"}
            </Button>
          </FormStep>
        </ol>
      </form>
    </Card>
  )
}
