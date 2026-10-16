"use client"

import Link from "next/link"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Empty, EmptyDescription, EmptyTitle } from "@workspace/ui/components/empty"
import { Kbd } from "@workspace/ui/components/kbd"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

import { PRINT_KIND_LABELS, PRINT_KINDS, type PrintKind } from "@workspace/seasonal/print/spec"

import { routes } from "@/shared/routes"

import { DeleteEditionButton } from "./delete-edition-button"
import { KIND_DESCRIPTIONS } from "./fields"

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
      <TabsList aria-label="종류" className="overflow-x-auto">
        <TabsTrigger value="all">전체 {editions.length}</TabsTrigger>
        {PRINT_KINDS.map((kind) => (
          <TabsTrigger key={kind} value={kind}>
            {PRINT_KIND_LABELS[kind]} {byKind(kind).length}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="all" className="flex flex-col gap-10">
        {editions.length === 0 ? (
          <Empty className="rounded-2xl bg-surface">
            <EmptyTitle>아직 에디션이 없어요</EmptyTitle>
            <EmptyDescription>왼쪽에서 종류를 고르고 이름을 붙이면 첫 에디션이 생겨요.</EmptyDescription>
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

function KindGroup({ kind, editions }: { kind: PrintKind; editions: readonly EditionSummary[] }) {
  return (
    <section aria-labelledby={`kind-${kind}`} className="flex flex-col gap-4">
      <header className="flex items-baseline justify-between gap-4 border-b border-hairline pb-2">
        <h2 id={`kind-${kind}`} className="font-heading text-xl font-bold text-ink">
          {PRINT_KIND_LABELS[kind]} <span className="text-base font-normal text-caption tabular-nums">{editions.length}</span>
        </h2>
        <p className="hidden text-xs text-stone sm:block">{KIND_DESCRIPTIONS[kind]}</p>
      </header>
      {editions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-hairline px-4 py-6 text-center text-sm text-caption">이 종류의 에디션이 없어요.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {editions.map((edition) => (
            <li key={edition.id}>
              <EditionCard edition={edition} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function EditionCard({ edition }: { edition: EditionSummary }) {
  const href = routes.admin.edition(edition.id)
  return (
    <Card lift className="flex h-full flex-col">
      <CardHeader className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={edition.published ? "olive" : "default"}>{edition.published ? "공개" : "초안"}</Badge>
          <Badge variant={edition.generatedAt ? "default" : "dashed"}>{edition.generatedAt ? `${edition.generatedAt} 생성` : "PDF 생성 필요"}</Badge>
        </div>
        <CardTitle className="font-heading text-lg">
          <Link href={href} className="hover:underline hover:underline-offset-4">
            {edition.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <span className="text-xs text-caption">
          id <Kbd className="!inline">{edition.id}</Kbd>
        </span>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2">
        <Button asChild size="sm">
          <Link href={href}>편집하기 →</Link>
        </Button>
        <DeleteEditionButton id={edition.id} title={edition.title} from="list" />
      </CardFooter>
    </Card>
  )
}
