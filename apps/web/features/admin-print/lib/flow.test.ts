import { describe, expect, it } from "vitest"

import type { BuildRecord, Edition } from "@workspace/seasonal/print/edition"
import { DEFAULT_SPECS, specHash, type PrintSpec } from "@workspace/seasonal/print/spec"

import { editionDraft, editionFlow, stepNotes } from "./flow"

const base = { dirty: false, invalid: false, build: "current" } as const

describe("editionFlow", () => {
  it("저장하지 않은 변경이 있으면 저장이 지금 할 일이고 PDF는 잠긴다", () => {
    const flow = editionFlow({ ...base, dirty: true })
    expect(flow.phase).toBe("unsaved")
    expect(flow.save).toEqual({ state: "current" })
    expect(flow.pdf).toEqual({ state: "locked", reason: "먼저 저장하세요" })
  })

  it("옵션에 오류가 있으면 저장이 막히고 이유를 돌려준다", () => {
    const flow = editionFlow({ ...base, dirty: true, invalid: true })
    expect(flow.save).toEqual({ state: "locked", reason: "옵션의 오류를 먼저 고치세요" })
  })

  it("저장했고 PDF가 없으면 PDF 만들기가 지금 할 일이다", () => {
    const flow = editionFlow({ ...base, build: "none" })
    expect(flow.phase).toBe("no-pdf")
    expect(flow.save.state).toBe("done")
    expect(flow.pdf).toEqual({ state: "current", action: "generate" })
  })

  it("저장한 옵션이 만든 PDF와 다르면 다시 만들기가 지금 할 일이다", () => {
    const flow = editionFlow({ ...base, build: "stale" })
    expect(flow.phase).toBe("outdated")
    expect(flow.pdf).toEqual({ state: "current", action: "regenerate" })
  })

  it("저장한 옵션으로 만든 PDF가 있으면 모두 끝이다", () => {
    const flow = editionFlow(base)
    expect(flow.phase).toBe("done")
    expect(flow.save.state).toBe("done")
    expect(flow.pdf).toEqual({ state: "done" })
  })

  it("이전 PDF가 있어도 저장 전에는 옵션을 바꾸는 중이라고 안내한다", () => {
    const flow = editionFlow({ ...base, dirty: true, build: "stale" })
    expect(flow.phase).toBe("unsaved")
    expect(flow.hint).toContain("저장")
  })
})

const edition: Edition = { id: "monthly-1", title: "2027 달력", description: "", status: "draft", spec: DEFAULT_SPECS.monthly }
const buildOf = (spec: PrintSpec): BuildRecord => ({ specHash: specHash(spec), generatedAt: "2026-10-20T00:00:00.000Z", bytes: {} })

describe("editionDraft", () => {
  it("편집본이 저장본과 같으면 바뀐 게 없다", () => {
    const state = editionDraft({ saved: edition, draft: { ...edition }, build: buildOf(edition.spec) })
    expect(state.dirty).toBe(false)
    expect(state.buildState).toBe("current")
    expect(state.flow.phase).toBe("done")
  })

  it("옵션을 바꾸면 바뀐 것이고, 미리보기는 편집본을 따른다", () => {
    const draft = { ...edition, spec: { ...edition.spec, cover: "none" as const } }
    const state = editionDraft({ saved: edition, draft, build: undefined })
    expect(state.dirty).toBe(true)
    expect(state.previewSpec).toEqual(draft.spec)
    expect(state.flow.phase).toBe("unsaved")
  })

  it("편집본 사양이 틀리면 이유를 내고, 미리보기는 저장본으로 남는다", () => {
    const draft = { ...edition, spec: { ...edition.spec, year: 1900 } }
    const state = editionDraft({ saved: edition, draft, build: undefined })
    expect(state.specError).toBeTruthy()
    expect(state.previewSpec).toBe(edition.spec)
    expect(state.flow.save.state).toBe("locked")
  })

  it("만든 PDF의 사양이 저장본과 다르면 옛 PDF다(편집본은 보지 않는다)", () => {
    const old = { ...edition.spec, cover: "none" as const }
    expect(editionDraft({ saved: edition, draft: edition, build: buildOf(old) }).buildState).toBe("stale")
    const draft = { ...edition, spec: old }
    expect(editionDraft({ saved: edition, draft, build: buildOf(edition.spec) }).buildState).toBe("current")
  })
})

describe("stepNotes", () => {
  it("만드는 중이면 PDF 단계에 기다리라고 쓴다", () => {
    expect(stepNotes(editionFlow({ ...base, build: "none" }), { generating: true }).pdf).toContain("만드는 중")
  })

  it("끝났으면 생성 시각을, 저장 전이면 잠긴 이유를 쓴다", () => {
    expect(stepNotes(editionFlow(base), { generating: false, generatedLabel: "10월 20일" })).toEqual({ save: "저장됨", pdf: "10월 20일 생성" })
    expect(stepNotes(editionFlow({ ...base, dirty: true }), { generating: false })).toEqual({ save: "저장 안 됨", pdf: "먼저 저장하세요" })
  })
})
