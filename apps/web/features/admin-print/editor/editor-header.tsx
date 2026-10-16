"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"

import { EDITION_LIMITS, type Edition } from "@workspace/seasonal/print/edition"
import { PRINT_KIND_LABELS } from "@workspace/seasonal/print/spec"

import { DeleteEditionButton } from "../components/delete-edition-button"
import { EditionId } from "../components/edition-id"
import { Status } from "../components/status"
import { EDITION_STATUS_LABELS } from "../constants"

type Props = {
  draft: Edition
  /** 삭제 확인 창에는 저장된 이름을 쓴다. */
  savedTitle: string
  onTitleChange: (title: string) => void
}

/** 편집기 머리: 종류·공개 상태·id, 제목처럼 보이는 이름 칸, 삭제 */
export function EditorHeader({ draft, savedTitle, onTitleChange }: Props) {
  return (
    <>
      <dl className="flex flex-wrap gap-x-8 gap-y-3 self-start rounded-2xl bg-surface px-5 py-3">
        <Meta label="종류">
          <Badge>{PRINT_KIND_LABELS[draft.spec.kind]}</Badge>
        </Meta>
        <Meta label="공개 상태">
          <Status tone={draft.status === "published" ? "ok" : "idle"}>{EDITION_STATUS_LABELS[draft.status]}</Status>
        </Meta>
        <Meta label="id · 다운로드 주소에 쓰여요">
          <EditionId id={draft.id} />
        </Meta>
      </dl>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <Input
          aria-label="에디션 이름"
          value={draft.title}
          maxLength={EDITION_LIMITS.title}
          onChange={(event) => onTitleChange(event.target.value)}
          className="admin-title !h-auto min-w-[16rem] flex-1 !rounded-none !px-0 font-heading !text-4xl font-bold tracking-tight"
        />
        <DeleteEditionButton id={draft.id} title={savedTitle} from="editor" />
      </div>
    </>
  )
}

/** 이름표 붙은 정보 한 칸. 값이 무슨 정보인지 위에 적는다. */
function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <dt className="text-xs text-caption">{label}</dt>
      <dd className="flex min-h-7 items-center">{children}</dd>
    </div>
  )
}
