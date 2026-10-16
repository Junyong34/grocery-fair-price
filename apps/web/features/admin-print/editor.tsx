"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"

import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Field, FieldControl, FieldDescription, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { NativeSelect, NativeSelectOption } from "@workspace/ui/components/native-select"
import { NumberInput } from "@workspace/ui/components/number-input"
import { Segmented } from "@workspace/ui/components/segmented"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Switch } from "@workspace/ui/components/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { ToggleGroup, ToggleGroupItem } from "@workspace/ui/components/toggle-group"

import { FOODS } from "@workspace/seasonal/data/foods"
import type { BuildRecord, Edition } from "@workspace/seasonal/print/edition"
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
import { EditionSteps } from "./edition-steps"
import { getAt, KIND_SECTIONS, setAt, type Field as FieldSpec } from "./fields"
import { editionFlow, pdfPaths } from "./flow"
import { formatBuildTime } from "./format"

const CATEGORIES = [...new Set(FOODS.map((food) => food.category))]
const MM_TO_PX = 96 / 25.4
/** 미리보기 용지를 그리는 최대 폭(px). iframe을 들어갈 칸 폭에 맞춰 줄인다. */
const PREVIEW_MAX_WIDTH = 680

const pageLabel = (page: PageKey) => (page === "all" ? "전체" : `${page}월`)

/** 에디션 편집기: 위에 작업 순서(저장 → PDF 만들기), 왼쪽 옵션(탭), 오른쪽 /print 미리보기. 저장해야 생성할 수 있다. */
export function EditionEditor({ saved, build: savedBuild }: { saved: Edition; build?: BuildRecord }) {
  const [draft, setDraft] = useState(saved)
  const [base, setBase] = useState(saved)
  const [build, setBuild] = useState(savedBuild)
  const [paper, setPaper] = useState<Paper>("A4")
  const [page, setPage] = useState<PageKey>(KIND_PAGES[saved.spec.kind][0]!)
  const [message, setMessage] = useState<{ tone: "error"; text: string }>()
  const [action, setAction] = useState<"save" | "generate">()
  const [pending, startTransition] = useTransition()

  const checked = useMemo(() => parsePrintSpec(draft.spec), [draft.spec])
  const dirty = JSON.stringify(draft) !== JSON.stringify(base)
  const stale = !build || build.specHash !== specHash(base.spec)
  const spec = checked instanceof Error ? base.spec : checked
  const sections = KIND_SECTIONS[draft.spec.kind]
  const flow = editionFlow({ dirty, invalid: checked instanceof Error, hasBuild: Boolean(build), stale })

  const change = (path: readonly string[], value: unknown) => setDraft((current) => ({ ...current, spec: setAt(current.spec, path, value) }))

  const save = () => {
    setAction("save")
    startTransition(async () => {
      const result = await saveEdition(draft)
      // 성공은 작업 순서 표시가 알려 주므로 오류만 메시지로 띄운다.
      setMessage(result.error ? { tone: "error", text: result.error } : undefined)
      if (!result.error) setBase(draft)
    })
  }

  const generate = () => {
    setAction("generate")
    setMessage(undefined)
    startTransition(async () => {
      const result = await generateEdition(base.id)
      setMessage(result.error ? { tone: "error", text: result.error } : undefined)
      if (result.build) setBuild(result.build)
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <dl className="flex flex-wrap gap-x-8 gap-y-3 self-start rounded-2xl bg-surface px-5 py-3">
          <Meta label="종류">
            <Badge>{PRINT_KIND_LABELS[draft.spec.kind]}</Badge>
          </Meta>
          <Meta label="공개 상태">
            <Badge variant={draft.status === "published" ? "olive" : "default"}>{draft.status === "published" ? "공개" : "초안"}</Badge>
          </Meta>
          <Meta label="id · 다운로드 주소에 쓰여요">
            <span className="font-mono text-sm tabular-nums text-ink">{draft.id}</span>
          </Meta>
        </dl>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <Input
            aria-label="에디션 이름"
            value={draft.title}
            maxLength={40}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            className="admin-title !h-auto min-w-[16rem] flex-1 !rounded-none !px-0 font-heading !text-4xl font-bold tracking-tight"
          />
          <div className="flex flex-wrap items-center gap-2">
            <DeleteEditionButton id={base.id} title={base.title} from="editor" />
          </div>
        </div>
        <EditionSteps
          flow={flow}
          pending={pending}
          running={pending ? action : undefined}
          generatedAt={build && !stale ? formatBuildTime(build.generatedAt) : undefined}
          onSave={save}
          onGenerate={generate}
        />
        <p role="alert" className="text-sm text-error empty:hidden">
          {message?.text}
        </p>
        {build && <GeneratedFiles edition={base} build={build} stale={stale} />}
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[400px_minmax(0,1fr)]">
        <Card className="lg:sticky lg:top-6">
          <CardContent className="flex flex-col gap-8">
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
                      <OptionField key={field.path.join(".")} field={field} value={getAt(draft.spec, field.path)} onChange={(value) => change(field.path, value)} />
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
              {checked instanceof Error && (
                <p role="alert" className="text-sm text-error">
                  {checked.message}
                </p>
              )}
            </section>

            <section aria-labelledby="listing-title" className="flex flex-col gap-4">
              <h2 id="listing-title" className="font-heading text-lg font-bold text-ink">
                내려받기 화면
              </h2>
              <Field>
                <FieldLabel>설명</FieldLabel>
                <FieldControl>
                  <Input value={draft.description} maxLength={200} placeholder="내려받기 화면에 한 줄로 보여요" onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
                </FieldControl>
              </Field>
              <label className="flex items-center justify-between gap-4 text-sm">
                <span className="flex flex-col gap-0.5">
                  <span className="text-ink">사용자에게 공개</span>
                  <span className="text-[13px] text-stone">PDF 저장 위치를 정하기 전에는 끄세요</span>
                </span>
                <Switch checked={draft.status === "published"} onCheckedChange={(on) => setDraft({ ...draft, status: on ? "published" : "draft" })} />
              </label>
            </section>
          </CardContent>
        </Card>

        <section className="flex min-w-0 flex-col gap-4 rounded-3xl bg-hairline/50 p-5" aria-labelledby="preview-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="preview-title" className="font-heading text-lg font-bold text-ink">
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
          <p className="text-sm text-stone">
            {dirty ? "저장하지 않은 옵션이 반영된 모습이에요. PDF는 저장한 옵션으로 만들어요." : "저장한 옵션 그대로의 모습이에요."}
          </p>
          <Preview src={`/print?spec=${encodeSpec(spec)}&paper=${paper}&page=${page}`} paper={paper} landscape={spec.orientation === "landscape"} />
        </section>
      </div>
    </div>
  )
}

/** 머리의 이름표 붙은 정보 한 칸. 값이 무슨 정보인지 위에 적는다. */
function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <dt className="text-xs text-caption">{label}</dt>
      <dd className="flex min-h-7 items-center">{children}</dd>
    </div>
  )
}

