import { downloadPath } from "@workspace/seasonal/print/edition"
import { KIND_PAGES, type Paper, type PrintKind } from "@workspace/seasonal/print/spec"

// 편집기의 작업 순서: ① 옵션 저장 → ② PDF 만들기. 지금 어디까지 왔고 무엇을 해야 하는지만 계산한다.
// 공개 여부는 단계가 아니다. 관리자는 PDF 파일명 규칙(downloadPath)으로 링크를 건다.

export type EditionFlowInput = {
  /** 저장하지 않은 변경이 있다. */
  dirty: boolean
  /** 옵션에 오류가 있어 저장할 수 없다. */
  invalid: boolean
  /** 만든 PDF가 한 번이라도 있다. */
  hasBuild: boolean
  /** 저장된 옵션과 만든 PDF가 다르다(PDF가 없을 때도 true). */
  stale: boolean
}

export type StepState =
  | { state: "done" }
  | { state: "current"; action?: "generate" | "regenerate" }
  | { state: "locked"; reason: string }

/** unsaved: 저장 필요 · no-pdf: 첫 PDF 필요 · outdated: 옛 옵션 PDF · done: 최신 PDF */
export type EditionPhase = "unsaved" | "no-pdf" | "outdated" | "done"

export type EditionFlow = {
  phase: EditionPhase
  save: StepState
  pdf: StepState
  /** 지금 할 일을 한 줄로. */
  hint: string
}

export function editionFlow({ dirty, invalid, hasBuild, stale }: EditionFlowInput): EditionFlow {
  if (dirty)
    return {
      phase: "unsaved",
      save: invalid ? { state: "locked", reason: "옵션의 오류를 먼저 고치세요" } : { state: "current" },
      pdf: { state: "locked", reason: "먼저 저장하세요" },
      hint: hasBuild ? "옵션을 바꿨어요. 저장한 뒤 PDF를 다시 만들어야 반영돼요. 만들어 둔 PDF는 그대로예요." : "옵션을 바꿨어요. 저장하면 PDF를 만들 수 있어요.",
    }
  if (!hasBuild) return { phase: "no-pdf", save: { state: "done" }, pdf: { state: "current", action: "generate" }, hint: "저장했어요. 이제 PDF를 만드세요." }
  if (stale)
    return {
      phase: "outdated",
      save: { state: "done" },
      pdf: { state: "current", action: "regenerate" },
      hint: "만들어 둔 PDF는 이전 옵션으로 만든 거예요. 다시 만들면 같은 주소의 파일이 새 옵션으로 바뀌어요.",
    }
  return { phase: "done", save: { state: "done" }, pdf: { state: "done" }, hint: "끝났어요. 아래 주소로 링크를 걸면 돼요." }
}

/** 한 용지의 PDF 주소를 쪽 순서대로. 파일명 규칙은 downloadPath 하나뿐이다. */
export function pdfPaths(id: string, kind: PrintKind, paper: Paper): string[] {
  return KIND_PAGES[kind].map((page) => downloadPath(id, paper, page))
}
