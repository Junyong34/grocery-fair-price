import { ChevronRight } from "lucide-react"

import type { ManifestEntry } from "@workspace/seasonal/print/edition"
import type { PrintKind } from "@workspace/seasonal/print/spec"
import { DOWNLOADS_COPY } from "@workspace/seasonal/data/copy"
import { editionName, featuredEdition, replacementFor } from "@workspace/seasonal/print/listing"
import { cn } from "@workspace/ui/lib/utils"

import type { AnalyticsEvents } from "@/shared/analytics/events"
import { TrackedLink } from "@/shared/analytics/tracked-link"
import { EditionThumbnail, ThumbnailMat } from "@/shared/downloads/edition-thumbnail"
import { DOWNLOADS } from "@/shared/downloads-manifest"
import { routes } from "@/shared/routes"

type Placement = AnalyticsEvents["print_entry_click"]["placement"]

/** 2a · 2b · P1 시세 메인에서 내려받기 목록으로 가는 카드(1-a). 게시된 에디션이 없으면 그리지 않는다. */
export function DownloadsCard({ placement, className }: { placement: Placement; className?: string }) {
  const featured = featuredEdition(DOWNLOADS.editions)
  if (!featured) return null
  return (
    <EntryCard
      href={routes.seasonal.downloads}
      edition={featured}
      title={DOWNLOADS_COPY.entry.title}
      placement={placement}
      className={className}
    />
  )
}

/** 이유식 궁합표·과일 도감처럼 인쇄물이 따로 있는 화면에서 그 종류의 최신 에디션 상세로 가는 카드. 게시된 것이 없으면 그리지 않는다. */
export function EditionCard({ kind, placement, className }: { kind: PrintKind; placement: Placement; className?: string }) {
  const edition = replacementFor({ kind }, DOWNLOADS.editions)
  if (!edition) return null
  return (
    <EntryCard
      href={routes.seasonal.download(edition.id)}
      edition={edition}
      title={`${editionName(edition)} PDF`}
      placement={placement}
      className={className}
    />
  )
}

function EntryCard({ href, edition, title, placement, className }: { href: string; edition: ManifestEntry; title: string; placement: Placement; className?: string }) {
  return (
    <TrackedLink
      href={href}
      eventName="print_entry_click"
      eventParams={{ placement }}
      className={cn("flex items-center gap-3.5 rounded-2xl border border-hairline bg-pair-light p-3 pr-4 text-pair-light-foreground no-underline hover:border-gold-pale", className)}
    >
      {/* 받침 폭은 375에서 안내 문구가 한 줄에 드는 44px까지 */}
      {edition.thumbnails[0] && (
        <ThumbnailMat className="aspect-[4/5] w-11 shrink-0 rounded-lg p-1">
          <EditionThumbnail thumbnail={edition.thumbnails[0]} name={editionName(edition)} className="max-h-full w-auto max-w-full" />
        </ThumbnailMat>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-semibold">{title}</span>
        <span className="text-[13px] text-stone">{DOWNLOADS_COPY.entry.hint}</span>
      </span>
      <ChevronRight aria-hidden size={18} className="shrink-0 text-caption" />
    </TrackedLink>
  )
}
