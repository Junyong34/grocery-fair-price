"use client"

import { useMemo, useState, useTransition } from "react"

import { Button } from "@workspace/ui/components/button"
import { Segmented } from "@workspace/ui/components/segmented"
import { cn } from "@workspace/ui/lib/utils"

import { FOODS } from "@workspace/seasonal/data/foods"
import { downloadPath, type BuildRecord, type Edition } from "@workspace/seasonal/print/edition"
import {
  encodeSpec,
  KIND_PAGES,
  PAPER_SIZES,
  PAPERS,
  parsePrintSpec,
  PRINT_KIND_LABELS,
  specHash,
  type PageKey,
  type Paper,
} from "@workspace/seasonal/print/spec"

import { generateEdition, saveEdition } from "./actions"
import { getAt, KIND_SECTIONS, setAt, type Field } from "./fields"

const CATEGORIES = [...new Set(FOODS.map((food) => food.category))]
const MM_TO_PX = 96 / 25.4

/** 에디션 편집기: 왼쪽 옵션, 오른쪽 /print 미리보기. 저장해야 생성할 수 있다. */
export function EditionEditor({ saved, build: savedBuild }: { saved: Edition; build?: BuildRecord }) {
  const [draft, setDraft] = useState(saved)
  const [base, setBase] = useState(saved)
  const [build, setBuild] = useState(savedBuild)
  const [paper, setPaper] = useState<Paper>("A4")
  const [page, setPage] = useState<PageKey>(KIND_PAGES[saved.spec.kind][0]!)
  const [message, setMessage] = useState<string>()
  const [pending, startTransition] = useTransition()

  const checked = useMemo(() => parsePrintSpec(draft.spec), [draft.spec])
  const dirty = JSON.stringify(draft) !== JSON.stringify(base)
  const stale = !build || build.specHash !== specHash(base.spec)
  const spec = checked instanceof Error ? base.spec : checked

  const change = (path: readonly string[], value: unknown) => setDraft((current) => ({ ...current, spec: setAt(current.spec, path, value) }))

  const save = () =>
    startTransition(async () => {
      const result = await saveEdition(draft)
      setMessage(result.error ?? "저장했다")
      if (!result.error) setBase(draft)
    })

  const generate = () =>
    startTransition(async () => {
      setMessage("PDF를 만드는 중…")
      const result = await generateEdition(base.id)
      setMessage(result.error ?? `PDF ${Object.keys(result.build!.bytes).length}개를 만들었다`)
      if (result.build) setBuild(result.build)
    })

  const { width, height } = PAPERS[paper]
  const sheet = spec.orientation === "portrait" ? { width, height } : { width: height, height: width }
  const frame = { width: sheet.width * MM_TO_PX + 48, height: sheet.height * MM_TO_PX + 48 }
  const zoom = 560 / frame.width

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      <form className="flex flex-col gap-6" onSubmit={(event) => event.preventDefault()}>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-caption">{PRINT_KIND_LABELS[draft.spec.kind]} · {draft.id}</span>
          <TextInput label="에디션 이름" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
          <TextInput label="설명" value={draft.description} onChange={(description) => setDraft({ ...draft, description })} />
          <label className="flex items-center justify-between py-1 text-sm">
            사용자에게 공개
            <input type="checkbox" checked={draft.status === "published"} onChange={(event) => setDraft({ ...draft, status: event.target.checked ? "published" : "draft" })} />
          </label>
        </div>
        {KIND_SECTIONS[draft.spec.kind].map((section) => (
          <fieldset key={section.title} className="flex flex-col gap-2 border-t border-hairline pt-4">
            <legend className="font-heading text-base text-ink">{section.title}</legend>
            {section.fields.map((field) => (
              <FieldControl key={field.path.join(".")} field={field} value={getAt(draft.spec, field.path)} onChange={(value) => change(field.path, value)} />
            ))}
          </fieldset>
        ))}
        {checked instanceof Error && <p className="text-sm text-error">{checked.message}</p>}
        <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t border-hairline bg-canvas py-3">
          <Button type="button" onClick={save} disabled={pending || !dirty || checked instanceof Error}>
            저장
          </Button>
          <Button type="button" variant="outline" onClick={generate} disabled={pending || dirty}>
            PDF 생성
          </Button>
          <span className="text-xs text-caption">
            {dirty ? "저장하지 않은 변경이 있다" : stale ? "다시 생성 필요" : `생성됨 ${build?.generatedAt.slice(0, 16).replace("T", " ")}`}
          </span>
          {message && <p className="w-full text-sm text-stone">{message}</p>}
        </div>
        {build && !stale && (
          <ul className="flex flex-col gap-1 text-sm">
            {PAPER_SIZES.map((size) => (
              <li key={size} className="flex flex-wrap gap-x-3">
                <span className="text-caption">{size}</span>
                {KIND_PAGES[base.spec.kind].map((key) => (
                  <a key={key} className="underline" href={downloadPath(base.id, size, key)} target="_blank" rel="noreferrer">
                    {key === "all" ? "전체" : key}
                  </a>
                ))}
              </li>
            ))}
          </ul>
        )}
      </form>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented aria-label="용지" options={PAPER_SIZES.map((size) => ({ value: size, label: size }))} value={paper} onValueChange={setPaper} />
          {KIND_PAGES[spec.kind].length > 1 && (
            <div className="flex flex-wrap gap-1">
              {KIND_PAGES[spec.kind].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPage(key)}
                  className={cn("min-w-8 rounded-full px-2 py-1 text-sm", page === key ? "bg-ink text-canvas" : "text-stone")}
                >
                  {key === "all" ? "전체" : key}
                </button>
              ))}
            </div>
          )}
        </div>
        <iframe
          title="인쇄 미리보기"
          src={`/print?spec=${encodeSpec(spec)}&paper=${paper}&page=${page}`}
          style={{ width: frame.width, height: frame.height, zoom }}
          className="rounded-md border border-hairline bg-surface-grey"
        />
      </div>
    </div>
  )
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-caption">{label}</span>
      <input className="rounded-md border border-hairline bg-surface px-2 py-1.5" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function FieldControl({ field, value, onChange }: { field: Field; value: unknown; onChange: (value: unknown) => void }) {
  const row = "flex items-center justify-between gap-4 text-sm"
  switch (field.type) {
    case "select":
      return (
        <label className={row}>
          <span className="text-stone">{field.label}</span>
          <select
            className="rounded-md border border-hairline bg-surface px-2 py-1"
            value={String(value)}
            onChange={(event) => onChange(field.options.find((option) => String(option.value) === event.target.value)?.value)}
          >
            {field.options.map((option) => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )
    case "toggle":
      return (
        <label className={row}>
          <span className="text-stone">{field.label}</span>
          <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
        </label>
      )
    case "number":
      return (
        <label className={row}>
          <span className="text-stone">{field.label}</span>
          <input
            type="number"
            className="w-24 rounded-md border border-hairline bg-surface px-2 py-1"
            min={field.min}
            max={field.max}
            value={Number(value)}
            onChange={(event) => onChange(Number(event.target.value))}
          />
        </label>
      )
    case "text":
      return <TextInput label={field.label} value={String(value)} onChange={onChange} />
    case "categories": {
      const selected = value as readonly string[]
      return (
        <div className="flex flex-col gap-1 text-sm">
          <span className="text-stone">{field.label}</span>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((category) => (
              <label key={category} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={selected.includes(category)}
                  onChange={(event) => onChange(event.target.checked ? [...selected, category] : selected.filter((item) => item !== category))}
                />
                {category}
              </label>
            ))}
          </div>
        </div>
      )
    }
  }
}
