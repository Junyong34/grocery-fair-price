"use client"

import { useMemo, useState, useTransition } from "react"

import type { BuildRecord, Edition, EditionStatus } from "@workspace/seasonal/print/edition"

import { editionDraft } from "../lib/flow"
import { savePlan } from "../lib/publish"
import { setAt } from "../lib/spec-path"
import { generateEdition, saveEdition } from "../server/actions"
import type { EditorAction } from "../types"

export function useEditionEditor(initial: Edition, initialBuild: BuildRecord | undefined, storageReady: boolean) {
  const [draft, setDraft] = useState(initial)
  const [saved, setSaved] = useState(initial)
  const [build, setBuild] = useState(initialBuild)
  const [error, setError] = useState<string>()
  const [running, setRunning] = useState<EditorAction>()
  const [pending, startTransition] = useTransition()

  const state = useMemo(() => editionDraft({ saved, draft, build }), [saved, draft, build])
  // 저장하면 서버가 같은 판단으로 막는다. 미리 이유를 보여 준다.
  const plan = useMemo(() => savePlan(saved, draft, { build, storageReady }), [saved, draft, build, storageReady])

  const run = (action: EditorAction, task: () => Promise<string | undefined>) => {
    setRunning(action)
    setError(undefined)
    startTransition(async () => {
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
    ...state,
    statusError: "error" in plan ? plan.error : undefined,
    pending,
    running,
    error,
    setTitle: (title: string) => setDraft((current) => ({ ...current, title })),
    setDescription: (description: string) => setDraft((current) => ({ ...current, description })),
    setStatus: (status: EditionStatus) => setDraft((current) => ({ ...current, status })),
    setOption: (path: readonly string[], value: unknown) => setDraft((current) => ({ ...current, spec: setAt(current.spec, path, value) })),
    save,
    generate,
  }
}

export type EditionEditorState = ReturnType<typeof useEditionEditor>
