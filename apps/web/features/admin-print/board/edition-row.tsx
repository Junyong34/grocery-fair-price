import { Pencil } from "lucide-react"
import Link from "next/link"

import { Button } from "@workspace/ui/components/button"

import { routes } from "@/shared/routes"

import { DeleteEditionButton } from "../components/delete-edition-button"
import { EditionId } from "../components/edition-id"
import { Status } from "../components/status"
import { EDITION_STATUS_LABELS } from "../constants"
import type { EditionSummary } from "../types"
import { ABOVE_ROW_LINK, BOARD_COLUMNS, ROW_LINK } from "./columns"

export function EditionRow({ edition }: { edition: EditionSummary }) {
  const href = routes.admin.edition(edition.id)
  return (
    <div role="row" className={`group relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 px-5 py-4 transition-colors hover:bg-canvas ${BOARD_COLUMNS}`}>
      <div role="cell" className="col-span-2 flex min-w-0 flex-col items-start gap-1.5 sm:col-span-1">
        <Link href={href} className={`max-w-full truncate font-heading text-lg leading-tight font-bold text-ink no-underline ${ROW_LINK} group-hover:underline group-hover:underline-offset-4`}>
          {edition.title}
        </Link>
        <EditionId id={edition.id} className={`${ABOVE_ROW_LINK} group-hover:bg-surface`} />
      </div>
      <div role="cell">
        <Status tone={edition.status === "published" ? "ok" : "idle"}>{EDITION_STATUS_LABELS[edition.status]}</Status>
      </div>
      <div role="cell">
        <Status tone={edition.currentBuildDate ? "ok" : "warn"}>{edition.currentBuildDate ? `${edition.currentBuildDate.slice(5)} 생성` : "생성 필요"}</Status>
      </div>
      <div role="cell" className={`${ABOVE_ROW_LINK} col-span-2 flex items-center justify-end gap-2 sm:col-span-1`}>
        <DeleteEditionButton id={edition.id} title={edition.title} trigger="icon" />
        <Button asChild size="sm" className="!h-9 gap-1.5">
          <Link href={href}>
            <Pencil aria-hidden size={14} strokeWidth={2} />
            편집하기
          </Link>
        </Button>
      </div>
    </div>
  )
}
