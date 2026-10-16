import type { SelectorShape, SelectorTone } from "@workspace/ui/components/radio-group"
import type { SignatureShapeName } from "@workspace/ui/components/shape"

import type { EditionStatus } from "@workspace/seasonal/print/edition"
import type { PrintKind } from "@workspace/seasonal/print/spec"

// 인쇄물 어드민 화면이 함께 쓰는 상수. 종류 이름(PRINT_KIND_LABELS)과 글자 수 제한(EDITION_LIMITS)은 도메인에 있다.

/** 새 에디션을 고를 때와 목록 묶음 머리에 적는 종류별 한 줄 설명 */
export const KIND_DESCRIPTIONS: Record<PrintKind, string> = {
  monthly: "한 장에 한 달. 12개월을 담은 PDF 하나(표지는 고를 수 있어요)",
  "year-sheet": "한 장에 열두 달. 그림과 작은 달력이 짝을 이룬다",
  "season-poster": "봄·여름·가을·겨울 네 띠에 제철 품종",
  "month-poster": "열두 칸에 달마다 제철 품종. 날짜가 없다",
}

/** 종류마다 정한 모양과 색. 새 에디션 선택지와 목록 묶음 머리에 같은 것을 써서 한눈에 구분되게 한다. */
export type KindLook = {
  /** 크게 그리는 cojeev 시그니처 모양 */
  shape: SignatureShapeName
  /** 선택 표시(라디오) 모양 */
  selector: SelectorShape
  tone: SelectorTone
}

export const KIND_LOOKS: Record<PrintKind, KindLook> = {
  // 한 장 한 달: 종이 한 장
  monthly: { shape: "scalloped-square", selector: "rounded", tone: "pink" },
  // 열두 달이 한 장에: 한 해를 도는 해
  "year-sheet": { shape: "sunburst-24", selector: "circle", tone: "blue" },
  // 네 계절: 네 잎
  "season-poster": { shape: "clover-soft", selector: "leaf", tone: "olive" },
  // 열두 칸: 꽃잎 열둘
  "month-poster": { shape: "daisy-12", selector: "flower", tone: "yellow" },
}

export const EDITION_STATUS_LABELS: Record<EditionStatus, string> = { draft: "초안", published: "공개" }

/** 복사했다는 표시를 보여 주는 시간(ms) */
export const COPY_FEEDBACK_MS = 1200

/** 미리보기 용지를 그리는 최대 폭(px). iframe을 들어갈 칸 폭에 맞춰 줄인다. */
export const PREVIEW_MAX_WIDTH = 680
