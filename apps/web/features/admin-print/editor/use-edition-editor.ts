"use client"

import { useMemo, useState, useTransition } from "react"

import { isBuildCurrent, type BuildRecord, type Edition, type EditionStatus } from "@workspace/seasonal/print/edition"
import { parsePrintSpec } from "@workspace/seasonal/print/spec"

import { editionFlow, type BuildState } from "../lib/flow"
import { setAt } from "../lib/spec-path"
import { generateEdition, saveEdition } from "../server/actions"
import type { EditorAction } from "../types"

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
  const buildState: BuildState = !build ? "none" : isBuildCurrent(saved.spec, build) ? "current" : "stale"
  const flow = editionFlow({ dirty, invalid, build: buildState })
  const previewSpec = invalid ? saved.spec : checked

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
    flow,
    dirty,
    buildState,
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
