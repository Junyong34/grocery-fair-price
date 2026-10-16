import type { SignatureShapeName } from "@workspace/ui/components/shape"
import type { SelectorShape, SelectorTone } from "@workspace/ui/components/radio-group"

import type { PrintKind } from "@workspace/seasonal/print/spec"

/** 인쇄물 종류마다 정한 모양과 색. 새 에디션 선택지와 목록 묶음 머리에 같은 것을 써서 한눈에 구분되게 한다. */
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
