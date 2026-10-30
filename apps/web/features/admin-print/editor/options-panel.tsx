"use client"

import { useState } from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

import type { PrintSpec } from "@workspace/seasonal/print/spec"

import { useScrollStrip } from "../hooks/use-scroll-strip"
import { getAt } from "../lib/spec-path"
import { OptionField } from "./option-field"
import { isFieldShown, KIND_SECTIONS, shownField, type FieldContext } from "./option-fields"

/** context는 연도 선택지처럼 사양 밖에서 정해지는 값이다(option-fields.ts FieldContext). */
type Props = { spec: PrintSpec; context: FieldContext; error: string | undefined; onChange: (path: readonly string[], value: unknown) => void }

export function OptionsPanel({ spec, context, error, onChange }: Props) {
  // 고른 구성에서 뜻이 없는 옵션·선택지는 숨긴다. 모두 숨겨진 묶음은 탭째 뺀다.
  const sections = KIND_SECTIONS[spec.kind]
    .map((section) => ({ ...section, fields: section.fields.filter((field) => isFieldShown(field, spec)).map((field) => shownField(field, spec, context)) }))
    .filter((section) => section.fields.length > 0)
  const [tab, setTab] = useState(sections[0]!.title)
  const strip = useScrollStrip<HTMLDivElement>(tab)
  // 구성을 바꿔 고른 탭이 빠지면 첫 탭으로 돌아간다.
  const current = sections.some((section) => section.title === tab) ? tab : sections[0]!.title
  return (
    <section aria-labelledby="options-title" className="flex flex-col gap-3">
      <h2 id="options-title" className="font-heading text-lg font-bold text-ink">
        옵션
      </h2>
      <Tabs value={current} onValueChange={setTab} variant="underline">
        {/* 탭이 패널보다 넓으면(좁은 화면, 달 표기 탭이 있는 종류) 스와이프·휠로 옆으로 밀어 본다. 더 있는 쪽 가장자리는 흐리다(admin.css). */}
        <TabsList ref={strip} aria-label="옵션 묶음" className="admin-tab-strip">
          {sections.map((section) => (
            <TabsTrigger key={section.title} value={section.title}>
              {section.title}
            </TabsTrigger>
          ))}
        </TabsList>
        {sections.map((section) => (
          <TabsContent key={section.title} value={section.title} className="flex flex-col gap-4 pt-4">
            {section.fields.map((field) => (
              <OptionField key={field.path.join(".")} field={field} value={getAt(spec, field.path)} orientation={spec.orientation} onChange={(value) => onChange(field.path, value)} />
            ))}
          </TabsContent>
        ))}
      </Tabs>
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
    </section>
  )
}
