import { PRINT_KIND_LABELS, type PrintKind } from "@workspace/seasonal/print/spec"

import { KindMark } from "../components/kind-mark"
import { KIND_DESCRIPTIONS } from "../constants"
import type { EditionSummary } from "../types"
import { BOARD_COLUMNS } from "./columns"
import { EditionRow } from "./edition-row"

export function KindGroup({ kind, editions }: { kind: PrintKind; editions: readonly EditionSummary[] }) {
  const headingId = `kind-${kind}`
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <header className="flex items-center gap-3">
        <KindMark kind={kind} />
        <div className="flex flex-col gap-0.5">
          <h2 id={headingId} className="font-heading text-xl font-bold text-ink">
            {PRINT_KIND_LABELS[kind]} <span className="font-sans text-base font-normal text-caption tabular-nums">{editions.length}</span>
          </h2>
          <p className="text-sm text-stone">{KIND_DESCRIPTIONS[kind]}</p>
        </div>
      </header>
      {editions.length === 0 ? (
        <p className="rounded-2xl bg-hairline/50 px-5 py-4 text-sm text-stone">이 종류의 에디션이 없어요. “새 에디션”에서 만들 수 있어요.</p>
      ) : (
        <div role="table" aria-labelledby={headingId} className="overflow-hidden rounded-2xl bg-surface ring-1 ring-hairline">
          <div role="row" className={`hidden bg-hairline/60 px-5 py-2.5 text-[13px] font-semibold text-stone sm:grid ${BOARD_COLUMNS}`}>
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
