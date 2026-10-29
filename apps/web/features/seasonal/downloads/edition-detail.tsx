import { DOWNLOADS_COPY } from "@workspace/seasonal/data/copy"
import type { ManifestEntry } from "@workspace/seasonal/print/edition"
import { editionMeta, editionName } from "@workspace/seasonal/print/listing"
import { PRINT_KIND_LABELS } from "@workspace/seasonal/print/spec"

import { ShareButton } from "../components/share-button"
import { EditionDownloadLink } from "./edition-download-link"
import { EditionThumbnail } from "./edition-thumbnail"

/**
 * 에디션 상세(3-B). 시트와 전체 페이지가 같이 쓴다. 미리보기(월간 달력은 표지와 1월) 아래에 정보와 버튼.
 * title을 넘기면 그 제목을 쓴다(전체 페이지의 h1). 시트는 시트 제목 줄이 이름을 보여 준다.
 */
export function EditionDetail({ edition, title }: { edition: ManifestEntry; title?: React.ReactNode }) {
  const name = editionName(edition)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        {edition.thumbnails.map((thumbnail, index) => (
          <EditionThumbnail key={thumbnail.path} thumbnail={thumbnail} name={name} index={index} priority={index === 0} className="w-[140px] lg:w-[160px]" />
        ))}
      </div>
      <div className="flex flex-col gap-1">
        <span className="self-start rounded-full bg-surface px-2.5 py-0.5 text-xs text-stone">{PRINT_KIND_LABELS[edition.kind]}</span>
        {title}
        <p className="flex flex-wrap gap-x-2 text-[13px] text-stone tabular-nums">
          {editionMeta(edition).map((part, index) => (
            <span key={part}>
              {index > 0 && <span aria-hidden className="mr-2 text-caption">·</span>}
              {part}
            </span>
          ))}
        </p>
      </div>
      {edition.description && <p className="text-[15px] leading-relaxed text-ink">{edition.description}</p>}
      <div className="rounded-xl bg-surface px-4 py-3 text-[13px] leading-relaxed text-stone">
        <p className="font-semibold text-ink">{DOWNLOADS_COPY.printTips.title}</p>
        <p>{DOWNLOADS_COPY.printTips.size}</p>
        {edition.kind === "monthly" && <p>{DOWNLOADS_COPY.printTips.oneMonth}</p>}
      </div>
      <div className="grid grid-cols-[1fr_2fr] gap-2">
        <ShareButton label={DOWNLOADS_COPY.share} className="h-11" />
        <EditionDownloadLink edition={edition} />
      </div>
    </div>
  )
}
