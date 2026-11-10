"use client"

import { useState } from "react"

import { Segmented } from "@workspace/ui/components/segmented"

import { pageCount, papersForSpec, type Paper, type PrintSpec } from "@workspace/seasonal/print/spec"

import { routes } from "@/shared/routes"

import { PrintPreview } from "./print-preview"

export function PreviewPanel({ spec, dirty }: { spec: PrintSpec; dirty: boolean }) {
  const [selected, setPaper] = useState<Paper>("A4")
  const papers = papersForSpec(spec)
  const paper = papers.includes(selected) ? selected : "A4"
  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-3xl bg-hairline/50 p-5" aria-labelledby="preview-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="preview-title" className="font-heading text-lg font-bold text-ink">
          미리보기
        </h2>
        {papers.length === 1 ? <span className="text-sm text-stone">A4 {spec.orientation === "landscape" ? "가로" : "세로"} · {pageCount(spec)}장</span> : <Segmented aria-label="용지" options={papers.map((size) => ({ value: size, label: size }))} value={paper} onValueChange={setPaper} />}
      </div>
      <p className="text-sm text-stone">{dirty ? "저장하지 않은 옵션이 반영된 모습이에요. PDF는 저장한 옵션으로 만들어요." : "저장한 옵션 그대로의 모습이에요."}</p>
      <PrintPreview src={routes.print(spec, paper)} paper={paper} orientation={spec.orientation} />
    </section>
  )
}
