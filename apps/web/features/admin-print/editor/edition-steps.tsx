"use client"

import { Check } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { stepNotes, type EditionFlow, type StepState } from "../lib/flow"
import type { EditorAction } from "../types"

type Props = {
  flow: EditionFlow
  pending: boolean
  running: EditorAction | undefined
  generatedLabel: string | undefined
  onSave: () => void
  onGenerate: () => void
}

export function EditionSteps({ flow, pending, running, generatedLabel, onSave, onGenerate }: Props) {
  const notes = stepNotes(flow, { generating: running === "generate", generatedLabel })

  return (
    <section aria-label="작업 순서" className="flex flex-col gap-2 rounded-2xl bg-surface px-4 py-3">
      <ol className="flex flex-wrap items-center gap-x-8 gap-y-3">
        <Step
          index={1}
          title="옵션 저장"
          step={flow.save}
          note={notes.save}
          last={false}
          action={
            flow.save.state === "current" && (
              <Button type="button" size="sm" onClick={onSave} disabled={pending}>
                {running === "save" ? "저장하는 중…" : "저장"}
              </Button>
            )
          }
        />
        <Step
          index={2}
          title="PDF 만들기"
          step={flow.pdf}
          note={notes.pdf}
          last
          action={
            flow.pdf.state === "current" ? (
              <Button type="button" size="sm" onClick={onGenerate} disabled={pending}>
                {running === "generate" ? "PDF 만드는 중…" : flow.pdf.action === "regenerate" ? "PDF 다시 만들기" : "PDF 만들기"}
              </Button>
            ) : flow.pdf.state === "done" ? (
              <Button type="button" size="sm" variant="outline" onClick={onGenerate} disabled={pending}>
                {running === "generate" ? "PDF 만드는 중…" : "다시 만들기"}
              </Button>
            ) : null
          }
        />
      </ol>
      {/* live 영역은 비어 있어도 늘 둔다. */}
      <p aria-live="polite" className="text-sm text-stone empty:hidden">
        {flow.phase === "done" ? "" : flow.hint}
      </p>
    </section>
  )
}

function Step({ index, title, step, note, action, last }: { index: number; title: string; step: StepState; note: string; action: React.ReactNode; last: boolean }) {
  const done = step.state === "done"
  const current = step.state === "current"
  return (
    <li aria-current={current ? "step" : undefined} className={cn("flex items-center gap-2.5", last && "sm:border-l sm:border-hairline sm:pl-8")}>
      <span
        aria-hidden="true"
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-full border text-sm tabular-nums",
          done && "border-olive bg-olive text-surface",
          current && "border-gold bg-gold-wash font-bold text-gold-deep",
          step.state === "locked" && "border-hairline text-caption",
        )}
      >
        {done ? <Check className="size-3.5" /> : index}
      </span>
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <span className={cn("font-heading text-base font-bold", step.state === "locked" ? "text-caption" : "text-ink")}>{title}</span>
        <span className={cn("text-sm", current ? "text-gold-deep" : done ? "text-stone" : "text-caption")}>{note}</span>
        {action}
      </div>
    </li>
  )
}
