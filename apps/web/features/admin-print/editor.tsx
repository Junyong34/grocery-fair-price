"use client"

import { useMemo, useState, useTransition } from "react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Field, FieldControl, FieldDescription, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Kbd } from "@workspace/ui/components/kbd"
import { NativeSelect, NativeSelectOption } from "@workspace/ui/components/native-select"
import { NumberInput } from "@workspace/ui/components/number-input"
import { Segmented } from "@workspace/ui/components/segmented"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Switch } from "@workspace/ui/components/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { ToggleGroup, ToggleGroupItem } from "@workspace/ui/components/toggle-group"

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
import { DeleteEditionButton } from "./delete-edition-button"
import { getAt, KIND_SECTIONS, setAt, type Field as FieldSpec } from "./fields"

const CATEGORIES = [...new Set(FOODS.map((food) => food.category))]
const MM_TO_PX = 96 / 25.4
/** 미리보기 용지를 그리는 폭(px). iframe을 이 폭에 맞춰 줄인다. */
const PREVIEW_WIDTH = 620

const pageLabel = (page: PageKey) => (page === "all" ? "전체" : `${page}월`)

/** 에디션 편집기: 왼쪽 옵션(탭), 오른쪽 /print 미리보기. 저장해야 생성할 수 있다. */
export function EditionEditor({ saved, build: savedBuild }: { saved: Edition; build?: BuildRecord }) {
  const [draft, setDraft] = useState(saved)
  const [base, setBase] = useState(saved)
  const [build, setBuild] = useState(savedBuild)
  const [paper, setPaper] = useState<Paper>("A4")
  const [page, setPage] = useState<PageKey>(KIND_PAGES[saved.spec.kind][0]!)
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string }>()
  const [action, setAction] = useState<"save" | "generate">()
  const [pending, startTransition] = useTransition()

  const checked = useMemo(() => parsePrintSpec(draft.spec), [draft.spec])
  const dirty = JSON.stringify(draft) !== JSON.stringify(base)
  const stale = !build || build.specHash !== specHash(base.spec)
  const spec = checked instanceof Error ? base.spec : checked
  const sections = KIND_SECTIONS[draft.spec.kind]

  const change = (path: readonly string[], value: unknown) => setDraft((current) => ({ ...current, spec: setAt(current.spec, path, value) }))

  const save = () => {
    setAction("save")
    startTransition(async () => {
      const result = await saveEdition(draft)
      setMessage(result.error ? { tone: "error", text: result.error } : { tone: "ok", text: "저장했어요." })
      if (!result.error) setBase(draft)
    })
  }

  const generate = () => {
    setAction("generate")
    setMessage(undefined)
    startTransition(async () => {
      const result = await generateEdition(base.id)
      setMessage(result.error ? { tone: "error", text: result.error } : { tone: "ok", text: `PDF ${Object.keys(result.build!.bytes).length}개를 만들었어요.` })
      if (result.build) setBuild(result.build)
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 border-b border-hairline pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{PRINT_KIND_LABELS[draft.spec.kind]}</Badge>
          <Badge variant={draft.status === "published" ? "olive" : "default"}>{draft.status === "published" ? "공개" : "초안"}</Badge>
          <Kbd>{draft.id}</Kbd>
          <span className="ml-auto">
            <DeleteEditionButton id={base.id} title={base.title} from="editor" />
          </span>
        </div>
        <Input
          aria-label="에디션 이름"
          value={draft.title}
          maxLength={40}
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          className="!h-auto !rounded-none !bg-transparent !px-0 font-heading !text-3xl font-bold tracking-tight ![box-shadow:none] focus-visible:![box-shadow:inset_0_-2px_0_var(--color-gold)]"
        />
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[400px_minmax(0,1fr)]">
        <Card className="lg:sticky lg:top-6">
          <CardContent className="flex flex-col gap-5">
            <h2 className="text-xs font-semibold tracking-wider text-caption">옵션</h2>
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
                    <OptionField key={field.path.join(".")} field={field} value={getAt(draft.spec, field.path)} onChange={(value) => change(field.path, value)} />
                  ))}
                </TabsContent>
              ))}
            </Tabs>

            <div className="flex flex-col gap-4 border-t border-hairline pt-4">
              <Field>
                <FieldLabel>설명</FieldLabel>
                <FieldControl>
                  <Input value={draft.description} maxLength={200} placeholder="내려받기 화면에 한 줄로 보여요" onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
                </FieldControl>
              </Field>
              <label className="flex items-center justify-between gap-4 text-sm">
                <span className="flex flex-col">
                  <span className="text-ink">사용자에게 공개</span>
                  <span className="text-xs text-stone">PDF 저장 위치를 정하기 전에는 끄세요</span>
                </span>
                <Switch checked={draft.status === "published"} onCheckedChange={(on) => setDraft({ ...draft, status: on ? "published" : "draft" })} />
              </label>
            </div>

            {checked instanceof Error && (
              <p role="alert" className="text-sm text-error">
                {checked.message}
              </p>
            )}

            <div className="flex flex-col gap-3 border-t border-hairline pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" onClick={save} disabled={pending || !dirty || checked instanceof Error}>
                  {pending && action === "save" ? "저장하는 중…" : "저장"}
                </Button>
                <Button type="button" variant="outline" onClick={generate} disabled={pending || dirty}>
                  {pending && action === "generate" ? "PDF 만드는 중…" : "PDF 생성"}
                </Button>
                <Badge variant={dirty ? "pending" : stale ? "dashed" : "olive"}>
                  {dirty ? "저장 안 됨" : stale ? "생성 필요" : `${build!.generatedAt.slice(0, 16).replace("T", " ")} 생성`}
                </Badge>
              </div>
              <p aria-live="polite" className={message?.tone === "error" ? "text-sm text-error" : "text-sm text-stone"}>
                {message?.text}
              </p>
            </div>
          </CardContent>
        </Card>

        <section className="flex min-w-0 flex-col gap-4 rounded-3xl bg-surface-grey/50 p-5" aria-labelledby="preview-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="preview-title" className="text-xs font-semibold tracking-wider text-caption">
              미리보기
            </h2>
            <Segmented aria-label="용지" options={PAPER_SIZES.map((size) => ({ value: size, label: size }))} value={paper} onValueChange={setPaper} />
            {KIND_PAGES[spec.kind].length > 1 && (
              <ToggleGroup type="single" aria-label="쪽" value={String(page)} onValueChange={(value) => value && setPage(value === "all" ? "all" : (Number(value) as PageKey))} className="gap-1">
                {KIND_PAGES[spec.kind].map((key) => (
                  <ToggleGroupItem key={key} value={String(key)} variant="circle" aria-label={pageLabel(key)}>
                    {key === "all" ? "전체" : key}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}
          </div>
          <Preview src={`/print?spec=${encodeSpec(spec)}&paper=${paper}&page=${page}`} paper={paper} landscape={spec.orientation === "landscape"} />
          {build && !stale && <GeneratedFiles edition={base} />}
        </section>
      </div>
    </div>
  )
}

/** 실제 인쇄 페이지를 용지 비율 그대로 줄여 보여 준다. 불러오는 동안 같은 크기의 자리표시를 둔다. */
function Preview({ src, paper, landscape }: { src: string; paper: Paper; landscape: boolean }) {
  const [loaded, setLoaded] = useState<string>()
  const { width, height } = PAPERS[paper]
  const sheet = landscape ? { width: height, height: width } : { width, height }
  // /print는 화면에서 용지 둘레에 24px 여백을 둔다.
  const frame = { width: sheet.width * MM_TO_PX + 48, height: sheet.height * MM_TO_PX + 48 }
  const zoom = PREVIEW_WIDTH / frame.width
  return (
    <div className="relative max-w-full overflow-hidden rounded-2xl bg-surface-grey shadow-sm" style={{ width: PREVIEW_WIDTH, aspectRatio: `${frame.width} / ${frame.height}` }}>
      {loaded !== src && <Skeleton className="absolute inset-6 rounded-none" />}
      <iframe
        title="인쇄 미리보기"
        src={src}
        onLoad={() => setLoaded(src)}
        style={{ width: frame.width, height: frame.height, zoom }}
        className="border-0"
      />
    </div>
  )
}

function GeneratedFiles({ edition }: { edition: Edition }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 text-sm">
        <span className="font-medium text-ink">만든 PDF</span>
        {PAPER_SIZES.map((size) => (
          <div key={size} className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Badge>{size}</Badge>
            {KIND_PAGES[edition.spec.kind].map((key) => (
              <a key={key} className="text-stone underline-offset-4 hover:text-ink hover:underline" href={downloadPath(edition.id, size, key)} target="_blank" rel="noreferrer">
                {pageLabel(key)}
              </a>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function OptionField({ field, value, onChange }: { field: FieldSpec; value: unknown; onChange: (value: unknown) => void }) {
  if (field.type === "toggle")
    return (
      <label className="flex items-center justify-between gap-4 text-sm">
        <span className="text-ink">{field.label}</span>
        <Switch checked={Boolean(value)} onCheckedChange={onChange} />
      </label>
    )

  if (field.type === "categories") {
    const selected = value as readonly string[]
    return (
      <Field>
        <FieldLabel>{field.label}</FieldLabel>
        <ToggleGroup type="multiple" aria-label={field.label} value={[...selected]} onValueChange={onChange} className="gap-1.5">
          {CATEGORIES.map((category) => (
            <ToggleGroupItem key={category} value={category} variant="pressed">
              {category}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>
    )
  }

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
          <Input value={String(value)} maxLength={40} onChange={(event) => onChange(event.target.value)} />
        )}
      </FieldControl>
      {field.hint && <FieldDescription>{field.hint}</FieldDescription>}
    </Field>
  )
}
