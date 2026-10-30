"use client"

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

import { cleanStorage, previewCleanup } from "../server/actions"

// 내리거나 지운 에디션의 R2 객체는 바로 지우지 않는다(lib/publish.ts). 운영 배포가 끝난 뒤 여기서 한꺼번에 지운다.
export function CleanStorageButton() {
  const [open, setOpen] = useState(false)
  const [keys, setKeys] = useState<string[]>()
  const [deleted, setDeleted] = useState<number>()
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()

  const load = (next: boolean) => {
    setOpen(next)
    if (!next) return
    setKeys(undefined)
    setDeleted(undefined)
    setError(undefined)
    startTransition(async () => {
      const result = await previewCleanup()
      if (result.ok) setKeys(result.data)
      else setError(result.error)
    })
  }

  const clean = () =>
    startTransition(async () => {
      const result = await cleanStorage(keys ?? [])
      if (!result.ok) return setError(result.error)
      setDeleted(result.data.length)
      setKeys([])
    })

  return (
    <Dialog open={open} onOpenChange={load}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="self-start">
          R2 정리
        </Button>
      </DialogTrigger>
      <DialogContent appearance="confirmation" className="bg-canvas">
        <DialogHeader>
          <DialogTitle>R2에서 안 쓰는 PDF를 지울까요?</DialogTitle>
          <DialogDescription>
            내리거나 지운 에디션의 PDF예요. 운영 배포가 끝난 뒤에 지우세요. 배포 전에 지우면 그동안 운영의 내려받기가 깨져요.
          </DialogDescription>
        </DialogHeader>
        {pending && keys === undefined && <p className="text-sm text-stone">R2 목록을 읽는 중…</p>}
        {deleted !== undefined && <p className="text-sm text-ink">{deleted}개를 지웠어요.</p>}
        {keys && keys.length === 0 && deleted === undefined && <p className="text-sm text-stone">지울 PDF가 없어요.</p>}
        {keys && keys.length > 0 && (
          <ul aria-label="지울 객체" className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-xl bg-surface px-4 py-3 font-mono text-[13px] break-all text-ink">
            {keys.map((key) => (
              <li key={key}>{key}</li>
            ))}
          </ul>
        )}
        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {deleted === undefined ? "취소" : "닫기"}
            </Button>
          </DialogClose>
          {deleted === undefined && (
            <Button type="button" variant="danger" onClick={clean} disabled={pending || !keys?.length}>
              {pending && keys ? "지우는 중…" : `${keys?.length ?? 0}개 지우기`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
