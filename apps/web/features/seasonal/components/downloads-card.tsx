import { ChevronRight } from "lucide-react"

import { DOWNLOADS_COPY } from "@workspace/seasonal/data/copy"
import { editionName, featuredEdition } from "@workspace/seasonal/print/listing"
import { cn } from "@workspace/ui/lib/utils"

import { TrackedLink } from "@/shared/analytics/tracked-link"
import { DOWNLOADS } from "@/shared/downloads-manifest"
import { routes } from "@/shared/routes"

import { EditionThumbnail, ThumbnailMat } from "./edition-thumbnail"

/** 2a · 2b에서 내려받기 목록으로 가는 카드(1-a). 게시된 에디션이 없으면 그리지 않는다. */
export function DownloadsCard({ placement, className }: { placement: "this-month" | "month-timeline"; className?: string }) {
  const featured = featuredEdition(DOWNLOADS.editions)
  if (!featured) return null
  return (
    <TrackedLink
      href={routes.seasonal.downloads}
      eventName="print_entry_click"
      eventParams={{ placement }}
      className={cn("flex items-center gap-3.5 rounded-2xl border border-hairline bg-canvas p-3 pr-4 text-ink no-underline hover:border-gold-pale", className)}
    >
      {/* 받침 폭은 375에서 안내 문구가 한 줄에 드는 44px까지 */}
      {featured.thumbnails[0] && (
        <ThumbnailMat className="aspect-[4/5] w-11 shrink-0 rounded-lg p-1">
          <EditionThumbnail thumbnail={featured.thumbnails[0]} name={editionName(featured)} className="max-h-full w-auto max-w-full" />
        </ThumbnailMat>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-semibold">{DOWNLOADS_COPY.entry.title}</span>
        <span className="text-[13px] text-stone">{DOWNLOADS_COPY.entry.hint}</span>
      </span>
      <ChevronRight aria-hidden size={18} className="shrink-0 text-caption" />
    </TrackedLink>
  )
}
