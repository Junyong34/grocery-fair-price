"use client"

import Link from "next/link"
import { overlay } from "overlay-kit"

import { Badge } from "@workspace/ui/components/badge"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { INFANT_PAIRING_COPY } from "@workspace/seasonal/data/copy"
import {
  explainInfantPairing,
  findPairingByName,
  pairingDisplayName,
} from "@workspace/seasonal/data/infant-pairings"

import { routes } from "@/shared/routes"

import { PAIRING_REFERENCES } from "./data"

function formatCaution(token: string): string {
  if (token === "milkAge") return INFANT_PAIRING_COPY.cautions.milkAge
  const [kind, names = ""] = token.split(":")
  switch (kind) {
    case "allergen":
      return INFANT_PAIRING_COPY.cautions.allergen(names)
    case "choking":
      return INFANT_PAIRING_COPY.cautions.choking(names)
    case "sodium":
      return INFANT_PAIRING_COPY.cautions.sodium(names)
    case "nitrate":
      return INFANT_PAIRING_COPY.cautions.nitrate(names)
    case "acidity":
      return INFANT_PAIRING_COPY.cautions.acidity(names)
    default:
      return token
  }
}

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
  return (
    <button
      type="button"
      className="pairing-item"
      data-selected={selected || undefined}
      aria-label={`${base}와 ${name} 근거 보기`}
      onClick={() => {
        const { kind, milkConflict, cautions } = explainInfantPairing(
          base,
          name,
          sign
        )
        const label = INFANT_PAIRING_COPY.verdictLabels[kind]
        // 상대 재료에도 궁합표가 있으면 그 페이지로 잇는다(지금 보는 기준 재료는 빼고).
        const partner = findPairingByName(name)
        const partnerRow = partner && partner.name !== base ? partner : undefined
        const description =
          kind === "good-general"
            ? INFANT_PAIRING_COPY.verdictDescriptions["good-general"](
                base,
                name
              )
            : INFANT_PAIRING_COPY.verdictDescriptions[kind]

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
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="font-heading">
                  {base} + {name}
                </DialogTitle>
                <Badge
                  size="sm"
                  className={
                    sign === "X" && !milkConflict
                      ? "bg-pair-gold text-pair-gold-foreground"
                      : "bg-pair-forest text-pair-forest-foreground"
                  }
                >
                  {label}
                </Badge>
              </div>
              <DialogDescription>{description}</DialogDescription>
              {cautions.length > 0 && (
                <div className="pairing-caution-box">
                  <strong className="text-sm font-semibold">
                    {INFANT_PAIRING_COPY.cautionTitle}
                  </strong>
                  <ul className="grid gap-1.5 text-sm">
                    {cautions.map((token) => (
                      <li key={token}>{formatCaution(token)}</li>
                    ))}
                  </ul>
                </div>
              )}
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
                </div>
              )}
              <p className="text-xs text-caption">{INFANT_PAIRING_COPY.limit}</p>
              <div className="pairing-dialog-actions">
                {partnerRow && (
                  <Link
                    href={routes.babyFood.ingredient(partnerRow.id)}
                    className="pairing-pill pairing-primary"
                    onClick={() => {
                      close()
                      unmount()
                    }}
                  >
                    {pairingDisplayName(partnerRow)} 궁합 보기
                  </Link>
                )}
                <DialogClose className="pairing-pill pairing-secondary">
                  닫기
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        ))
      }}
    >
      {children}
    </button>
  )
}
