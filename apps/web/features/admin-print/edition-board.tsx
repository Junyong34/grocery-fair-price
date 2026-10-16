"use client"

import { Check, Copy, Pencil } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { Button } from "@workspace/ui/components/button"
import { Empty, EmptyDescription, EmptyTitle } from "@workspace/ui/components/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

import { PRINT_KIND_LABELS, PRINT_KINDS, type PrintKind } from "@workspace/seasonal/print/spec"

import { routes } from "@/shared/routes"

import { DeleteEditionButton } from "./delete-edition-button"
import { KIND_DESCRIPTIONS } from "./fields"
import { KindMark } from "./kind-mark"

export type EditionSummary = {
  id: string
  kind: PrintKind
  title: string
  published: boolean
  /** 지금 사양으로 만든 PDF의 생성일. 없거나 사양이 바뀌었으면 null */
  generatedAt: string | null
}

/** 에디션 목록. 종류 탭으로 거르고, "전체"에서는 종류별로 묶어 보여 준다. */
export function EditionBoard({ editions }: { editions: readonly EditionSummary[] }) {
  const byKind = (kind: PrintKind) => editions.filter((edition) => edition.kind === kind)
  return (
    <Tabs defaultValue="all" variant="underline" className="flex flex-col gap-6">
      <TabsList aria-label="종류" className="flex-wrap gap-y-1">
        <TabsTrigger value="all">전체 {editions.length}</TabsTrigger>
        {PRINT_KINDS.map((kind) => (
          <TabsTrigger key={kind} value={kind}>
            {PRINT_KIND_LABELS[kind]} {byKind(kind).length}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="all" className="flex flex-col gap-12">
        {editions.length === 0 ? (
          <Empty className="rounded-2xl bg-hairline/50">
            <EmptyTitle>아직 에디션이 없어요</EmptyTitle>
            <EmptyDescription>“새 에디션”에서 종류를 고르고 이름을 붙이면 첫 에디션이 생겨요.</EmptyDescription>
          </Empty>
        ) : (
          PRINT_KINDS.filter((kind) => byKind(kind).length > 0).map((kind) => <KindGroup key={kind} kind={kind} editions={byKind(kind)} />)
        )}
      </TabsContent>
      {PRINT_KINDS.map((kind) => (
        <TabsContent key={kind} value={kind}>
          <KindGroup kind={kind} editions={byKind(kind)} />
        </TabsContent>
      ))}
    </Tabs>
  )
}

/** 목록 칸. 이름은 왼쪽, 공개·PDF·작업은 오른쪽에 붙여 한 덩어리로 둔다. 머리 줄과 행이 같은 칸을 쓴다. */
const COLUMNS = "sm:grid-cols-[minmax(0,1fr)_88px_148px_148px] sm:gap-x-4"

function KindGroup({ kind, editions }: { kind: PrintKind; editions: readonly EditionSummary[] }) {
  return (
    <section aria-labelledby={`kind-${kind}`} className="flex flex-col gap-4">
      <header className="flex items-center gap-3">
        <KindMark kind={kind} />
        <div className="flex flex-col gap-0.5">
          <h2 id={`kind-${kind}`} className="font-heading text-xl font-bold text-ink">
            {PRINT_KIND_LABELS[kind]} <span className="font-sans text-base font-normal text-caption tabular-nums">{editions.length}</span>
          </h2>
          <p className="text-sm text-stone">{KIND_DESCRIPTIONS[kind]}</p>
        </div>
      </header>
      {editions.length === 0 ? (
        <p className="rounded-2xl bg-hairline/50 px-5 py-4 text-sm text-stone">이 종류의 에디션이 없어요. “새 에디션”에서 만들 수 있어요.</p>
      ) : (
        <div role="table" aria-labelledby={`kind-${kind}`} className="overflow-hidden rounded-2xl bg-surface ring-1 ring-hairline">
          <div role="row" className={`hidden bg-hairline/60 px-5 py-2.5 text-[13px] font-semibold text-stone sm:grid ${COLUMNS}`}>
            <span role="columnheader">이름</span>
            <span role="columnheader">공개</span>
            <span role="columnheader">PDF</span>
            <span role="columnheader" className="text-right">
              작업
            </span>
          </div>
          <div role="rowgroup" className="divide-y divide-hairline">
            {editions.map((edition) => (
              <EditionRow key={edition.id} edition={edition} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

/** 에디션 한 줄: 이름·id | 공개 | PDF | 삭제·편집. 행 어디를 눌러도 편집으로 간다(이름 링크가 행을 덮는다). */
function EditionRow({ edition }: { edition: EditionSummary }) {
  const href = routes.admin.edition(edition.id)
  return (
    <div role="row" className={`group relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 px-5 py-4 transition-colors hover:bg-canvas ${COLUMNS}`}>
      <div role="cell" className="col-span-2 flex min-w-0 flex-col items-start gap-1.5 sm:col-span-1">
        <Link href={href} className="max-w-full truncate font-heading text-lg leading-tight font-bold text-ink no-underline after:absolute after:inset-0 after:content-[''] group-hover:underline group-hover:underline-offset-4">
          {edition.title}
        </Link>
        <EditionId id={edition.id} />
      </div>
      <div role="cell">
        <Status tone={edition.published ? "ok" : "idle"}>{edition.published ? "공개" : "초안"}</Status>
      </div>
      <div role="cell">
        <Status tone={edition.generatedAt ? "ok" : "warn"}>{edition.generatedAt ? `${edition.generatedAt.slice(5)} 생성` : "생성 필요"}</Status>
      </div>
      {/* 작업 버튼은 행 덮개 링크 위로 올린다. */}
      <div role="cell" className="relative z-10 col-span-2 flex items-center justify-end gap-2 sm:col-span-1">
        <DeleteEditionButton id={edition.id} title={edition.title} from="list" />
        <Button asChild size="sm" className="!h-9 gap-1.5">
          <Link href={href}>
            <Pencil aria-hidden size={14} strokeWidth={2} />
            편집하기
          </Link>
        </Button>
      </div>
    </div>
  )
}

const STATUS_DOT = { ok: "bg-olive", warn: "bg-gold", idle: "bg-transparent ring-[1.5px] ring-ash ring-inset" } as const

/** 상태 한 칸: 색 점과 진한 글자. 색은 점에만 준다. */
function Status({ tone, children }: { tone: keyof typeof STATUS_DOT; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap text-ink tabular-nums">
      <span aria-hidden className={`size-2 shrink-0 rounded-full ${STATUS_DOT[tone]}`} />
      {children}
    </span>
  )
}

/** id 꼬리표. 누르면 id를 복사한다(폴더·URL에 쓰는 값이라). 행 덮개 링크 위에 올린다. */
function EditionId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`id ${id} 복사`}
      className="relative z-10 inline-flex h-6 items-center gap-1.5 rounded-md bg-canvas px-2 text-[13px] text-stone ring-1 ring-hairline ring-inset transition-colors group-hover:bg-surface hover:text-ink hover:ring-silver"
    >
      <span className="text-[11px] font-semibold tracking-wide text-caption">ID</span>
      <span className="font-medium tabular-nums">{id}</span>
      {copied ? <Check aria-hidden size={12} strokeWidth={2.4} className="text-olive" /> : <Copy aria-hidden size={12} strokeWidth={2} className="text-caption" />}
      <span aria-live="polite" className="sr-only">
        {copied ? "복사했어요" : ""}
      </span>
    </button>
  )
}
