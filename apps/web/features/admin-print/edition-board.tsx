"use client"

import Link from "next/link"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Empty, EmptyDescription, EmptyTitle } from "@workspace/ui/components/empty"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@workspace/ui/components/item"
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

/** 목록 칸. 머리 줄과 행이 같은 칸을 써서 상태가 세로로 줄을 맞춘다. 좁은 화면에서는 이름을 한 줄 위에 올린다. */
const COLUMNS = "!px-4 sm:grid-cols-[minmax(0,1fr)_76px_148px_200px] sm:!gap-x-6"

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
        <ItemGroup variant="grouped" role="table" aria-labelledby={`kind-${kind}`}>
          <div role="row" className={`hidden pt-2 pb-1 text-[13px] font-medium text-caption sm:grid ${COLUMNS}`}>
            <span role="columnheader">이름</span>
            <span role="columnheader">공개</span>
            <span role="columnheader">PDF</span>
            <span role="columnheader" className="sr-only">
              작업
            </span>
          </div>
          {editions.map((edition) => (
            <EditionRow key={edition.id} edition={edition} />
          ))}
        </ItemGroup>
      )}
    </section>
  )
}

/** 에디션 한 줄: 이름·id | 공개 | PDF | 삭제·편집. */
function EditionRow({ edition }: { edition: EditionSummary }) {
  const href = routes.admin.edition(edition.id)
  return (
    <Item as="div" role="row" className={`!grid grid-cols-[auto_minmax(0,1fr)] !items-center !gap-x-2 !gap-y-3 !bg-transparent !py-3 hover:!bg-hairline/40 ${COLUMNS}`}>
      <ItemContent role="cell" className="col-span-2 sm:col-span-1">
        <ItemTitle>
          <Link href={href} className="font-heading text-lg font-bold text-ink no-underline underline-offset-4 hover:underline">
            {edition.title}
          </Link>
        </ItemTitle>
        <ItemDescription className="tabular-nums">id {edition.id}</ItemDescription>
      </ItemContent>
      <span role="cell">
        <Badge variant={edition.published ? "olive" : "default"}>{edition.published ? "공개" : "초안"}</Badge>
      </span>
      <span role="cell">
        <Badge variant={edition.generatedAt ? "olive-soft" : "yellow"}>{edition.generatedAt ? `${edition.generatedAt} 생성` : "생성 필요"}</Badge>
      </span>
      <div role="cell" className="col-span-2 flex items-center justify-end gap-2 sm:col-span-1">
        <DeleteEditionButton id={edition.id} title={edition.title} from="list" />
        <Button asChild size="sm">
          <Link href={href}>편집하기</Link>
        </Button>
      </div>
    </Item>
  )
}
