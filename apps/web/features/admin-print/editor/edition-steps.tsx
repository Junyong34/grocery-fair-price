"use client"

import { Check } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import type { EditionFlow, StepState } from "../lib/flow"
import type { EditorAction } from "../types"

type Props = {
  flow: EditionFlow
  /** 저장 또는 PDF 생성이 진행 중이다. */
  pending: boolean
  running: EditorAction | undefined
  /** 최신 PDF를 만든 시각("2026-10-16 21:55"). 없으면 undefined */
  generatedAt: string | undefined
  onSave: () => void
  onGenerate: () => void
}

/**
 * 편집기 맨 위의 작업 순서: ① 옵션 저장 → ② PDF 만들기.
 * 지금 할 일 하나에만 버튼을 두고, 못 누르는 단계에는 이유를 적는다. 아래 한 줄은 지금 상태를 풀어 쓴다.
 */
export function EditionSteps({ flow, pending, running, generatedAt, onSave, onGenerate }: Props) {
  const saveNote = flow.save.state === "done" ? "저장됨" : flow.save.state === "current" ? "저장 안 됨" : flow.save.reason
  const pdfNote =
    running === "generate"
      ? "만드는 중이에요. 끝날 때까지 이 창을 두세요"
      : flow.pdf.state === "done"
      ? `${generatedAt ?? ""} 생성`.trim()
      : flow.pdf.state === "locked"
        ? flow.pdf.reason
        : flow.pdf.action === "regenerate"
          ? "옛 옵션으로 만든 PDF예요"
          : "아직 만들지 않았어요"

  return (
    <section aria-label="작업 순서" className="flex flex-col gap-2 rounded-2xl bg-surface px-4 py-3">
      <ol className="flex flex-wrap items-center gap-x-8 gap-y-3">
        <Step
          index={1}
          title="옵션 저장"
          step={flow.save}
          note={saveNote}
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
          note={pdfNote}
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
      {/* 끝난 뒤에는 아래 "만든 PDF" 카드가 말해 주므로 안내를 비운다. live 영역은 늘 둔다. */}
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
