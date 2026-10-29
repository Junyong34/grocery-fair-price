import { ChevronRight } from "lucide-react"
import Link from "next/link"

import { DOWNLOADS_COPY } from "@workspace/seasonal/data/copy"
import { editionName, featuredEdition } from "@workspace/seasonal/print/listing"
import { cn } from "@workspace/ui/lib/utils"

import { DOWNLOADS } from "@/shared/downloads-manifest"
import { routes } from "@/shared/routes"

import { EditionThumbnail } from "./edition-thumbnail"

/** 2a · 2b에서 내려받기 목록으로 가는 카드(1-a). 게시된 에디션이 없으면 그리지 않는다. */
export function DownloadsCard({ className }: { className?: string }) {
  const featured = featuredEdition(DOWNLOADS.editions)
  if (!featured) return null
  return (
    <Link
      href={routes.seasonal.downloads}
      className={cn("flex items-center gap-3.5 rounded-2xl border border-hairline bg-canvas p-3 pr-4 text-ink no-underline hover:border-gold-pale", className)}
    >
      {featured.thumbnails[0] && <EditionThumbnail thumbnail={featured.thumbnails[0]} name={editionName(featured)} className="w-11 shrink-0" />}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-semibold">{DOWNLOADS_COPY.entry.title}</span>
        <span className="text-[13px] text-stone">{DOWNLOADS_COPY.entry.hint}</span>
      </span>
      <ChevronRight aria-hidden size={18} className="shrink-0 text-caption" />
    </Link>
  )
}
