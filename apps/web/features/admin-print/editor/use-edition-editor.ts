"use client"

import { useMemo, useState, useTransition } from "react"

import { isBuildCurrent, type BuildRecord, type Edition, type EditionStatus } from "@workspace/seasonal/print/edition"
import { parsePrintSpec } from "@workspace/seasonal/print/spec"

import { editionFlow } from "../lib/flow"
import { setAt } from "../lib/spec-path"
import { generateEdition, saveEdition } from "../server/actions"
import type { EditorAction } from "../types"

/**
 * 편집기의 상태. draft는 고치는 중인 값, saved는 마지막으로 저장한 값이다.
 * PDF는 저장한 값으로 만들므로, 저장하지 않은 변경이 있으면 생성을 막는다(editionFlow).
 */
export function useEditionEditor(initial: Edition, initialBuild: BuildRecord | undefined) {
  const [draft, setDraft] = useState(initial)
  const [saved, setSaved] = useState(initial)
  const [build, setBuild] = useState(initialBuild)
  const [error, setError] = useState<string>()
  const [running, setRunning] = useState<EditorAction>()
  const [pending, startTransition] = useTransition()

  const checked = useMemo(() => parsePrintSpec(draft.spec), [draft.spec])
  const invalid = checked instanceof Error
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
  const stale = !isBuildCurrent(saved.spec, build)
  const flow = editionFlow({ dirty, invalid, hasBuild: Boolean(build), stale })
  /** 미리보기에 그릴 사양. 고치는 값이 틀렸으면 저장한 값으로 그린다. */
  const previewSpec = invalid ? saved.spec : checked

  const run = (action: EditorAction, task: () => Promise<string | undefined>) => {
    setRunning(action)
    setError(undefined)
    startTransition(async () => {
      // 성공은 작업 순서 표시가 알려 주므로 오류만 남긴다.
      setError(await task())
      setRunning(undefined)
    })
  }

  const save = () =>
    run("save", async () => {
      const result = await saveEdition(draft)
      if (!result.ok) return result.error
      setSaved(draft)
    })

  const generate = () =>
    run("generate", async () => {
      const result = await generateEdition(saved.id)
      if (!result.ok) return result.error
      setBuild(result.data)
    })

  return {
    draft,
    saved,
    build,
    flow,
    dirty,
    stale,
    pending,
    running,
    error,
    specError: invalid ? checked.message : undefined,
    previewSpec,
    setTitle: (title: string) => setDraft((current) => ({ ...current, title })),
    setDescription: (description: string) => setDraft((current) => ({ ...current, description })),
    setStatus: (status: EditionStatus) => setDraft((current) => ({ ...current, status })),
    setOption: (path: readonly string[], value: unknown) => setDraft((current) => ({ ...current, spec: setAt(current.spec, path, value) })),
    save,
    generate,
  }
}

export type EditionEditorState = ReturnType<typeof useEditionEditor>
