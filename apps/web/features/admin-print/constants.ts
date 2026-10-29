import type { SelectorShape, SelectorTone } from "@workspace/ui/components/radio-group"
import type { SignatureShapeName } from "@workspace/ui/components/shape"

import type { EditionStatus } from "@workspace/seasonal/print/edition"
import type { PrintKind } from "@workspace/seasonal/print/spec"

export const KIND_DESCRIPTIONS: Record<PrintKind, string> = {
  monthly: "한 장에 한 달. 12개월을 담은 PDF 하나(표지는 고를 수 있어요)",
  "year-sheet": "한 장에 열두 달. 그림과 작은 달력이 짝을 이룬다",
  "season-poster": "봄·여름·가을·겨울 네 띠에 제철 품종",
  "month-poster": "열두 칸에 달마다 제철 품종. 날짜가 없다",
}

export type KindLook = {
  shape: SignatureShapeName
  selector: SelectorShape
  tone: SelectorTone
}

export const KIND_LOOKS: Record<PrintKind, KindLook> = {
  monthly: { shape: "scalloped-square", selector: "rounded", tone: "pink" },
  "year-sheet": { shape: "sunburst-24", selector: "circle", tone: "blue" },
  "season-poster": { shape: "clover-soft", selector: "leaf", tone: "olive" },
  "month-poster": { shape: "daisy-12", selector: "flower", tone: "yellow" },
}

export const EDITION_STATUS_LABELS: Record<EditionStatus, string> = { draft: "초안", published: "공개", withdrawn: "내림" }

export const COPY_FEEDBACK_MS = 1200

export const PREVIEW_MAX_WIDTH = 680
