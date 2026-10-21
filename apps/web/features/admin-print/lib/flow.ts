import { isBuildCurrent, type BuildRecord, type Edition } from "@workspace/seasonal/print/edition"
import { parsePrintSpec, type PrintSpec } from "@workspace/seasonal/print/spec"

// 에디션 편집기의 판단. 훅(use-edition-editor)은 값을 들고만 있고, 무엇이 바뀌었는지·무엇을 미리 볼지·다음에 할 일은 여기서 정한다.

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

export type EditionDraft = {
  /** 저장한 것과 편집 중인 것이 다르다. */
  dirty: boolean
  /** 편집 중인 사양이 읽히지 않을 때 그 이유. */
  specError: string | undefined
  /** 미리보기에 쓸 사양. 편집 중인 사양이 틀렸으면 저장한 사양을 보여 준다. */
  previewSpec: PrintSpec
  buildState: BuildState
  flow: EditionFlow
}

/** 저장본·편집본·마지막 생성 기록으로 편집기의 지금 상태를 정한다. */
export function editionDraft({ saved, draft, build }: { saved: Edition; draft: Edition; build: BuildRecord | undefined }): EditionDraft {
  const checked = parsePrintSpec(draft.spec)
  const invalid = checked instanceof Error
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
  const buildState: BuildState = !build ? "none" : isBuildCurrent(saved.spec, build) ? "current" : "stale"
  return {
    dirty,
    specError: invalid ? checked.message : undefined,
    previewSpec: invalid ? saved.spec : checked,
    buildState,
    flow: editionFlow({ dirty, invalid, build: buildState }),
  }
}

/** 작업 순서 두 단계 옆에 붙는 한 줄. generatedLabel은 지금 사양으로 만든 PDF의 생성 시각이다. */
export function stepNotes(flow: EditionFlow, { generating, generatedLabel }: { generating: boolean; generatedLabel?: string }): { save: string; pdf: string } {
  const save = flow.save.state === "done" ? "저장됨" : flow.save.state === "current" ? "저장 안 됨" : flow.save.reason
  const pdf = generating
    ? "만드는 중이에요. 끝날 때까지 이 창을 두세요"
    : flow.pdf.state === "done"
      ? `${generatedLabel ?? ""} 생성`.trim()
      : flow.pdf.state === "locked"
        ? flow.pdf.reason
        : flow.pdf.action === "regenerate"
          ? "옛 옵션으로 만든 PDF예요"
          : "아직 만들지 않았어요"
  return { save, pdf }
}
