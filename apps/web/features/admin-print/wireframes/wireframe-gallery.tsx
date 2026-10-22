import { Badge } from "@workspace/ui/components/badge"

import { PRINT_KIND_LABELS, PRINT_KINDS } from "@workspace/seasonal/print/spec"

import { wireframesOf, type WireframeEntry } from "../lib/wireframe-catalog"
import { sheetOf } from "../lib/wireframe-shapes"
import { Wireframe } from "./wireframe"

// /admin/wireframes: 와이어프레임 안을 종류별로 모아 본다. 세로·가로는 같은 축척(세로 용지 폭 기준)으로 그린다.

const PORTRAIT_WIDTH = 200

export function WireframeGallery() {
  return (
    <div className="flex flex-col gap-14">
      {PRINT_KINDS.map((kind) => (
        <section key={kind} aria-labelledby={`wireframes-${kind}`} className="flex flex-col gap-5">
          <h2 id={`wireframes-${kind}`} className="border-t-2 border-ink pt-3 font-heading text-2xl font-bold">
            {PRINT_KIND_LABELS[kind]}
          </h2>
          <EntryGrid entries={wireframesOf(kind, "sheet")} />
          {wireframesOf(kind, "cover").length > 0 && (
            <>
              <h3 className="font-heading text-lg font-bold">표지</h3>
              <EntryGrid entries={wireframesOf(kind, "cover")} />
            </>
          )}
        </section>
      ))}
    </div>
  )
}

function EntryGrid({ entries }: { entries: readonly WireframeEntry[] }) {
  return (
    <div className="grid grid-flow-row-dense grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
      {entries.map((entry) => (
        <EntryCard key={entry.code} entry={entry} />
      ))}
    </div>
  )
}

function EntryCard({ entry }: { entry: WireframeEntry }) {
  const available = entry.availability.status === "available"
  return (
    <article className={`flex flex-col gap-4 rounded-2xl border border-hairline bg-surface p-5 ${entry.orientations.length > 1 ? "md:col-span-2" : ""}`}>
      <div className="flex flex-wrap items-end gap-4">
        {entry.orientations.map((orientation) => (
          <figure key={orientation} className="m-0 flex max-w-full flex-col gap-1" style={{ width: (PORTRAIT_WIDTH * sheetOf(orientation).width) / sheetOf("portrait").width }}>
            <Wireframe entry={entry} orientation={orientation} />
            <figcaption className="text-xs text-caption">{orientation === "portrait" ? "세로" : "가로"}</figcaption>
          </figure>
        ))}
      </div>
      <div className="flex flex-col gap-1.5 text-sm">
        <h3 className="font-heading text-base font-bold text-balance">
          <span className="mr-1.5 font-mono text-sm font-medium text-caption">{entry.code}</span>
          {entry.title}
        </h3>
        <p className="text-xs text-caption">출처 {entry.source}</p>
        <p className="text-pretty text-stone">{entry.summary}</p>
        <p className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant={available ? "olive-soft" : "yellow"}>{available ? "현재 옵션으로 가능" : "새 옵션 필요"}</Badge>
          <code className="text-xs break-all text-stone">{entry.availability.options}</code>
        </p>
      </div>
    </article>
  )
}
