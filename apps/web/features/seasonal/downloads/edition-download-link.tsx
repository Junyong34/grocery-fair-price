import { DOWNLOADS_COPY } from "@workspace/seasonal/data/copy"
import type { ManifestEntry } from "@workspace/seasonal/print/edition"
import { megabytes } from "@workspace/seasonal/print/listing"
import { cn } from "@workspace/ui/lib/utils"

import { routes } from "@/shared/routes"

/** 에디션 PDF 내려받기 링크. 공개 용지는 A4 하나다. 주소는 저장소의 짧은 서명 링크로 넘긴다(ADR 0003). */
export function EditionDownloadLink({ edition, className }: { edition: ManifestEntry; className?: string }) {
  return (
    <a
      href={routes.seasonal.downloadFile(edition.id, "A4")}
      download
      className={cn("inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-ink px-5 text-[15px] font-semibold text-canvas no-underline", className)}
    >
      {DOWNLOADS_COPY.download}
      <span className="text-xs font-normal opacity-70">{megabytes(edition.files.A4.bytes)}</span>
    </a>
  )
}
