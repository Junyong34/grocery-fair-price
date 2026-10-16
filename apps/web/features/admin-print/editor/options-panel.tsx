"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

import type { PrintSpec } from "@workspace/seasonal/print/spec"

import { getAt } from "../lib/spec-path"
import { OptionField } from "./option-field"
import { KIND_SECTIONS } from "./option-fields"

type Props = { spec: PrintSpec; error: string | undefined; onChange: (path: readonly string[], value: unknown) => void }

/** 종류별 옵션 묶음을 탭으로 */
export function OptionsPanel({ spec, error, onChange }: Props) {
  const sections = KIND_SECTIONS[spec.kind]
  return (
    <section aria-labelledby="options-title" className="flex flex-col gap-3">
      <h2 id="options-title" className="font-heading text-lg font-bold text-ink">
        옵션
      </h2>
      <Tabs defaultValue={sections[0]!.title} variant="underline">
        <TabsList aria-label="옵션 묶음">
          {sections.map((section) => (
            <TabsTrigger key={section.title} value={section.title}>
              {section.title}
            </TabsTrigger>
          ))}
        </TabsList>
        {sections.map((section) => (
          <TabsContent key={section.title} value={section.title} className="flex flex-col gap-4 pt-4">
            {section.fields.map((field) => (
              <OptionField key={field.path.join(".")} field={field} value={getAt(spec, field.path)} onChange={(value) => onChange(field.path, value)} />
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
