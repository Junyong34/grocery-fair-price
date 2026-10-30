"use client"

import { useState } from "react"

import { Empty, EmptyDescription, EmptyTitle } from "@workspace/ui/components/empty"
import { NativeSelect, NativeSelectOption } from "@workspace/ui/components/native-select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

import { PRINT_KIND_LABELS, PRINT_KINDS, type PrintKind } from "@workspace/seasonal/print/spec"

import type { EditionSummary } from "../types"
import { KindGroup } from "./kind-group"
import { ALL_YEARS, filterByYear, resolveYearFilter, yearFilterOptions, type YearFilter } from "./year-filter"

export function EditionBoard({ editions }: { editions: readonly EditionSummary[] }) {
  const [pickedYear, setYear] = useState<YearFilter>(ALL_YEARS)
  const yearOptions = yearFilterOptions(editions)
  const year = resolveYearFilter(pickedYear, yearOptions)
  // 고른 연도는 늘 선택지 안에 있어서(없으면 전체 연도로 돌아감) "전체" 탭이 연도 때문에 비지는 않는다. 빈 결과는 종류 탭에서만 생긴다.
  // 연도로 먼저 거르고 종류로 나눈다. 탭의 개수도 고른 연도를 따른다.
  const shown = filterByYear(editions, year)
  const byKind = Object.fromEntries(PRINT_KINDS.map((kind) => [kind, shown.filter((edition) => edition.kind === kind)])) as Record<PrintKind, EditionSummary[]>
  const yearLabel = yearOptions.find((option) => option.value === year)?.label

  return (
    <Tabs defaultValue="all" variant="underline" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <TabsList aria-label="종류" className="flex-wrap gap-y-1">
          <TabsTrigger value="all">전체 {shown.length}</TabsTrigger>
          {PRINT_KINDS.map((kind) => (
            <TabsTrigger key={kind} value={kind}>
              {PRINT_KIND_LABELS[kind]} {byKind[kind].length}
            </TabsTrigger>
          ))}
        </TabsList>
        {/* 에디션이 하나도 없으면 고를 연도가 없으니 숨긴다. */}
        {editions.length > 0 && (
          <NativeSelect aria-label="연도" value={year} onChange={(event) => setYear(event.target.value)} className="h-9 pl-4 pr-9 text-sm">
            {yearOptions.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        )}
      </div>
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
          <KindGroup kind={kind} editions={byKind[kind]} yearLabel={year === ALL_YEARS ? undefined : yearLabel} />
        </TabsContent>
      ))}
    </Tabs>
  )
}

