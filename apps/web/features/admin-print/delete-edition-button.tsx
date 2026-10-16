"use client"

import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip"

import { routes } from "@/shared/routes"

import { deleteEdition } from "./actions"

/** 에디션 삭제. 확인 창을 거친다. 편집기에서 지우면 목록으로 돌아간다. */
export function DeleteEditionButton({ id, title, from }: { id: string; title: string; from: "list" | "editor" }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()

  const remove = () =>
    startTransition(async () => {
      const result = await deleteEdition(id)
      if (result.error) return setError(result.error)
      setOpen(false)
      // 목록은 요청마다 파일을 읽지만 클라이언트 라우터 캐시가 지운 항목을 보여 줄 수 있어 새로 받는다.
      if (from === "editor") router.push(routes.admin.root)
      router.refresh()
    })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {from === "list" ? (
        // 목록 행: 편집하기와 같은 높이의 테두리 아이콘 버튼. 이름은 툴팁과 aria-label로 준다.
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <button
                type="button"
                aria-label={`“${title}” 삭제`}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-error ring-1 ring-silver ring-inset transition-colors hover:bg-error/10 hover:ring-error/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                <Trash2 aria-hidden size={16} strokeWidth={1.8} />
              </button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>삭제</TooltipContent>
        </Tooltip>
      ) : (
        // 편집기 머리: 글자만 빨간 링크처럼 보이지 않게, 목록 행과 같은 테두리 버튼으로 둔다.
        <DialogTrigger asChild>
          <button
            type="button"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-surface px-4 text-sm text-error ring-1 ring-silver ring-inset transition-colors hover:bg-error/10 hover:ring-error/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <Trash2 aria-hidden size={16} strokeWidth={1.8} />
            삭제
          </button>
        </DialogTrigger>
      )}
      <DialogContent appearance="confirmation" className="bg-canvas">
        <DialogHeader>
          <DialogTitle>“{title}” 에디션을 지울까요?</DialogTitle>
          <DialogDescription>사양 파일과 이 컴퓨터에 만든 PDF가 모두 지워져요. 되돌릴 수 없어요.</DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              취소
            </Button>
          </DialogClose>
          <Button type="button" variant="danger" onClick={remove} disabled={pending}>
            {pending ? "지우는 중…" : "삭제"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
