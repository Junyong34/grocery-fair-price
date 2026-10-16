import { Empty, EmptyDescription, EmptyTitle } from "@workspace/ui/components/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

import { PRINT_KIND_LABELS, PRINT_KINDS, type PrintKind } from "@workspace/seasonal/print/spec"

import type { EditionSummary } from "../types"
import { KindGroup } from "./kind-group"

export function EditionBoard({ editions }: { editions: readonly EditionSummary[] }) {
  const byKind = Object.fromEntries(PRINT_KINDS.map((kind) => [kind, editions.filter((edition) => edition.kind === kind)])) as Record<PrintKind, EditionSummary[]>
  return (
    <Tabs defaultValue="all" variant="underline" className="flex flex-col gap-6">
      <TabsList aria-label="종류" className="flex-wrap gap-y-1">
        <TabsTrigger value="all">전체 {editions.length}</TabsTrigger>
        {PRINT_KINDS.map((kind) => (
          <TabsTrigger key={kind} value={kind}>
            {PRINT_KIND_LABELS[kind]} {byKind[kind].length}
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
          PRINT_KINDS.filter((kind) => byKind[kind].length > 0).map((kind) => <KindGroup key={kind} kind={kind} editions={byKind[kind]} />)
        )}
      </TabsContent>
      {PRINT_KINDS.map((kind) => (
        <TabsContent key={kind} value={kind}>
          <KindGroup kind={kind} editions={byKind[kind]} />
        </TabsContent>
      ))}
    </Tabs>
  )
}
