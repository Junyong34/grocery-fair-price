export type BuildState = "none" | "stale" | "current"

export type EditionFlowInput = {
  dirty: boolean
  invalid: boolean
  build: BuildState
}

export type StepState =
  | { state: "done" }
  | { state: "current"; action?: "generate" | "regenerate" }
  | { state: "locked"; reason: string }

export type EditionPhase = "unsaved" | "no-pdf" | "outdated" | "done"

export type EditionFlow = {
  phase: EditionPhase
  save: StepState
  pdf: StepState
  hint: string
}

export function editionFlow({ dirty, invalid, build }: EditionFlowInput): EditionFlow {
  if (dirty)
    return {
      phase: "unsaved",
      save: invalid ? { state: "locked", reason: "옵션의 오류를 먼저 고치세요" } : { state: "current" },
      pdf: { state: "locked", reason: "먼저 저장하세요" },
      hint: build !== "none" ? "옵션을 바꿨어요. 저장한 뒤 PDF를 다시 만들어야 반영돼요. 만들어 둔 PDF는 그대로예요." : "옵션을 바꿨어요. 저장하면 PDF를 만들 수 있어요.",
    }
  if (build === "none") return { phase: "no-pdf", save: { state: "done" }, pdf: { state: "current", action: "generate" }, hint: "저장했어요. 이제 PDF를 만드세요." }
  if (build === "stale")
    return {
      phase: "outdated",
      save: { state: "done" },
      pdf: { state: "current", action: "regenerate" },
      hint: "만들어 둔 PDF는 이전 옵션으로 만든 거예요. 다시 만들면 같은 주소의 파일이 새 옵션으로 바뀌어요.",
    }
  return { phase: "done", save: { state: "done" }, pdf: { state: "done" }, hint: "끝났어요. 아래 주소로 링크를 걸면 돼요." }
}
