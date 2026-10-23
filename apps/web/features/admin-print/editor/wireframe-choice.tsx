"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Label } from "@workspace/ui/components/label"
import { RadioGroup, RadioGroupItem } from "@workspace/ui/components/radio-group"

import { wireframeOf, wireframesOf } from "../lib/wireframe-catalog"
import type { Orientation } from "../lib/wireframe-shapes"
import { Wireframe } from "../wireframes/wireframe"
import type { Option } from "./option-fields"

/**
 * 구성·표지 선택을 와이어프레임 썸네일로 보인다. 썸네일은 지금 고른 용지 방향으로 그리고, 그 방향이 없는 안(세로 전용)은 세로로 그린다.
 * 선택지(options)에 없는 같은 쪽의 안 중 아직 안 되는 것(needs-option)은 "준비 중"으로 뒤에 덧붙이고 고를 수 없다.
 * 화살표 키로 고르고, 칸마다 안 이름이 읽힌다(cojeev RadioGroup).
 */
export function WireframeChoice({
  label,
  options,
  page,
  value,
  orientation,
  onChange,
}: {
  label: string
  options: readonly Option[]
  page: "sheet" | "cover"
  value: unknown
  orientation: Orientation
  onChange: (value: unknown) => void
}) {
  const kind = options.map((option) => wireframeOf(option.code ?? "")?.kind).find(Boolean)
  const used = new Set(options.map((option) => option.code))
  const pending = kind ? wireframesOf(kind, page).filter((entry) => entry.availability.status === "needs-option" && !used.has(entry.code)) : []
  return (
    <div className="flex flex-col gap-2">
      {/* 묶음 제목이라 입력과 잇는 <label>이 아닌 span으로 두고 aria-labelledby로 읽힌다. */}
      <Label as="span" id={`choice-${page}`}>
        {label}
      </Label>
      <RadioGroup
        aria-labelledby={`choice-${page}`}
        appearance="card"
        showIndicator={false}
        value={String(value)}
        onValueChange={(next) => onChange(options.find((option) => String(option.value) === next)?.value)}
        className="wireframe-choice grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2"
      >
        {options.map((option) => (
          <Choice key={String(option.value)} value={String(option.value)} title={option.label} code={option.code} orientation={orientation} />
        ))}
        {pending.map((entry) => (
          <Choice key={entry.code} value={`pending-${entry.code}`} title={entry.title} code={entry.code} orientation={orientation} disabled />
        ))}
      </RadioGroup>
    </div>
  )
}

function Choice({ value, title, code, orientation, disabled }: { value: string; title: string; code?: string; orientation: Orientation; disabled?: boolean }) {
  const entry = code ? wireframeOf(code) : undefined
  const drawn = entry && (entry.orientations.includes(orientation) ? orientation : entry.orientations[0]!)
  return (
    <RadioGroupItem value={value} disabled={disabled} aria-label={`${code ? `${code} ` : ""}${title}${disabled ? " (준비 중)" : ""}`} className="flex! flex-col items-stretch gap-2 p-2!">
      {entry && drawn ? (
        <Wireframe entry={entry} orientation={drawn} className={disabled ? "shrink-0 opacity-50" : "shrink-0"} />
      ) : (
        <span aria-hidden className="grid aspect-[210/297] w-full place-items-center rounded-sm border border-dashed border-hairline text-xs text-caption">
          없음
        </span>
      )}
      <span className="flex flex-col gap-1 text-xs leading-snug">
        <span className="text-pretty text-ink">
          {code && <span className="mr-1 font-mono text-caption">{code}</span>}
          {title}
        </span>
        {disabled && (
          <Badge variant="yellow" className="self-start">
            준비 중
          </Badge>
        )}
        {!disabled && entry && drawn !== orientation && <span className="text-caption">세로 용지만</span>}
      </span>
    </RadioGroupItem>
  )
}
