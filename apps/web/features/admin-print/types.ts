import type { EditionStatus } from "@workspace/seasonal/print/edition"
import type { PrintKind } from "@workspace/seasonal/print/spec"

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string }

export type FormState = { error?: string }

export type EditorAction = "save" | "generate"

export type EditionSummary = {
  id: string
  kind: PrintKind
  title: string
  status: EditionStatus
  currentBuildDate: string | null
}

export type StatusTone = "ok" | "warn" | "idle"
