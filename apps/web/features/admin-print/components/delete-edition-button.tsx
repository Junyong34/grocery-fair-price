"use client"

import { Trash2 } from "lucide-react"
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

import { deleteEdition } from "../server/actions"

type Props = {
  id: string
  title: string
  trigger: "icon" | "text"
  onDeleted?: () => void
}

export function DeleteEditionButton({ id, title, trigger, onDeleted }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()

  const remove = () =>
    startTransition(async () => {
      const result = await deleteEdition(id)
      if (!result.ok) return setError(result.error)
      setOpen(false)
      onDeleted?.()
    })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger === "icon" ? <IconTrigger title={title} /> : <TextTrigger />}
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

function IconTrigger({ title }: { title: string }) {
  return (
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
  )
}

function TextTrigger() {
  return (
    <DialogTrigger asChild>
      <Button type="button" variant="ghost" size="sm" className="text-error">
        삭제
      </Button>
    </DialogTrigger>
  )
}
