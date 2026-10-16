"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent } from "@workspace/ui/components/card"

import type { BuildRecord, Edition } from "@workspace/seasonal/print/edition"
import { KIND_PAGES, PAPER_SIZES, type Paper } from "@workspace/seasonal/print/spec"

import { useCopy } from "../hooks/use-copy"
import { downloadPattern, pageLabel, pdfPaths } from "../lib/downloads"
import { formatBuildTime } from "../lib/format"

/** 만든 PDF의 주소. 주소는 에디션 id·용지·쪽으로 정해져서 다시 만들어도 같다. 관리자는 이 주소로 링크를 건다. */
export function GeneratedFiles({ edition, build, stale }: { edition: Edition; build: BuildRecord; stale: boolean }) {
  const { copied, copy } = useCopy<Paper>()
  return (
    <Card className="!p-4">
      <CardContent className="gap-2 text-sm">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="font-heading text-base font-bold text-ink">만든 PDF</h3>
          <Badge variant={stale ? "yellow" : "olive-soft"}>{stale ? "옛 옵션" : "최신"}</Badge>
          <span className="text-caption tabular-nums">{formatBuildTime(build.generatedAt)} 생성</span>
          <span className="text-stone">
            · 주소 <code className="rounded bg-hairline/60 px-1.5 py-0.5 text-[13px] text-ink">{downloadPattern(edition.id)}</code>
            {stale ? " · 이전 옵션으로 만든 파일이고, 다시 만들어도 주소는 그대로예요" : " · 다시 만들어도 주소는 그대로예요"}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-1.5">
          {PAPER_SIZES.map((paper) => {
            const paths = pdfPaths(edition.id, edition.spec.kind, paper)
            return (
              <div key={paper} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Badge>{paper}</Badge>
                {KIND_PAGES[edition.spec.kind].map((page, index) => (
                  <a key={page} className="text-stone underline-offset-4 hover:text-ink hover:underline" href={paths[index]} target="_blank" rel="noreferrer">
                    {pageLabel(page)}
                  </a>
                ))}
                <button type="button" onClick={() => copy(paper, paths.join("\n"))} className="text-caption underline-offset-4 hover:text-ink hover:underline">
                  {copied === paper ? "복사했어요" : "주소 복사"}
                </button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