/** 실제 인쇄 페이지를 용지 비율 그대로 줄여 보여 준다. 불러오는 동안 같은 크기의 자리표시를 둔다. */
function Preview({ src, paper, landscape }: { src: string; paper: Paper; landscape: boolean }) {
  const [loaded, setLoaded] = useState<string>()
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(PREVIEW_MAX_WIDTH)
  useEffect(() => {
    const node = box.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => entry && setWidth(entry.contentRect.width))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  const size = PAPERS[paper]
  const sheet = landscape ? { width: size.height, height: size.width } : size
  // /print는 화면에서 용지 둘레에 24px 여백을 둔다.
  const frame = { width: sheet.width * MM_TO_PX + 48, height: sheet.height * MM_TO_PX + 48 }
  return (
    <div ref={box} className="relative w-full overflow-hidden rounded-2xl bg-hairline" style={{ maxWidth: PREVIEW_MAX_WIDTH, aspectRatio: `${frame.width} / ${frame.height}` }}>
      {loaded !== src && <Skeleton className="absolute inset-6 rounded-none" />}
      <iframe
        title="인쇄 미리보기"
        src={src}
        onLoad={() => setLoaded(src)}
        style={{ width: frame.width, height: frame.height, zoom: width / frame.width }}
        className="border-0"
      />
    </div>
  )
}

/** 만든 PDF의 주소. 주소는 에디션 id·용지·쪽으로 정해져서 다시 만들어도 같다. 관리자는 이 주소로 링크를 건다. */
function GeneratedFiles({ edition, build, stale }: { edition: Edition; build: BuildRecord; stale: boolean }) {
  const [copied, setCopied] = useState<Paper>()
  const copy = async (size: Paper) => {
    try {
      await navigator.clipboard.writeText(pdfPaths(edition.id, edition.spec.kind, size).join("\n"))
      setCopied(size)
    } catch {
      setCopied(undefined)
    }
  }
  return (
    <Card className="!p-4">
      <CardContent className="gap-2 text-sm">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="font-heading text-base font-bold text-ink">만든 PDF</h3>
          <Badge variant={stale ? "yellow" : "olive-soft"}>{stale ? "옛 옵션" : "최신"}</Badge>
          <span className="text-caption tabular-nums">{formatBuildTime(build.generatedAt)} 생성</span>
          <span className="text-stone">
            · 주소 <code className="rounded bg-hairline/60 px-1.5 py-0.5 text-[13px] text-ink">{`/downloads/${edition.id}/{a4|a3}/{쪽}.pdf`}</code>
            {stale ? " · 이전 옵션으로 만든 파일이고, 다시 만들어도 주소는 그대로예요" : " · 다시 만들어도 주소는 그대로예요"}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-1.5">
          {PAPER_SIZES.map((size) => (
            <div key={size} className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Badge>{size}</Badge>
              {KIND_PAGES[edition.spec.kind].map((key, index) => (
                <a key={key} className="text-stone underline-offset-4 hover:text-ink hover:underline" href={pdfPaths(edition.id, edition.spec.kind, size)[index]} target="_blank" rel="noreferrer">
                  {pageLabel(key)}
                </a>
              ))}
              <button type="button" onClick={() => copy(size)} className="text-caption underline-offset-4 hover:text-ink hover:underline">
                {copied === size ? "복사했어요" : "주소 복사"}
              </button>
            </div>
          ))}
        </div>
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
