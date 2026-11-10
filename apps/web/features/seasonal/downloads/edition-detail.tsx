import { DOWNLOADS_COPY } from "@workspace/seasonal/data/copy"
import type { ManifestEntry } from "@workspace/seasonal/print/edition"
import { editionMeta, editionName } from "@workspace/seasonal/print/listing"
import { PRINT_KIND_LABELS } from "@workspace/seasonal/print/spec"

import { EditionThumbnail, ThumbnailMat } from "@/shared/downloads/edition-thumbnail"
import { EditionActions } from "./edition-actions"

/**
 * 에디션 상세(3-B). 시트와 전체 페이지가 같이 쓴다. 미리보기(월간 달력은 표지와 1월) 아래에 정보와 버튼.
 * title을 넘기면 그 제목을 쓴다(전체 페이지의 h1). 시트는 시트 제목 줄이 제목을 보여 준다. 종류는 위의 표시가 보여 줘서 제목에 붙이지 않는다.
 */
export function EditionDetail({ edition, title, placement }: { edition: ManifestEntry; title?: React.ReactNode; placement: "sheet" | "page" }) {
  const name = editionName(edition)
  return (
    <div className="flex flex-col gap-5">
      {edition.thumbnails.length > 0 && (
        <ThumbnailMat className="gap-4 rounded-2xl bg-surface p-5 sm:p-6">
          {edition.thumbnails.map((thumbnail, index) => (
            <EditionThumbnail key={thumbnail.path} thumbnail={thumbnail} name={name} index={index} priority={index === 0} className="w-[140px] min-w-0 lg:w-[160px]" />
          ))}
        </ThumbnailMat>
      )}
      <div className="flex flex-col gap-5 rounded-2xl bg-surface p-5 sm:p-6">
        <div className="flex flex-col gap-2">
          <span className="self-start rounded-full bg-gold-wash px-3 py-1 text-xs text-gold-deep">{PRINT_KIND_LABELS[edition.kind]}</span>
          {title}
          <p className="flex flex-wrap gap-x-2 text-[13px] text-stone tabular-nums">
            {editionMeta(edition).map((part, index) => (
              <span key={part}>
                {index > 0 && <span aria-hidden className="me-2 text-caption">·</span>}
                {part}
              </span>
            ))}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {edition.description && <p className="text-[15px] leading-relaxed text-ink">{edition.description}</p>}
          <p className="text-sm leading-relaxed text-stone">{DOWNLOADS_COPY.free}</p>
        </div>
        <div className="flex flex-col gap-1 rounded-xl bg-canvas p-4 text-[13px] leading-relaxed text-stone">
          <p className="font-semibold text-ink">{DOWNLOADS_COPY.printTips.title}</p>
          <p>{DOWNLOADS_COPY.printTips.size}</p>
          {edition.kind === "monthly" && <p>{DOWNLOADS_COPY.printTips.oneMonth}</p>}
        </div>
        <EditionActions edition={edition} placement={placement} />
      </div>
    </div>
  )
}
