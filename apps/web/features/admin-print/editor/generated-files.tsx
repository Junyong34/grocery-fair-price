"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent } from "@workspace/ui/components/card"

import { downloadPath, type BuildRecord, type Edition, type StaleReason } from "@workspace/seasonal/print/edition"
import { papersForSpec, type Paper } from "@workspace/seasonal/print/spec"

import { useCopy } from "../hooks/use-copy"
import { downloadPattern } from "../lib/downloads"
import { formatBuildTime } from "../lib/format"

const STALE_LABEL: Record<StaleReason, { badge: string; note: string }> = {
  options: { badge: "옛 옵션", note: "이전 옵션으로 만든 파일이고" },
  foods: { badge: "옛 데이터", note: "바뀌기 전 품종 데이터로 만든 파일이고" },
}

/** staleBy가 있으면 옛 PDF다. 이유에 따라 배지와 설명을 고른다. */
export function GeneratedFiles({ edition, build, staleBy }: { edition: Edition; build: BuildRecord; staleBy: StaleReason | undefined }) {
  const stale = staleBy ? STALE_LABEL[staleBy] : undefined
  const { copied, copy } = useCopy<Paper>()
  const papers = papersForSpec(edition.spec)
  return (
    <Card className="!p-4">
      <CardContent className="gap-2 text-sm">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="font-heading text-base font-bold text-ink">만든 PDF</h3>
          <Badge variant={stale ? "yellow" : "olive-soft"}>{stale ? stale.badge : "최신"}</Badge>
          <span className="text-caption tabular-nums">{formatBuildTime(build.generatedAt)} 생성</span>
          <span className="text-stone">
            · 주소 <code className="rounded bg-hairline/60 px-1.5 py-0.5 text-[13px] text-ink">{downloadPattern(edition.id, papers)}</code>
            {stale ? ` · ${stale.note}, 다시 만들어도 주소는 그대로예요` : " · 다시 만들어도 주소는 그대로예요"}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-1.5">
          {papers.map((paper) => {
            const file = downloadPath(edition.id, paper)
            return (
              <div key={paper} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Badge>{paper}</Badge>
                <a className="text-stone underline-offset-4 hover:text-ink hover:underline" href={file} target="_blank" rel="noreferrer">
                  PDF 열기
                </a>
                <button type="button" onClick={() => copy(paper, file)} className="text-caption underline-offset-4 hover:text-ink hover:underline">
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
