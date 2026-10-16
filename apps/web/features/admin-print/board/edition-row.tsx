import { Pencil } from "lucide-react"
import Link from "next/link"

import { Button } from "@workspace/ui/components/button"

import { routes } from "@/shared/routes"

import { DeleteEditionButton } from "../components/delete-edition-button"
import { EditionId } from "../components/edition-id"
import { Status } from "../components/status"
import { EDITION_STATUS_LABELS } from "../constants"
import type { EditionSummary } from "../types"
import { BOARD_COLUMNS } from "./columns"

/** 에디션 한 줄: 이름·id | 공개 | PDF | 삭제·편집. 행 어디를 눌러도 편집으로 간다(이름 링크가 행을 덮는다). */
export function EditionRow({ edition }: { edition: EditionSummary }) {
  const href = routes.admin.edition(edition.id)
  return (
    <div role="row" className={`group relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 px-5 py-4 transition-colors hover:bg-canvas ${BOARD_COLUMNS}`}>
      <div role="cell" className="col-span-2 flex min-w-0 flex-col items-start gap-1.5 sm:col-span-1">
        <Link href={href} className="max-w-full truncate font-heading text-lg leading-tight font-bold text-ink no-underline after:absolute after:inset-0 after:content-[''] group-hover:underline group-hover:underline-offset-4">
          {edition.title}
        </Link>
        {/* 덮개 링크 위로 올려 따로 누를 수 있게 한다. */}
        <EditionId id={edition.id} className="relative z-10 group-hover:bg-surface" />
      </div>
      <div role="cell">
        <Status tone={edition.status === "published" ? "ok" : "idle"}>{EDITION_STATUS_LABELS[edition.status]}</Status>
      </div>
      <div role="cell">
        <Status tone={edition.generatedAt ? "ok" : "warn"}>{edition.generatedAt ? `${edition.generatedAt.slice(5)} 생성` : "생성 필요"}</Status>
      </div>
      <div role="cell" className="relative z-10 col-span-2 flex items-center justify-end gap-2 sm:col-span-1">
        <DeleteEditionButton id={edition.id} title={edition.title} from="list" />
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
