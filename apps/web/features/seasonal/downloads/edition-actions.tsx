"use client"

import { Check } from "lucide-react"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"

import { DOWNLOADS_COPY } from "@workspace/seasonal/data/copy"
import type { ManifestEntry } from "@workspace/seasonal/print/edition"
import { downloadFileName, megabytes } from "@workspace/seasonal/print/listing"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { routes } from "@/shared/routes"

import { copyPageLink, ShareButton, sharePage } from "../components/share-button"
import { requestA3, useA3Requested } from "../stores/a3-request-store"

const noop = () => () => {}
/** 공유 시트가 있는 브라우저인지. 서버와 하이드레이션 때는 없다고 본다. */
const useCanShare = () => useSyncExternalStore(noop, () => typeof navigator.share === "function", () => false)

/**
 * 상세의 버튼 줄(3-B)과 내려받은 뒤 상태(5-a). 공유하는 것은 에디션 페이지 주소다(PDF 주소가 아니다).
 * 휴대폰으로 받은 사람은 PC에서 인쇄하는 경우가 많아, 받은 뒤에 링크 보내기를 앞에 둔다.
 */
export function EditionActions({ edition }: { edition: ManifestEntry }) {
  const [done, setDone] = useState(false)
  const canShare = useCanShare()
  const doneRef = useRef<HTMLDivElement>(null)
  // 시트 아래쪽에서 바뀌므로 바뀐 자리가 보이게 한다.
  useEffect(() => {
    if (done) doneRef.current?.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })
  }, [done])
  const link = (className: string, label: React.ReactNode) => (
    <a
      href={routes.seasonal.downloadFile(edition.id, "A4")}
      download={downloadFileName(edition, "A4")}
      onClick={() => setDone(true)}
      className={className}
    >
      {label}
    </a>
  )

  return (
    <div className="flex flex-col gap-3">
      {done ? (
        <div ref={doneRef} role="status" className="flex scroll-mb-6 flex-col gap-3">
          <div>
            <p className="flex items-center gap-1.5 font-heading text-xl font-bold text-ink">
              {DOWNLOADS_COPY.done.title}
              <Check aria-hidden size={20} className="text-olive" />
            </p>
            <p className="text-[13px] text-stone">{DOWNLOADS_COPY.done.where}</p>
          </div>
          <div className="rounded-xl bg-surface px-4 py-3 text-[13px] leading-relaxed text-stone">
            <p className="font-semibold text-ink">{DOWNLOADS_COPY.done.pcTitle}</p>
            <p>{DOWNLOADS_COPY.done.pcBody}</p>
          </div>
          <div className={cn("grid gap-2", canShare && "grid-cols-2")}>
            <Button variant="outline" className="h-11" onClick={() => void copyPageLink()}>
              {DOWNLOADS_COPY.done.copyLink}
            </Button>
            {canShare && (
              <Button variant="outline" className="h-11" onClick={() => void sharePage()}>
                {DOWNLOADS_COPY.done.share}
              </Button>
            )}
          </div>
          {link("self-center text-sm text-stone underline underline-offset-4", DOWNLOADS_COPY.done.again)}
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_2fr] gap-2">
          <ShareButton label={DOWNLOADS_COPY.share} className="h-11" />
          {link(
            "inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-ink px-5 text-[15px] font-semibold text-canvas no-underline",
            <>
              {DOWNLOADS_COPY.download}
              <span className="text-xs font-normal opacity-70">{megabytes(edition.files.A4.bytes)}</span>
            </>,
          )}
        </div>
      )}
      <A3Request id={edition.id} />
    </div>
  )
}

/** A3 수요 확인. 누르면 고마움 문구로 바뀐다. 이벤트 전송은 08(GA4). */
function A3Request({ id }: { id: string }) {
  const requested = useA3Requested(id)
  if (requested) return <p className="text-center text-xs text-caption">{DOWNLOADS_COPY.a3.thanks}</p>
  return (
    <button type="button" onClick={() => requestA3(id)} className="self-center text-xs text-caption underline underline-offset-4 hover:text-stone">
      {DOWNLOADS_COPY.a3.ask}
    </button>
  )
}
