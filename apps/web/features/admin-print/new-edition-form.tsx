"use client"

import { useActionState, useState } from "react"

import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Field, FieldControl, FieldDescription, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { ToggleGroup, ToggleGroupItem } from "@workspace/ui/components/toggle-group"

import { PRINT_KIND_LABELS, PRINT_KINDS, type PrintKind } from "@workspace/seasonal/print/spec"

import { createEdition } from "./actions"
import { KIND_DESCRIPTIONS } from "./fields"

/** 새 에디션 만들기. 종류와 이름만 고르면 id는 종류별 번호로 붙는다. */
export function NewEditionForm({ nextIds }: { nextIds: Record<PrintKind, string> }) {
  const [kind, setKind] = useState<PrintKind>("monthly")
  const [state, action, pending] = useActionState(createEdition, {})
  return (
    <Card>
      <CardHeader className="flex-col gap-1">
        <CardTitle className="font-heading text-xl font-bold">새 에디션</CardTitle>
        <CardDescription>종류를 고르고 이름을 붙이세요.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-5">
          <input type="hidden" name="kind" value={kind} />
          <ToggleGroup
            type="single"
            aria-label="종류"
            value={kind}
            onValueChange={(value) => value && setKind(value as PrintKind)}
            className="grid grid-cols-1 gap-2"
          >
            {PRINT_KINDS.map((option) => (
              <ToggleGroupItem key={option} value={option} className="!h-auto !w-full !flex-col !items-start !justify-start gap-1 !rounded-xl !px-4 !py-3 text-left !whitespace-normal">
                <span className="font-medium">{PRINT_KIND_LABELS[option]}</span>
                <span className="text-[13px] font-normal opacity-75">{KIND_DESCRIPTIONS[option]}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Field invalid={Boolean(state.error)}>
            <FieldLabel>이름</FieldLabel>
            <FieldControl>
              <Input name="title" required maxLength={40} placeholder="예: 2027 크림 달력" autoComplete="off" />
            </FieldControl>
            <FieldDescription>
              id는 자동으로 붙어요: <span className="font-medium text-ink tabular-nums">{nextIds[kind]}</span>
            </FieldDescription>
            {state.error && <FieldError>{state.error}</FieldError>}
          </Field>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "만드는 중…" : "만들기"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
