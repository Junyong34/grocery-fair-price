"use client"

import { Field, FieldControl, FieldDescription, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { NativeSelect, NativeSelectOption } from "@workspace/ui/components/native-select"
import { NumberInput } from "@workspace/ui/components/number-input"
import { Switch } from "@workspace/ui/components/switch"
import { ToggleGroup, ToggleGroupItem } from "@workspace/ui/components/toggle-group"

import type { Orientation } from "../lib/wireframe-shapes"
import { FOOD_CATEGORIES, type OptionFieldSpec } from "./option-fields"
import { WireframeChoice } from "./wireframe-choice"

const TEXT_MAX = 40

/** orientation은 구성 썸네일을 그릴 용지 방향이다. */
type Props = { field: OptionFieldSpec; value: unknown; orientation: Orientation; onChange: (value: unknown) => void }

export function OptionField({ field, value, orientation, onChange }: Props) {
  if (field.type === "select" && field.wireframes)
    return <WireframeChoice label={field.label} options={field.options} page={field.wireframes} value={value} orientation={orientation} onChange={onChange} />

  if (field.type === "toggle")
    return (
      <label className="flex items-center justify-between gap-4 text-sm">
        <span className="text-ink">{field.label}</span>
        <Switch checked={Boolean(value)} onCheckedChange={onChange} />
      </label>
    )

  if (field.type === "categories")
    return (
      <Field>
        <FieldLabel>{field.label}</FieldLabel>
        <ToggleGroup type="multiple" aria-label={field.label} value={[...(value as readonly string[])]} onValueChange={onChange} className="gap-1.5">
          {FOOD_CATEGORIES.map((category) => (
            <ToggleGroupItem key={category} value={category} variant="pressed">
              {category}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>
    )

  return (
    <Field>
      <FieldLabel>{field.label}</FieldLabel>
      <FieldControl>
        {field.type === "select" ? (
          <NativeSelect value={String(value)} onChange={(event) => onChange(field.options.find((option) => String(option.value) === event.target.value)?.value)}>
            {field.options.map((option) => (
              <NativeSelectOption key={String(option.value)} value={String(option.value)}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        ) : field.type === "number" ? (
          <NumberInput value={Number(value)} min={field.min} max={field.max} format={{ useGrouping: false }} onValueChange={(next) => next !== null && onChange(next)} decrementLabel="하나 줄이기" incrementLabel="하나 늘리기" />
        ) : (
          <Input value={String(value)} maxLength={TEXT_MAX} onChange={(event) => onChange(event.target.value)} />
        )}
      </FieldControl>
      {field.hint && <FieldDescription>{field.hint}</FieldDescription>}
    </Field>
  )
}
