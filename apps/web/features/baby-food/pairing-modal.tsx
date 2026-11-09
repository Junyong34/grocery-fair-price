"use client"

import { useRouter } from "next/navigation"
import { overlay } from "overlay-kit"
import { useEffect, useRef, useState } from "react"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { routes } from "@/shared/routes"

type Sheet = {
  title: string
  names: readonly string[]
  content: React.ReactNode
}

export function PairingModalRoute({ sheets }: { sheets: readonly Sheet[] }) {
  const router = useRouter()

  useEffect(() => {
    const id = overlay.open(({ isOpen }) => (
      <PairingModal
        open={isOpen}
        onClose={() => router.back()}
        sheets={sheets}
      />
    ))
    return () => overlay.unmount(id)
  }, [router, sheets])

  return null
}

function PairingModal({
  open,
  onClose,
  sheets,
}: {
  open: boolean
  onClose: () => void
  sheets: readonly Sheet[]
}) {
  // 오버레이가 브라우저에서 열린 뒤 화면 폭에 맞춰 시작 장을 정한다.
  const [page, setPage] = useState(() =>
    window.matchMedia("(max-width: 520px)").matches ? 1 : 0
  )
  const scroll = useRef<HTMLDivElement>(null)
  const sheet = sheets[page - 1]

  function show(next: number) {
    setPage(next)
    if (scroll.current) scroll.current.scrollTop = 0
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <DialogContent className="pairing-dialog !w-[min(960px,calc(100%-24px))] !p-0">
        <div className="pairing-dialog-head">
          <div className="pairing-intro">
            <DialogTitle className="font-heading">전체 궁합표</DialogTitle>
            <DialogClose className="pairing-pill">닫기</DialogClose>
          </div>
          <DialogDescription className="!text-sm">
            원본 O·X 목록을 세 장으로 나눴어요.
          </DialogDescription>
          <div className="pairing-controls mt-3" aria-label="궁합표 장 선택">
            <button
              type="button"
              className="pairing-pill"
              aria-pressed={page === 0}
              onClick={() => show(0)}
            >
              전체 구성
            </button>
            {sheets.map((item, index) => (
              <button
                type="button"
                className="pairing-pill"
                key={item.title}
                aria-pressed={page === index + 1}
                onClick={() => show(index + 1)}
              >
                {index + 1}장
              </button>
            ))}
          </div>
        </div>
        <div ref={scroll} className="pairing-dialog-scroll">
          {sheet ? (
            <>
              <h3 className="font-heading text-lg" aria-live="polite">
                {page}장 · {sheet.title}
              </h3>
              {sheet.content}
            </>
          ) : (
            <div className="pairing-covers">
              {sheets.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  className="pairing-cover"
                  onClick={() => show(index + 1)}
                >
                  <span className="text-sm text-olive">
                    {index + 1}장 · 재료 {item.names.length}개
                  </span>
                  <strong className="font-heading text-xl">{item.title}</strong>
                  <span className="text-sm text-stone">
                    {item.names.join(" · ")}
                  </span>
                  <span className="text-sm text-forest">이 장 펼치기 →</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="pairing-dialog-foot">
          <button
            type="button"
            className="pairing-pill"
            onClick={() => window.location.assign(routes.babyFood.pairings)}
          >
            전체 페이지로 보기 ↗
          </button>
          {sheet && (
            <div className="pairing-controls">
              <button
                type="button"
                className="pairing-pill"
                disabled={page === 1}
                onClick={() => show(page - 1)}
              >
                이전
              </button>
              <span className="text-sm" aria-live="polite">
                {page} / {sheets.length}
              </span>
              <button
                type="button"
                className="pairing-pill"
                disabled={page === sheets.length}
                onClick={() => show(page + 1)}
              >
                다음
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
