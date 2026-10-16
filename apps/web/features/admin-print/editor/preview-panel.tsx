"use client"

import { useState } from "react"

import { Segmented } from "@workspace/ui/components/segmented"
import { ToggleGroup, ToggleGroupItem } from "@workspace/ui/components/toggle-group"

import { KIND_PAGES, PAPER_SIZES, type PageKey, type Paper, type PrintSpec } from "@workspace/seasonal/print/spec"

import { routes } from "@/shared/routes"

import { pageLabel } from "../lib/downloads"
import { PrintPreview } from "./print-preview"

const PAPER_OPTIONS = PAPER_SIZES.map((size) => ({ value: size, label: size }))

/** 미리보기 칸: 용지·쪽 고르기와 /print 미리보기 */
export function PreviewPanel({ spec, dirty }: { spec: PrintSpec; dirty: boolean }) {
  const pages = KIND_PAGES[spec.kind] as readonly PageKey[]
  const [paper, setPaper] = useState<Paper>("A4")
  const [page, setPage] = useState<PageKey>(pages[0]!)
  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-3xl bg-hairline/50 p-5" aria-labelledby="preview-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="preview-title" className="font-heading text-lg font-bold text-ink">
          미리보기
        </h2>
        <Segmented aria-label="용지" options={PAPER_OPTIONS} value={paper} onValueChange={setPaper} />
        {pages.length > 1 && (
          <ToggleGroup type="single" aria-label="쪽" value={String(page)} onValueChange={(value) => value && setPage(value === "all" ? "all" : (Number(value) as PageKey))} className="gap-1">
            {pages.map((key) => (
              <ToggleGroupItem key={key} value={String(key)} variant="circle" aria-label={pageLabel(key)}>
                {key === "all" ? "전체" : key}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      </div>
      <p className="text-sm text-stone">{dirty ? "저장하지 않은 옵션이 반영된 모습이에요. PDF는 저장한 옵션으로 만들어요." : "저장한 옵션 그대로의 모습이에요."}</p>
      <PrintPreview src={routes.print(spec, paper, page)} paper={paper} orientation={spec.orientation} />
    </section>
  )
}
