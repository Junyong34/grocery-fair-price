"use client"

import { overlay } from "overlay-kit"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { INFANT_PAIRING_COPY } from "@workspace/seasonal/data/copy"

import { PAIRING_REFERENCES } from "./data"

export function PairingEvidence({
  base,
  name,
  sign,
  selected,
  children,
}: {
  base: string
  name: string
  sign: "O" | "X"
  selected?: boolean
  children: React.ReactNode
}) {
  const milkConflict =
    (base === "우유" && ["고구마", "시금치"].includes(name)) ||
    (name === "우유" && ["고구마", "시금치"].includes(base))

  return (
    <button
      type="button"
      className="pairing-item"
      data-selected={selected || undefined}
      aria-label={`${base}와 ${name} 근거 보기`}
      onClick={() => {
        overlay.open(({ isOpen, close, unmount }) => (
          <Dialog
            open={isOpen}
            onOpenChange={(open) => {
              if (!open) {
                close()
                unmount()
              }
            }}
          >
            <DialogContent className="pairing-evidence-dialog max-h-[85dvh] overflow-y-auto">
              <DialogTitle className="font-heading">
                {base} + {name}
              </DialogTitle>
              <DialogDescription>
                {milkConflict
                  ? INFANT_PAIRING_COPY.conflict
                  : `원본의 ${base} 항목에서 ${name}은 ${sign}로 표시되어 있어요. ${INFANT_PAIRING_COPY.limit}`}
              </DialogDescription>
              {milkConflict && (
                <div className="grid gap-2 text-sm">
                  {[
                    base === "시금치" || name === "시금치"
                      ? PAIRING_REFERENCES.spinach
                      : PAIRING_REFERENCES.sweetPotato,
                    PAIRING_REFERENCES.milk,
                    PAIRING_REFERENCES.calcium,
                  ].map(({ title, href }) => (
                    <a key={href} href={href} className="underline">
                      {title}
                    </a>
                  ))}
                  <p className="text-caption">검토일 2026.11.07</p>
                </div>
              )}
              <DialogClose className="pairing-pill justify-self-end">
                닫기
              </DialogClose>
            </DialogContent>
          </Dialog>
        ))
      }}
    >
      {children}
    </button>
  )
}
